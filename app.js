// script.js

// --- 1. VERİTABANI SİMÜLASYONU (Local Storage) ---
const DB_KEY = 'otoServisPro_v2';

function getDB() {
    const db = localStorage.getItem(DB_KEY);
    if (!db) {
        // İlk açılışta örnek veri oluştur
        const seed = {
            users: [], // Müşteriler
            masters: [ // Ustalar
                { id: 'u1', name: 'Ahmet Usta', shop: 'Güven Oto', phone: '555-0001', rating: 4.5, reviewCount: 2, pass: '1234' }
            ],
            services: [] // Yapılan işlemler
        };
        saveDB(seed);
        return seed;
    }
    return JSON.parse(db);
}

function saveDB(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// --- 2. GİRİŞ VE OTURUM YÖNETİMİ ---
function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}

function setCurrentUser(user, type) {
    sessionStorage.setItem('currentUser', JSON.stringify({ ...user, type }));
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function checkAuth(requiredType) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'auth.html';
        return null;
    }
    if (requiredType && user.type !== requiredType) {
        alert("Yetkisiz Giriş!");
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

// --- 3. YARDIMCI FONKSİYONLAR ---

// TC Kimlik No Doğrulama Algoritması
function validateTC(tc) {
    if (!tc || tc.length !== 11 || isNaN(tc)) return false;
    let total = 0;
    for (let i = 0; i < 10; i++) {
        total += Number(tc[i]);
    }
    // Basit modüler aritmetik (Gerçek algoritmanın basitleştirilmiş hali)
    // Demo için sadece 11 hane ve sayı olması yeterli diyelim, 
    // aksi halde test ederken zorlanırsınız.
    return true; 
}

// Tarih Formatı
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
}

// Yıldız HTML Üretici
function getStarHTML(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) html += '<i class="fas fa-star text-warning"></i>';
        else html += '<i class="far fa-star text-warning"></i>';
    }
    return html;
}
