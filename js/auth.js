document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const modal = document.getElementById('authModal');
    const loginBtn = document.getElementById('loginBtn');
    const closeBtn = document.querySelector('.close');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const userMenu = document.getElementById('userMenu');
    const userButton = document.getElementById('userButton');
    const dropdown = document.getElementById('dropdown');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    const logoutBtn = document.getElementById('logoutBtn');
    let scrollPosition = 0;

    // Check if user is logged in on page load
    checkLoginStatus();

    // Modal functionality
    loginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        scrollPosition = window.pageYOffset;
        modal.style.display = 'flex';
        document.body.style.top = `-${scrollPosition}px`;
        document.body.classList.add('modal-open');
        showLoginForm();
    });

    closeBtn.addEventListener('click', function() {
        closeAuthModal();
    });

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAuthModal();
        }
    });

    function closeAuthModal() {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        window.scrollTo(0, scrollPosition);
        clearMessages();
    }

    // Form switching
    showSignup.addEventListener('click', function(e) {
        e.preventDefault();
        showSignupForm();
    });

    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        showLoginForm();
    });

    // User menu dropdown
    if (userButton) {
        userButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown();
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!userMenu.contains(e.target)) {
            closeDropdown();
        }
    });

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    // Login form submission
    document.getElementById('loginFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        fetch('../php/login.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('loginMessage', data.message, 'success');
                setTimeout(() => {
                    closeAuthModal();
                    updateUIForLoggedInUser(data.user);
                }, 1500);
            } else {
                showMessage('loginMessage', data.message, 'error');
            }
        })
        .catch(error => {
            showMessage('loginMessage', 'An error occurred. Please try again.', 'error');
        });
    });

    // Signup form submission
    document.getElementById('signupFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        fetch('../php/signup.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('signupMessage', data.message, 'success');
                setTimeout(() => {
                    showLoginForm();
                    clearMessages();
                    // Clear signup form
                    document.getElementById('signupFormElement').reset();
                }, 2000);
            } else {
                showMessage('signupMessage', data.message, 'error');
            }
        })
        .catch(error => {
            showMessage('signupMessage', 'An error occurred. Please try again.', 'error');
        });
    });

    function showLoginForm() {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        clearMessages();
    }

    function showSignupForm() {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        clearMessages();
    }

    function showMessage(elementId, message, type) {
        const messageElement = document.getElementById(elementId);
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';
    }

    function clearMessages() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => {
            msg.style.display = 'none';
            msg.textContent = '';
            msg.className = 'message';
        });
    }

    function toggleDropdown() {
        const isOpen = dropdown.style.display === 'block';
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    function openDropdown() {
        dropdown.style.display = 'block';
        dropdownArrow.classList.add('open');
    }

    function closeDropdown() {
        dropdown.style.display = 'none';
        dropdownArrow.classList.remove('open');
    }

    function updateUIForLoggedInUser(user) {
        window.currentUser = user; // Export globally for booking forms
        
        loginBtn.style.display = 'none';
        userMenu.style.display = 'block';
        document.getElementById('userName').textContent = user.name;
        document.getElementById('greeting').textContent = `Hi! ${user.name}`;
        
        // Auto-fill booking form details if present on page
        const phoneInput = document.getElementById('phoneNumber');
        const nameInput = document.getElementById('customerName');
        const addressInput = document.getElementById('specificLocation') || document.querySelector('input[name="address"]');
        
        if (phoneInput && user.phone_number) phoneInput.value = user.phone_number;
        if (nameInput && user.name) nameInput.value = user.name;
        if (addressInput && user.address) {
            addressInput.value = user.address;
            addressInput.removeAttribute('readonly'); // Ensure it's editable
        }
        
        // Let other scripts know user is loaded
        document.dispatchEvent(new CustomEvent('userLoaded', { detail: user }));
    }

    function updateUIForLoggedOutUser() {
        loginBtn.style.display = 'inline-block';
        userMenu.style.display = 'none';
        closeDropdown();
    }

    function checkLoginStatus() {
        fetch('../php/check_session.php')
        .then(response => response.json())
        .then(data => {
            if (data.logged_in) {
                updateUIForLoggedInUser(data.user);
            } else {
                updateUIForLoggedOutUser();
            }
        })
        .catch(error => {
            console.log('Session check failed');
            updateUIForLoggedOutUser();
        });
    }

    function logout() {
        fetch('../php/logout.php', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateUIForLoggedOutUser();
                // Optional: Show a success message
                alert('Logged out successfully!');
            }
        })
        .catch(error => {
            console.log('Logout failed');
        });
    }
});