// Bu dosya tüm sayfalara eklenebilir
// Kullanım: <script src="../scripts/common.js"></script>

// Kullanıcı adını göster
function displayUserInfo() {
    const auth = window.authManager;
    if (auth && auth.getUser()) {
        const user = auth.getUser();
        
        // Kullanıcı bilgilerini DOM'a yaz
        document.querySelectorAll('[data-username], .user-name').forEach(el => {
            el.textContent = user.username;
        });
        
        document.querySelectorAll('[data-email], .user-email').forEach(el => {
            el.textContent = user.email;
        });
        
        document.querySelectorAll('[data-usertype], .user-type').forEach(el => {
            el.textContent = user.user_type === 'bayi' ? 'Bayi' : 'İşletme';
        });
    }
}

// Logout butonu için
function setupLogout() {
    document.querySelectorAll('[data-logout], .logout-btn, #logoutBtn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
                try {
                    const response = await fetch('/api/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    
                    if (response.ok) {
                        window.location.href = '/index.html';
                    }
                } catch (error) {
                    console.error('Çıkış hatası:', error);
                    window.location.href = '/index.html';
                }
            }
        });
    });
}

// Sayfa yüklendiğinde çalıştır
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        displayUserInfo();
        setupLogout();
    });
} else {
    displayUserInfo();
    setupLogout();
}
