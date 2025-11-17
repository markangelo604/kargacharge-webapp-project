// Global variables for map
let map = null;
let markers = [];
let allStations = [];
let userLocationMarker = null;

document.addEventListener('DOMContentLoaded', function(){
    console.log('DOM Content Loaded');
    
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

    if (!userName || !userId) {
        // No user data found, redirect to login
        alert('Please log in first');
        window.location.href = 'client-login.html';
        return;
    }

    // Set the page title with user name
    document.title = `${userName} | KargaCharge`;
    console.log('User logged in:', userName);

    // Initialize map after a short delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Initializing map...');
        initializeMap();
    }, 1500);

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
        
        // Refresh map when switching to map tab
        if (tabId === 'mapTab' && map) {
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
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
            const query = e.target.value.toLowerCase();
            filterStations(query);
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
            alert('Notifications feature coming soon!');
        });
    }

    // Layers button
    if (layersBtn) {
        layersBtn.addEventListener('click', function() {
            console.log('Layers clicked');
            // Toggle between street and satellite view
            alert('Map layers feature coming soon!');
        });
    }

    // Location button
    if (locationBtn) {
        locationBtn.addEventListener('click', function() {
            getUserLocation();
        });
    }

    // Account tab
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

// Initialize Map with OpenStreetMap and Leaflet
function initializeMap() {
    try {
        console.log('Starting map initialization...');
        
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.error('Leaflet library not loaded!');
            alert('Map library failed to load. Please refresh the page.');
            return;
        }

        // Get map container
        const mapContainer = document.getElementById('mapView');
        if (!mapContainer) {
            console.error('Map container not found!');
            return;
        }

        console.log('Map container found:', mapContainer);

        // Default center (Baguio City coordinates based on your database)
        const defaultLat = 16.4023;
        const defaultLng = 120.5960;

        // Initialize map
        map = L.map('mapView', {
            center: [defaultLat, defaultLng],
            zoom: 13,
            zoomControl: true
        });

        console.log('Map object created');

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            minZoom: 3
        }).addTo(map);

        console.log('Tiles added to map');

        // Force map to recalculate size
        setTimeout(() => {
            map.invalidateSize();
            console.log('Map size invalidated');
        }, 100);

        // Load charging stations
        loadChargingStations();

        // Try to get user's location
        getUserLocation();

        console.log('Map initialized successfully!');
    } catch (error) {
        console.error('Error initializing map:', error);
        alert('Failed to initialize map: ' + error.message);
    }
}

// Load all charging stations from database
function loadChargingStations() {
    console.log('Loading charging stations...');
    
    fetch('../php/get-all-stations.php')
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Stations data received:', data);
            
            if (data.success && data.stations) {
                allStations = data.stations;
                displayStationsOnMap(data.stations);
                console.log(`Successfully loaded ${data.count} charging stations`);
            } else {
                console.error('Failed to load stations:', data.message);
                alert('Failed to load charging stations: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error loading stations:', error);
            alert('Error loading charging stations. Please check console for details.');
        });
}

