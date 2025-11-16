document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const notificationBtn = document.getElementById('notificationBtn');
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    // Check if user is logged in and get user data
    const userName = sessionStorage.getItem('user_name');
    const userId = sessionStorage.getItem('user_id');
    const userEmail = sessionStorage.getItem('user_email');

    if (!userName || !userId) {
        // No user data found, redirect to login
        alert('Please log in first');
        window.location.href = '../charger-provider/provider-login.html';
        return;
    }

    // Set the page title with user name
    document.title = `${userName} | KargaCharge Provider`

    // Tab Switching Functionality
    function switchTab(tabId) {
        // Remove active class from all tabs
        tabContents.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all nav items
        navItems.forEach(nav => {
            nav.classList.remove('active');
        });
        
        // Add active class to selected tab
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Add active class to corresponding nav item
        const selectedNav = document.querySelector(`[data-tab="${tabId}"]`);
        if (selectedNav) {
            selectedNav.classList.add('active');
        }
        
        console.log('Switched to tab:', tabId);
    }

    // Navigation click handler
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            if (tabId) {
                switchTab(tabId);
            }
        });
    });

    // Notification button handlers
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            console.log('Notification clicked');
            alert('Notifications feature coming soon!');
        });
    }

    // Account tab functionality
    loadProviderAccountInfo();

    // Change Password Button
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            const changePasswordModal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
            changePasswordModal.show();
        });
    }

    // Submit Password Change
    const submitPasswordChange = document.getElementById('submitPasswordChange');
    if (submitPasswordChange) {
        submitPasswordChange.addEventListener('click', function() {
            handleProviderPasswordChange();
        });
    }

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                handleProviderLogout();
            }
        });
    }
});

function loadProviderAccountInfo(){
    const userName = sessionStorage.getItem('user_name');
    const userEmail = sessionStorage.getItem('user_email');
    
    const displayUserName = document.getElementById('displayUserName');
    const displayUserEmail = document.getElementById('displayUserEmail');

    if (displayUserName && userName) {
        displayUserName.textContent = userName;
    }
    
    if (displayUserEmail && userEmail) {
        displayUserEmail.textContent = userEmail;
    }
}

function handleProviderPasswordChange(){
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('passwordError');
    const successDiv = document.getElementById('passwordSuccess');

    // Hide previous messages
    errorDiv.classList.add('d-none');
    successDiv.classList.add('d-none');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        errorDiv.textContent = 'All fields are required';
        errorDiv.classList.remove('d-none');
        return;
    }
    
    if (newPassword.length < 8) {
        errorDiv.textContent = 'New password must be at least 8 characters long';
        errorDiv.classList.remove('d-none');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'New passwords do not match';
        errorDiv.classList.remove('d-none');
        return;
    }
    
    if (currentPassword === newPassword) {
        errorDiv.textContent = 'New password must be different from current password';
        errorDiv.classList.remove('d-none');
        return;
    }

    // Disable button during request
    const submitBtn = document.getElementById('submitPasswordChange');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Changing...';

    // Send to PHP Backend
    const formData = new FormData();
    formData.append('user_id', sessionStorage.getItem('user_id'));
    formData.append('current_password', currentPassword);
    formData.append('new_password', newPassword);

    fetch('../php/change-password-provider.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Change Password';

        if (data.success){
            successDiv.textContent = data.message;
            successDiv.classList.remove('d-none');
            
            // Clear form
            document.getElementById('changePasswordForm').reset();
            
            // Close modal after 2 seconds
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                modal.hide();
                successDiv.classList.add('d-none');
            }, 2000);
        } else {
            errorDiv.textContent = data.message;
            errorDiv.classList.remove('d-none');
        }
    })
    .catch(error => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Change Password';
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.classList.remove('d-none');
        console.error('Error:', error);
    });
}

function handleProviderLogout(){
    // Clear session storage
    sessionStorage.clear();

    // Optional: Call logout endpoint to clear PHP session
    fetch('../php/logout.php', {
        method: 'POST'
    })
    .then(() => {
        // Redirect to login page
        window.location.href = 'provider-login.html';
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Still redirect even if the request fails
        window.location.href = 'provider-login.html';
    });
}