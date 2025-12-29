// Authentication handling
document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Modal controls
    const loginBtns = [
        document.getElementById('loginBtn'),
        document.getElementById('heroLoginBtn')
    ];
    
    const registerBtns = [
        document.getElementById('registerBtn'),
        document.getElementById('heroRegisterBtn'),
        document.getElementById('ctaRegisterBtn')
    ];

    const closeLogin = document.getElementById('closeLogin');
    const closeRegister = document.getElementById('closeRegister');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');

    // User type selection elements
    const loginUserTypeSelection = document.getElementById('loginUserTypeSelection');
    const registerUserTypeSelection = document.getElementById('registerUserTypeSelection');
    const loginUserTypeInput = document.getElementById('loginUserType');
    const registerUserTypeInput = document.getElementById('registerUserType');
    const loginBackBtn = document.getElementById('loginBackBtn');
    const registerBackBtn = document.getElementById('registerBackBtn');

    // Handle user type card clicks for login
    document.querySelectorAll('#loginUserTypeSelection .user-type-card').forEach(card => {
        card.addEventListener('click', () => {
            const userType = card.getAttribute('data-type');
            loginUserTypeInput.value = userType;
            loginUserTypeSelection.style.display = 'none';
            loginForm.style.display = 'block';
        });
    });

    // Handle user type card clicks for register
    document.querySelectorAll('#registerUserTypeSelection .user-type-card').forEach(card => {
        card.addEventListener('click', () => {
            const userType = card.getAttribute('data-type');
            registerUserTypeInput.value = userType;
            registerUserTypeSelection.style.display = 'none';
            registerForm.style.display = 'block';
        });
    });

    // Back buttons
    loginBackBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        loginUserTypeSelection.style.display = 'block';
        loginForm.reset();
        document.getElementById('loginAlert').style.display = 'none';
    });

    registerBackBtn.addEventListener('click', () => {
        registerForm.style.display = 'none';
        registerUserTypeSelection.style.display = 'block';
        registerForm.reset();
        document.getElementById('registerAlert').style.display = 'none';
    });

    // Open login modal
    loginBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                loginModal.style.display = 'block';
                registerModal.style.display = 'none';
                resetLoginForm();
            });
        }
    });

    // Open register modal
    registerBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                registerModal.style.display = 'block';
                loginModal.style.display = 'none';
                resetRegisterForm();
            });
        }
    });

    // Close modals
    closeLogin.addEventListener('click', () => {
        loginModal.style.display = 'none';
        resetLoginForm();
    });

    closeRegister.addEventListener('click', () => {
        registerModal.style.display = 'none';
        resetRegisterForm();
    });

    // Switch between modals
    switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'none';
        registerModal.style.display = 'block';
        resetRegisterForm();
    });

    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.style.display = 'none';
        loginModal.style.display = 'block';
        resetLoginForm();
    });

    // Reset form functions
    function resetLoginForm() {
        loginForm.reset();
        loginForm.style.display = 'none';
        loginUserTypeSelection.style.display = 'block';
        document.getElementById('loginAlert').style.display = 'none';
    }

    function resetRegisterForm() {
        registerForm.reset();
        registerForm.style.display = 'none';
        registerUserTypeSelection.style.display = 'block';
        document.getElementById('registerAlert').style.display = 'none';
    }

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
            resetLoginForm();
        }
        if (e.target === registerModal) {
            registerModal.style.display = 'none';
            resetRegisterForm();
        }
    });

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const data = {
            username: formData.get('username'),
            password: formData.get('password'),
            user_type: formData.get('user_type')
        };

        const loginAlert = document.getElementById('loginAlert');
        loginAlert.style.display = 'none';

        // Validation
        if (!data.user_type) {
            showAlert(loginAlert, 'Lütfen kullanıcı türünü seçin', 'error');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                showAlert(loginAlert, 'Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
                setTimeout(() => {
                    window.location.href = result.redirectUrl;
                }, 1500);
            } else {
                showAlert(loginAlert, result.message, 'error');
            }
        } catch (error) {
            showAlert(loginAlert, 'Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
        }
    });

    // Register form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(registerForm);
        const data = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            user_type: formData.get('user_type')
        };

        const registerAlert = document.getElementById('registerAlert');
        registerAlert.style.display = 'none';

        // Validation
        if (!data.user_type) {
            showAlert(registerAlert, 'Lütfen kullanıcı türünü seçin', 'error');
            return;
        }

        if (data.password.length < 6) {
            showAlert(registerAlert, 'Şifre en az 6 karakter olmalıdır', 'error');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                showAlert(registerAlert, result.message, 'success');
                setTimeout(() => {
                    registerModal.style.display = 'none';
                    loginModal.style.display = 'block';
                    registerForm.reset();
                }, 2000);
            } else {
                showAlert(registerAlert, result.message, 'error');
            }
        } catch (error) {
            showAlert(registerAlert, 'Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
        }
    });

    // Helper function to show alerts
    function showAlert(element, message, type) {
        element.textContent = message;
        element.className = `alert alert-${type}`;
        element.style.display = 'block';

        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }
});
