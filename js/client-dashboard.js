document.addEventListener('DOMContentLoaded', function(){
    // Elements
    const searchInput = document.getElementById('searchInput');
    const notificationBtn = document.getElementById('notificationBtn');
    const layersBtn = document.getElementById('layersBtn');
    const locationBtn = document.getElementById('locationBtn');
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    // Check if user is logged in and get user data
    const userName = sessionStorage.getItem('user_name');
    const userId = sessionStorage.getItem('user_id');
    const userEmail = sessionStorage.getItem('user_email');

    if (!userName || !userId) {
        // No user data found, redirect to login
        alert('Please log in first');
        window.location.href = '../ev-owner/client-login.html';
        return;
    }

    // Set the page title with user name
    document.title = `${userName} | KargaCharge`;

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

    // Search functionality
    if (searchInput){
        searchInput.addEventListener('input', function(e){
            const query = e.target.value;
            console.log('Searching for: ', query);
            // TODO: Add search functionality
        });

        searchInput.addEventListener('focus', function() {
            this.parentElement.style.boxShadow = '0 4px 16px rgba(14, 165, 233, 0.3)';
        });

        searchInput.addEventListener('blur', function() {
            this.parentElement.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.15)';
        });
    }

    // Notification button
    if (notificationBtn){
        notificationBtn.addEventListener('click', function() {
            console.log('Notification clicked');
            // TODO: Implement notification functionality
            alert('Notifications feature coming soon!');
        });
    }

    // Layers button
    if (layersBtn) {
        layersBtn.addEventListener('click', function() {
            console.log('Layers clicked');
            // TODO: Implement map layers functionality
            alert('Map layers feature coming soon!');
        });
    }

    // Location button
    if (locationBtn) {
        locationBtn.addEventListener('click', function() {
            console.log('Location clicked');
            // TODO: Implement geolocation functionality
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        console.log('User location:', lat, lng);
                        alert(`Location found: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                        // TODO: Center map on user location
                    },
                    function(error) {
                        console.error('Error getting location:', error);
                        alert('Unable to get your location. Please enable location services.');
                    }
                );
            } else {
                alert('Geolocation is not supported by your browser.');
            }
        });
    }


    // Account tab

    // Load account info
    loadAccountInfo();
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
            handlePasswordChange();
        });
    }
    
    // Booking History Button
    const bookingHistoryBtn = document.getElementById('bookingHistoryBtn');
    if (bookingHistoryBtn) {
        bookingHistoryBtn.addEventListener('click', function() {
            alert('Booking History page coming soon!');
            // TODO: Redirect to booking-history.html
            // window.location.href = 'booking-history.html';
        });
    }
    
    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                handleLogout();
            }
        });
    }

});


// Load user information in Account Tab
function loadAccountInfo() {
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

// Handle Password Change
function handlePasswordChange() {
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
    
    // Send to PHP backend
    const formData = new FormData();
    formData.append('user_id', sessionStorage.getItem('user_id'));
    formData.append('current_password', currentPassword);
    formData.append('new_password', newPassword);
    
    fetch('../php/change-password.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Change Password';
        
        if (data.success) {
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

// Handle Logout
function handleLogout() {
    // Clear session storage
    sessionStorage.clear();
    
    // Optional: Call logout endpoint to clear PHP session
    fetch('../php/logout.php', {
        method: 'POST'
    })
    .then(() => {
        // Redirect to login page
        window.location.href = 'client-login.html';
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Still redirect even if the request fails
        window.location.href = 'client-login.html';
    });
}