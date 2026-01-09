// --- SAHTE VERİTABANI (LocalStorage Kullanır) ---
// Eğer daha önce veri yoksa örnek veriler yükleyelim
const defaultData = [
    {
        vin: "123456789",
        plate: "34 IST 34",
        model: "Fiat Egea 1.4 Fire",
        owner: "Ahmet Yılmaz",
        history: [
            { date: "2023-05-10", km: "15000", desc: "15 Bin Bakımı (Yağ, Filtre)", master: "Mehmet Usta" },
            { date: "2024-01-20", km: "30000", desc: "Balata Değişimi", master: "Servis A" }
        ]
    }
];

// Verileri LocalStorage'dan çek veya varsayılanı kullan
function getDB() {
    const db = localStorage.getItem('otoServisDB');
    return db ? JSON.parse(db) : defaultData;
}

// Verileri Kaydet
function saveDB(data) {
    localStorage.setItem('otoServisDB', JSON.stringify(data));
    updateAdminList(); // Admin listesini güncelle
}

// --- SAYFA YÖNETİMİ ---

// Sayfa yüklendiğinde URL'de "vin" parametresi var mı bak (QR ile mi gelindi?)
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const vinParam = urlParams.get('vin');

    if (vinParam) {
        showReport(vinParam);
    }
    updateAdminList();
});

// Usta Girişi (Basit Şifre Kontrolü)
function toggleLogin() {
    const password = prompt("Usta Şifresini Giriniz (Örnek: 1234):");
    if (password === "1234") {
        document.getElementById('home-screen').classList.add('d-none');
        document.getElementById('report-screen').classList.add('d-none');
        document.getElementById('admin-panel').classList.remove('d-none');
        updateAdminList();
    } else if (password !== null) {
        alert("Hatalı Şifre!");
    }
}

function logout() {
    location.reload(); // Sayfayı yenile
}

function goHome() {
    window.location.href = window.location.pathname; // URL parametrelerini temizle ve ana sayfaya dön
}

// --- MÜŞTERİ İŞLEMLERİ ---

function searchVehicle() {
    const vin = document.getElementById('search-vin').value;
    if (vin) showReport(vin);
}

// İsim Maskeleme (KVKK) - Örn: Ahmet Yılmaz -> A*** Y***
function maskName(fullName) {
    return fullName.split(' ').map(name => name[0] + '***').join(' ');
}

function showReport(vin) {
    const db = getDB();
    const vehicle = db.find(v => v.vin === vin);

    if (!vehicle) {
        alert("Bu şasi numarasına ait kayıt bulunamadı!");
        return;
    }

    // Ekranları değiştir
    document.getElementById('home-screen').classList.add('d-none');
    document.getElementById('admin-panel').classList.add('d-none');
    document.getElementById('report-screen').classList.remove('d-none');

    // Verileri Doldur
    document.getElementById('display-model').innerText = vehicle.model;
    document.getElementById('display-vin').innerText = vehicle.vin;
    document.getElementById('display-plate').innerText = vehicle.plate;
    document.getElementById('display-owner').innerText = maskName(vehicle.owner);

    // Tabloyu Temizle ve Doldur
    const tbody = document.getElementById('history-table-body');
    tbody.innerHTML = "";
    
    if (vehicle.history.length === 0) {
        document.getElementById('no-history-msg').classList.remove('d-none');
    } else {
        document.getElementById('no-history-msg').classList.add('d-none');
        vehicle.history.forEach(item => {
            const row = `
                <tr>
                    <td>${item.date}</td>
                    <td>${item.km} KM</td>
                    <td>${item.desc}</td>
                    <td>${item.master}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }
}

// --- USTA / ADMİN İŞLEMLERİ ---

// Yeni Araç Kayıt
document.getElementById('new-vehicle-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const db = getDB();
    
    const newVehicle = {
        plate: document.getElementById('new-plate').value,
        vin: document.getElementById('new-vin').value,
        model: document.getElementById('new-model').value,
        owner: document.getElementById('new-owner').value,
        history: []
    };

    // Aynı şasi var mı kontrol et
    if (db.find(v => v.vin === newVehicle.vin)) {
        alert("Bu Şasi numarası zaten kayıtlı!");
        return;
    }

    db.push(newVehicle);
    saveDB(db);
    alert("Araç Başarıyla Kaydedildi!");
    this.reset();
});

// Servis Kaydı Ekleme
document.getElementById('new-service-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const db = getDB();
    const targetVin = document.getElementById('service-vin').value;
    
    const vehicle = db.find(v => v.vin === targetVin);
    if (!vehicle) {
        alert("Araç bulunamadı! Önce aracı kaydedin.");
        return;
    }

    const newService = {
        km: document.getElementById('service-km').value,
        desc: document.getElementById('service-desc').value,
        master: document.getElementById('service-master').value,
        date: document.getElementById('service-date').value
    };

    vehicle.history.push(newService);
    saveDB(db);
    alert("İşlem Başarıyla Eklendi!");
    this.reset();
});

// Admin Panelinde Araçları Listele ve QR Kod Göster
function updateAdminList() {
    const db = getDB();
    const container = document.getElementById('admin-vehicle-list');
    container.innerHTML = "";

    db.forEach((v, index) => {
        // QR Linkini Oluştur (Mevcut sayfa URL'si + ?vin=...)
        const fullUrl = `${window.location.origin}${window.location.pathname}?vin=${v.vin}`;
        
        const cardHtml = `
            <div class="col-md-4 mb-4">
                <div class="card h-100 border-primary">
                    <div class="card-body text-center">
                        <h5 class="card-title">${v.model}</h5>
                        <p class="card-text text-muted">${v.plate}</p>
                        
                        <div id="qrcode-${index}" class="d-flex justify-content-center my-3"></div>
                        
                        <small class="text-break" style="font-size:10px;">${fullUrl}</small>
                        <br>
                        <a href="${fullUrl}" target="_blank" class="btn btn-sm btn-outline-primary mt-2">Sayfaya Git</a>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;

        // QR Kodu Çizdir (Biraz gecikmeli çünkü DOM yeni oluştu)
        setTimeout(() => {
            document.getElementById(`qrcode-${index}`).innerHTML = ""; // Temizle
            new QRCode(document.getElementById(`qrcode-${index}`), {
                text: fullUrl,
                width: 128,
                height: 128
            });
        }, 100);
    });
}
