/**
 * OtoServis Pro - Core Application Logic
 * Yapı: SPA (Single Page Application)
 * Veri Yönetimi: LocalStorage (Simüle edilmiş veritabanı)
 */

class App {
    constructor() {
        // --- Sabitler ve Durumlar ---
        this.DB_KEY = 'otoServisPro_DB_v1';
        this.currentUser = null;
        this.currentView = 'view-login';

        // --- Veritabanı Başlatma ---
        this.db = this.loadDB();

        // --- Event Listener'ları Başlat ---
        this.initEvents();
        this.checkSession();
    }

    // --- VERİTABANI YÖNETİMİ ---
    loadDB() {
        const stored = localStorage.getItem(this.DB_KEY);
        if (stored) return JSON.parse(stored);

        // İlk kez çalışıyorsa varsayılan verileri oluştur
        const seedData = {
            users: [], // Müşteriler
            masters: [ // Örnek Usta
                { 
                    id: '1', 
                    username: 'usta1', 
                    password: '123', 
                    name: 'Mehmet Usta', 
                    shopName: 'Güven Oto Performans',
                    rating: 4.8,
                    ratingCount: 12
                }
            ],
            services: [] // Yapılan işlemler
        };
        this.saveDB(seedData);
        return seedData;
    }

    saveDB(data) {
        localStorage.setItem(this.DB_KEY, JSON.stringify(data));
        this.db = data; // Hafızayı da güncelle
    }

    // --- YÖNLENDİRME (ROUTER) ---
    router(viewName) {
        // Tüm view'ları gizle
        document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
        
        // İstenen view'ı göster
        const target = document.getElementById(`view-${viewName}`);
        if (target) {
            target.classList.remove('hidden');
            this.currentView = viewName;
        } else {
            console.error('View bulunamadı:', viewName);
        }

        // View'a özel yükleme işlemleri
        if (viewName === 'user-dashboard') this.loadUserDashboard();
        if (viewName === 'master-dashboard') this.loadMasterDashboard();
    }

    // --- OTURUM YÖNETİMİ ---
    checkSession() {
        const sessionUser = sessionStorage.getItem('currentUser');
        if (sessionUser) {
            this.currentUser = JSON.parse(sessionUser);
            this.updateNavbar();
            if (this.currentUser.role === 'master') {
                this.router('master-dashboard');
            } else {
                this.router('user-dashboard');
            }
        } else {
            this.router('login');
        }
    }

    login(id, password) {
        // 1. Önce Usta Kontrolü
        const master = this.db.masters.find(m => (m.username === id || m.id === id) && m.password === password);
        if (master) {
            this.setSession(master, 'master');
            this.showToast('Giriş Başarılı (Usta)', 'success');
            return;
        }

        // 2. Kullanıcı Kontrolü
        const user = this.db.users.find(u => u.tc === id && u.password === password);
        if (user) {
            this.setSession(user, 'user');
            this.showToast('Giriş Başarılı', 'success');
            return;
        }

        this.showToast('Hatalı ID veya Şifre!', 'error');
    }

    register(data) {
        // Mükerrer Kayıt Kontrolü
        if (this.db.users.find(u => u.tc === data.tc)) {
            this.showToast('Bu TC Kimlik No zaten kayıtlı.', 'error');
            return;
        }
        if (this.db.users.find(u => u.plate === data.plate)) {
            this.showToast('Bu Plaka zaten sisteme kayıtlı.', 'error');
            return;
        }

        // Yeni Kullanıcı Objesi
        const newUser = {
            id: 'u_' + Date.now(),
            role: 'user',
            name: data.name,
            tc: data.tc,
            password: data.password,
            plate: data.plate,
            vin: data.vin,
            model: data.model,
            createdAt: new Date().toISOString()
        };

        // Veritabanına Ekle
        this.db.users.push(newUser);
        this.saveDB(this.db);
        
        this.showToast('Kayıt Başarılı! Yönlendiriliyorsunuz...', 'success');
        
        // Otomatik Giriş
        setTimeout(() => this.setSession(newUser, 'user'), 1500);
    }

    setSession(user, role) {
        const sessionData = { ...user, role };
        sessionStorage.setItem('currentUser', JSON.stringify(sessionData));
        this.currentUser = sessionData;
        this.updateNavbar();
        
        if (role === 'master') this.router('master-dashboard');
        else this.router('user-dashboard');
    }

