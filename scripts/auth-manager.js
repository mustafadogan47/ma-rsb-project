// Session kontrolü ve kullanıcı yönetimi
class AuthManager {
    constructor(requiredUserType) {
        this.requiredUserType = requiredUserType; // 'bayi' veya 'isletme'
        this.user = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupLogout();
        this.displayUserInfo();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/user', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                // Kullanıcı giriş yapmamış
                this.redirectToLogin();
                return;
            }

            const data = await response.json();

            if (data.success && data.user) {
                this.user = data.user;

                // Kullanıcı türü kontrolü
                if (this.requiredUserType && this.user.user_type !== this.requiredUserType) {
                    alert('Bu sayfaya erişim yetkiniz yok!');
                    this.logout();
                    return;
                }
            } else {
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Auth kontrol hatası:', error);
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        window.location.href = '/index.html';
    }

    async logout() {
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

    setupLogout() {
        // Event delegation with a flag to prevent double execution
        let isProcessing = false;
        
        // Delegate event listener for all logout buttons (including dynamically added)
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-logout], .logout-btn, #logoutBtn');
            if (target && !isProcessing) {
                e.preventDefault();
                e.stopPropagation();
                isProcessing = true;
                
                if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
                    this.logout();
                } else {
                    isProcessing = false;
                }
            }
        });
    }

    displayUserInfo() {
        if (!this.user) return;

        // Kullanıcı adını göster
        const userNameElements = document.querySelectorAll('[data-username], .user-name');
        userNameElements.forEach(el => {
            el.textContent = this.user.username;
        });

        // Email göster
        const emailElements = document.querySelectorAll('[data-email], .user-email');
        emailElements.forEach(el => {
            el.textContent = this.user.email;
        });

        // Kullanıcı türünü göster
        const typeElements = document.querySelectorAll('[data-usertype], .user-type');
        typeElements.forEach(el => {
            el.textContent = this.user.user_type === 'bayi' ? 'Bayi' : 'İşletme';
        });
    }

    getUser() {
        return this.user;
    }

    getUserType() {
        return this.user ? this.user.user_type : null;
    }

    getUsername() {
        return this.user ? this.user.username : null;
    }
}

// Kullanım:
// Bayi sayfalarında: const auth = new AuthManager('bayi');
// İşletme sayfalarında: const auth = new AuthManager('isletme');