// Display stations on map
function displayStationsOnMap(stations) {
    console.log('Displaying stations on map:', stations.length);
    
    // Clear existing markers
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];

    if (stations.length === 0) {
        console.warn('No stations to display');
        return;
    }

    // Create custom icons based on availability
    const availableIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                    <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z"/>
                </svg>
            </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });

    const occupiedIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #f59e0b; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                    <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z"/>
                </svg>
            </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });

    const maintenanceIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                    <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
                </svg>
            </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });

    // Add markers for each station
    stations.forEach((station, index) => {
        console.log(`Adding marker ${index + 1}:`, station.stat_name, station.latitude, station.longitude);
        
        let icon = availableIcon;
        if (station.availability_status === 'Occupied') {
            icon = occupiedIcon;
        } else if (station.availability_status === 'Maintenance') {
            icon = maintenanceIcon;
        }

        const marker = L.marker([station.latitude, station.longitude], { icon: icon })
            .addTo(map);

        // Create popup content
        const popupContent = `
            <div style="min-width: 220px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <h6 style="margin: 0 0 10px 0; font-weight: 700; color: #1a1a1a; font-size: 16px;">${station.stat_name}</h6>
                <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #374151;">
                        <strong style="color: #6b7280;">Type:</strong> ${station.place_type}
                    </p>
                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #374151;">
                        <strong style="color: #6b7280;">Charging:</strong> ${station.charge_type}
                    </p>
                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #374151;">
                        <strong style="color: #6b7280;">Rate:</strong> <span style="color: #079FDB; font-weight: 600;">₱${station.rate.toFixed(2)}/kWh</span>
                    </p>
                    <p style="margin: 0; font-size: 13px;">
                        <strong style="color: #6b7280;">Status:</strong> 
                        <span style="color: ${getStatusColor(station.availability_status)}; font-weight: 700;">
                            ${station.availability_status}
                        </span>
                    </p>
                </div>
                ${station.details ? `<p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; font-style: italic; line-height: 1.4;">${station.details}</p>` : ''}
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280;">
                    <strong>Provider:</strong> ${station.provider_name}
                </p>
                <button onclick="bookStation(${station.stat_id}, '${station.stat_name}')" 
                    style="width: 100%; padding: 10px; background-color: ${station.availability_status === 'Available' ? '#079FDB' : '#ccc'}; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: ${station.availability_status === 'Available' ? 'pointer' : 'not-allowed'}; transition: all 0.2s;"
                    ${station.availability_status !== 'Available' ? 'disabled' : ''}
                    onmouseover="this.style.backgroundColor='${station.availability_status === 'Available' ? '#0588c4' : '#ccc'}'"
                    onmouseout="this.style.backgroundColor='${station.availability_status === 'Available' ? '#079FDB' : '#ccc'}'">
                    ${station.availability_status === 'Available' ? '⚡ Book Now' : '🚫 Not Available'}
                </button>
            </div>
        `;

        marker.bindPopup(popupContent, {
            maxWidth: 280,
            className: 'custom-popup'
        });
        
        markers.push(marker);
    });

    console.log(`Added ${markers.length} markers to map`);
    
    // Fit map to show all markers if there are any
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Get status color
function getStatusColor(status) {
    switch(status) {
        case 'Available': return '#10b981';
        case 'Occupied': return '#f59e0b';
        case 'Maintenance': return '#ef4444';
        default: return '#6b7280';
    }
}

// Filter stations based on search query
function filterStations(query) {
    console.log('Filtering stations with query:', query);
    
    if (!query) {
        displayStationsOnMap(allStations);
        return;
    }

    const filtered = allStations.filter(station => {
        return station.stat_name.toLowerCase().includes(query) ||
               station.place_type.toLowerCase().includes(query) ||
               station.charge_type.toLowerCase().includes(query) ||
               station.provider_name.toLowerCase().includes(query) ||
               station.details.toLowerCase().includes(query);
    });

    console.log(`Found ${filtered.length} matching stations`);
    displayStationsOnMap(filtered);
}

// Get user's current location
function getUserLocation() {
    console.log('Getting user location...');
    
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    // Show loading indicator
    const locationBtn = document.getElementById('locationBtn');
    if (locationBtn) {
        locationBtn.style.backgroundColor = '#0ea5e9';
        locationBtn.style.color = 'white';
    }

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            console.log('User location found:', lat, lng);
            
            // Remove existing user location marker
            if (userLocationMarker) {
                map.removeLayer(userLocationMarker);
            }

            // Create user location icon
            const userIcon = L.divIcon({
                className: 'user-location-marker',
                html: `<div style="position: relative;">
                        <div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>
                    </div>`,
                iconSize: [22, 22],
                iconAnchor: [11, 11],
                popupAnchor: [0, -11]
            });

            // Add user location marker
            userLocationMarker = L.marker([lat, lng], { icon: userIcon })
                .addTo(map)
                .bindPopup('<div style="text-align: center; font-weight: 600;"><span style="color: #3b82f6;">📍</span> You are here</div>')
                .openPopup();

            // Center map on user location
            map.setView([lat, lng], 15, {
                animate: true,
                duration: 1
            });

            // Reset button style
            if (locationBtn) {
                setTimeout(() => {
                    locationBtn.style.backgroundColor = '';
                    locationBtn.style.color = '';
                }, 500);
            }
        },
        function(error) {
            console.error('Error getting location:', error);
            
            let errorMessage = 'Unable to get your location. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Please allow location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Location request timed out.';
                    break;
            }
            
            alert(errorMessage);
            
            // Reset button style
            if (locationBtn) {
                locationBtn.style.backgroundColor = '';
                locationBtn.style.color = '';
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Book station function
window.bookStation = function(stationId, stationName) {
    console.log('Booking station:', stationId, stationName);
    
    const confirmed = confirm(`Would you like to book "${stationName}"?\n\nBooking functionality will be available soon!`);
    
    if (confirmed) {
        // TODO: Implement actual booking functionality
        // This would redirect to booking page or open booking modal
        alert(`Station ID ${stationId} selected for booking.\n\nBooking feature coming soon!`);
    }
};

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