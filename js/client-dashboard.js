document.addEventListener('DOMContentLoaded', function(){
    // Elements
    const searchInput = document.getElementById('searchInput');
    const notificationBtn = document.getElementById('notificationBtn');
    const layersBtn = document.getElementById('layersBtn');
    const locationBtn = document.getElementById('locationBtn');
    const navItems = document.querySelectorAll('.nav-item');

    // Check if user is logged in and get user data
    const userName = sessionStorage.getItem('user_name');
    const userId = sessionStorage.getItem('user_id');

    if (!userName || !userId) {
        // No user data found, redirect to login
        alert('Please log in first');
        window.location.href = '../ev-owner/client-login.html';
        return;
    }

    // Set the page title with user name
    document.title = `${userName} | KargaCharge`;

    // Search functionality
    if (searchInput){
        searchInput.addEventListener('input', function(e){
            const query = e.target.value;  //search inputted by user
            console.log('Searching for: ', query);
            // TODO: Add functionality
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

    // Navigation active state
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
});