    logout() {
        sessionStorage.removeItem('currentUser');
        this.currentUser = null;
        this.updateNavbar();
        this.router('login');
        this.showToast('Çıkış yapıldı.', 'success');
    }

    updateNavbar() {
        const display = document.getElementById('user-display');
        const logoutBtn = document.getElementById('logout-btn');

        if (this.currentUser) {
            display.textContent = `👤 ${this.currentUser.name}`;
            display.classList.remove('hidden');
            logoutBtn.classList.remove('hidden');
        } else {
            display.classList.add('hidden');
            logoutBtn.classList.add('hidden');
        }
    }

    // --- MÜŞTERİ EKRANI FONKSİYONLARI ---
    loadUserDashboard() {
        if (!this.currentUser) return;

        // Araç Bilgileri
        const infoText = `${this.currentUser.plate} - ${this.currentUser.model} (Şasi: ${this.currentUser.vin})`;
        document.getElementById('user-car-detail').textContent = infoText;

        // QR Kod Oluştur (Eğer zaten varsa temizle)
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: `https://otoservispro.com/check?vin=${this.currentUser.vin}`, // Demo Link
            width: 100,
            height: 100
        });

        // Geçmişi Listele
        const myServices = this.db.services.filter(s => s.vin === this.currentUser.vin);
        const tbody = document.getElementById('user-history-body');
        const emptyState = document.getElementById('user-empty-state');
        
        tbody.innerHTML = '';

        if (myServices.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            // Tarihe göre yeniden eskiye sırala
            myServices.sort((a, b) => new Date(b.date) - new Date(a.date));

            myServices.forEach(s => {
                const tr = document.createElement('tr');
                
                // Usta ismini bul (ID'den)
                const master = this.db.masters.find(m => m.id === s.masterId);
                const masterName = master ? `${master.shopName}` : 'Bilinmeyen Servis';

                // Puanlama Durumu
                let actionHtml = '';
                if (s.isRated) {
                    actionHtml = `<span class="status-badge status-completed"><i class="fa-solid fa-check"></i> Puanlandı (${s.rating})</span>`;
                } else {
                    actionHtml = `<button onclick="app.openRateModal('${s.id}')" class="btn btn-outline btn-sm">Puanla</button>`;
                }

                tr.innerHTML = `
                    <td>${this.formatDate(s.date)}</td>
                    <td><strong>${masterName}</strong><br><small class="text-muted">${master ? master.name : ''}</small></td>
                    <td>${s.km} KM</td>
                    <td>${s.desc}</td>
                    <td>${actionHtml}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    // --- USTA EKRANI FONKSİYONLARI ---
    loadMasterDashboard() {
        if (!this.currentUser) return;
        
        // İstatistikler
        document.getElementById('master-rating').textContent = this.currentUser.rating || '0.0';
        document.getElementById('master-count').textContent = this.currentUser.ratingCount || '0';

        // Son İşlemleri Listele (Tüm DB'den bu ustanınkileri çek)
        const myWorks = this.db.services.filter(s => s.masterId === this.currentUser.id);
        const listContainer = document.getElementById('master-recent-list');
        listContainer.innerHTML = '';

        // Son 5 işlem
        myWorks.slice(-5).reverse().forEach(w => {
            const li = document.createElement('li');
            li.style.cssText = "padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;";
            li.innerHTML = `
                <span><strong>${w.plate}</strong> - ${w.desc.substring(0, 30)}...</span>
                <span class="text-muted">${this.formatDate(w.date)}</span>
            `;
            listContainer.appendChild(li);
        });
    }

    checkPlate() {
        const plate = document.getElementById('serv-plate').value.trim().toUpperCase();
        const statusEl = document.getElementById('plate-status');
        
        if (!plate) return;

        const user = this.db.users.find(u => u.plate === plate);
        if (user) {
            statusEl.textContent = `✅ Araç Bulundu: ${user.model} (${user.name})`;
            statusEl.style.color = 'green';
            return user;
        } else {
            statusEl.textContent = `❌ Araç bulunamadı. Lütfen önce müşterinin kayıt olmasını sağlayın.`;
            statusEl.style.color = 'red';
            return null;
        }
    }

    addService(data) {
        // Plaka kontrolü tekrar
        const user = this.db.users.find(u => u.plate === data.plate);
        if (!user) {
            this.showToast('Kayıtlı olmayan plakaya işlem yapılamaz!', 'error');
            return;
        }

        const newService = {
            id: 'srv_' + Date.now(),
            masterId: this.currentUser.id,
            vin: user.vin,
            plate: user.plate,
            km: data.km,
            date: data.date,
            desc: data.desc,
            isRated: false,
            rating: 0,
            comment: ''
        };

        this.db.services.push(newService);
        this.saveDB(this.db);
        this.showToast('Servis kaydı başarıyla eklendi.', 'success');
        
        // Formu temizle
        document.getElementById('service-add-form').reset();
        document.getElementById('plate-status').textContent = '';
        this.loadMasterDashboard(); // Listeyi güncelle
    }

    // --- PUANLAMA SİSTEMİ ---
    openRateModal(serviceId) {
        this.currentServiceId = serviceId;
        const modal = document.getElementById('modal-rate');
        modal.classList.remove('hidden');
        
        // Yıldız seçimi resetle
        document.querySelectorAll('.star-rating i').forEach(star => {
            star.className = 'fa-regular fa-star';
        });
        this.selectedRating = 0;
    }

    closeModal() {
        document.getElementById('modal-rate').classList.add('hidden');
    }

    submitRating() {
        const comment = document.getElementById('rate-comment').value;
        if (this.selectedRating === 0) {
            this.showToast('Lütfen bir puan seçin.', 'error');
            return;
        }

        // Servisi bul ve güncelle
        const sIndex = this.db.services.findIndex(s => s.id === this.currentServiceId);
        if (sIndex > -1) {
            this.db.services[sIndex].isRated = true;
            this.db.services[sIndex].rating = this.selectedRating;
            this.db.services[sIndex].comment = comment;

            // Ustanın puanını güncelle
            const mIndex = this.db.masters.findIndex(m => m.id === this.db.services[sIndex].masterId);
            if (mIndex > -1) {
                const master = this.db.masters[mIndex];
                // Ortalama hesaplama
                const totalScore = (master.rating * master.ratingCount) + this.selectedRating;
                master.ratingCount++;
                master.rating = (totalScore / master.ratingCount).toFixed(1);
            }

            this.saveDB(this.db);
            this.showToast('Değerlendirme kaydedildi, teşekkürler!', 'success');
            this.closeModal();
            this.loadUserDashboard();
        }
    }

    // --- UI EVENT BINDING ---
    initEvents() {
        // Login Form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('login-id').value.trim();
            const pass = document.getElementById('login-pass').value.trim();
            this.login(id, pass);
        });

        // Register Form
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('reg-name').value.trim(),
                tc: document.getElementById('reg-tc').value.trim(),
                password: document.getElementById('reg-pass').value.trim(),
                plate: document.getElementById('reg-plate').value.trim().toUpperCase(),
                vin: document.getElementById('reg-vin').value.trim().toUpperCase(),
                model: document.getElementById('reg-model').value.trim()
            };
            this.register(data);
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Usta: İşlem Ekleme
        const srvForm = document.getElementById('service-add-form');
        if(srvForm) {
            srvForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const data = {
                    plate: document.getElementById('serv-plate').value.trim().toUpperCase(),
                    km: document.getElementById('serv-km').value,
                    date: document.getElementById('serv-date').value,
                    desc: document.getElementById('serv-desc').value
                };
                this.addService(data);
            });
        }

        // Yıldız Tıklama
        document.querySelectorAll('.star-rating i').forEach(star => {
            star.addEventListener('click', (e) => {
                const val = parseInt(e.target.dataset.val);
                this.selectedRating = val;
                // Görsel güncelle
                document.querySelectorAll('.star-rating i').forEach(s => {
                    const sVal = parseInt(s.dataset.val);
                    s.className = sVal <= val ? 'fa-solid fa-star' : 'fa-regular fa-star';
                });
            });
        });

        // Puan Gönderme Butonu
        document.getElementById('btn-submit-rate').addEventListener('click', () => this.submitRating());
    }

    // --- Yardımcılar ---
    showToast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = type === 'success' ? `<i class="fa-solid fa-circle-check"></i> ${msg}` : `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
}

// Uygulamayı Başlat
const app = new App();
