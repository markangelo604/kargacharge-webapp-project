// Global variables for map
let map = null;
let markers = [];
let allStations = [];
let userLocationMarker = null;

document.addEventListener('DOMContentLoaded', function(){
    console.log('DOM Content Loaded');
    
    // Add CSS for image slider
    addSliderStyles();
    
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
        alert('Please log in first');
        window.location.href = 'client-login.html';
        return;
    }

    // Set the page title with user name
    document.title = `${userName} | KargaCharge`;
    console.log('User logged in:', userName);

    const urlParams = new URLSearchParams(window.location.search);
    const navigate = urlParams.get('navigate');
    
    if (navigate) {
        // Parse navigation coordinates
        const [lat, lng] = navigate.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
            // Store navigation target for use after map initialization
            window.navigationTarget = { lat, lng };
        }
    }

    // Initialize map after a short delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Initializing map...');
        initializeMap();
    }, 1500);

    // Tab Switching Functionality
    function switchTab(tabId) {
        tabContents.forEach(tab => {
            tab.classList.remove('active');
        });
        
        navItems.forEach(nav => {
            nav.classList.remove('active');
        });
        
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        const selectedNav = document.querySelector(`[data-tab="${tabId}"]`);
        if (selectedNav) {
            selectedNav.classList.add('active');
        }
        
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
            window.location.href = 'client-booking-history.html';
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

// Add CSS styles for image slider
function addSliderStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .image-slider-container {
            position: relative;
            width: 100%;
            height: 180px;
            overflow: hidden;
            background: #f3f4f6;
            margin: -14px -14px 12px -14px;
            border-radius: 12px 12px 0 0;
        }
        
        .image-slider {
            display: flex;
            transition: transform 0.3s ease-in-out;
            height: 100%;
        }
        
        .slider-image {
            min-width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .slider-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            z-index: 10;
            transition: background 0.2s;
        }
        
        .slider-nav:hover {
            background: rgba(0, 0, 0, 0.7);
        }
        
        .slider-nav:active {
            transform: translateY(-50%) scale(0.95);
        }
        
        .slider-nav.prev {
            left: 8px;
        }
        
        .slider-nav.next {
            right: 8px;
        }
        
        .slider-dots {
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 6px;
            z-index: 10;
        }
        
        .slider-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .slider-dot.active {
            background: white;
            width: 24px;
            border-radius: 4px;
        }
        
        .slider-counter {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            z-index: 10;
        }
        
        .no-image-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #9ca3af;
            font-size: 14px;
            background: #f3f4f6;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);
}

// Initialize Map with OpenStreetMap and Leaflet
function initializeMap() {
    try {
        console.log('Starting map initialization...');
        
        if (typeof L === 'undefined') {
            console.error('Leaflet library not loaded!');
            alert('Map library failed to load. Please refresh the page.');
            return;
        }

        const mapContainer = document.getElementById('mapView');
        if (!mapContainer) {
            console.error('Map container not found!');
            return;
        }

        console.log('Map container found:', mapContainer);

        // Default center (Baguio City coordinates)
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

        // Handle navigation if needed
        if (window.navigationTarget) {
            // Focus on the navigation target instead of user location
            focusOnNavigationTarget(window.navigationTarget);
            // Clean up the navigation target so it doesn't trigger again
            delete window.navigationTarget;
        } else {
            // Only get user location if we're not navigating to a specific location
            getUserLocation();
        }

        console.log('Map initialized successfully!');
    } catch (error) {
        console.error('Error initializing map:', error);
        alert('Failed to initialize map: ' + error.message);
    }
}

function focusOnNavigationTarget(target) {
    const { lat, lng } = target;
    
    // Center map on location with zoom
    map.setView([lat, lng], 16);
    
    // Add a highlight marker
    const highlightIcon = L.divIcon({
        className: 'highlight-marker',
        html: `<div style="background-color: #079FDB; width: 40px; height: 40px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(7, 159, 219, 0.5); animation: pulse 2s infinite;"></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
    
    const highlightMarker = L.marker([lat, lng], { icon: highlightIcon })
        .addTo(map)
        .bindPopup('<div style="text-align: center; font-weight: 600;"><span style="color: #079FDB;">📍</span> Your destination</div>')
        .openPopup();
    
    // Remove highlight after 5 seconds
    setTimeout(() => {
        if (map && highlightMarker) {
            map.removeLayer(highlightMarker);
        }
    }, 5000);
    
    console.log('Focused on navigation target:', lat, lng);
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

        // Create popup content with image slider
        const popupContent = createPopupContent(station);

        marker.bindPopup(popupContent, {
            maxWidth: 320,
            className: 'custom-popup'
        });
        
        // Initialize slider after popup opens
        marker.on('popupopen', function() {
            initializeImageSlider(station.stat_id);
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

// Create popup content with image slider
function createPopupContent(station) {
    const hasImages = station.images && station.images.length > 0;
    const imageCount = hasImages ? station.images.length : 0;
    
    let imageSliderHTML = '';
    
    if (hasImages) {
        imageSliderHTML = `
            <div class="image-slider-container">
                ${imageCount > 1 ? `<div class="slider-counter">1/${imageCount}</div>` : ''}
                <div class="image-slider" id="slider-${station.stat_id}">
                    ${station.images.map((img, idx) => `
                        <img src="data:image/jpeg;base64,${img}" 
                             alt="${station.stat_name} - Image ${idx + 1}"
                             class="slider-image"
                             onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'no-image-placeholder\\'>Image not available</div>'">
                    `).join('')}
                </div>
                ${imageCount > 1 ? `
                    <button class="slider-nav prev" onclick="moveSlider(${station.stat_id}, -1)">‹</button>
                    <button class="slider-nav next" onclick="moveSlider(${station.stat_id}, 1)">›</button>
                    <div class="slider-dots" id="dots-${station.stat_id}">
                        ${station.images.map((_, idx) => `
                            <div class="slider-dot ${idx === 0 ? 'active' : ''}" onclick="goToSlide(${station.stat_id}, ${idx})"></div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        imageSliderHTML = `
            <div class="image-slider-container">
                <div class="no-image-placeholder">No images available</div>
            </div>
        `;
    }
    
    return `
        <div style="min-width: 260px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            ${imageSliderHTML}
            
            <h6 style="margin: 0 0 12px 0; font-weight: 700; color: #1a1a1a; font-size: 17px;">${station.stat_name}</h6>
            
            <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
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
            
            <p style="margin: 0 0 12px 0; font-size: 12px; color: #6b7280;">
                <strong>Provider:</strong> ${station.provider_name}
            </p>
            
            <button onclick="bookStation(${station.stat_id}, '${station.stat_name.replace(/'/g, "\\'")}')" 
                style="width: 100%; padding: 12px; background-color: ${station.availability_status === 'Available' ? '#079FDB' : '#ccc'}; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: ${station.availability_status === 'Available' ? 'pointer' : 'not-allowed'}; transition: all 0.2s;"
                ${station.availability_status !== 'Available' ? 'disabled' : ''}
                onmouseover="if(this.disabled===false) this.style.backgroundColor='#0588c4'"
                onmouseout="if(this.disabled===false) this.style.backgroundColor='#079FDB'">
                ${station.availability_status === 'Available' ? '⚡ Book Now' : '🚫 Not Available'}
            </button>
        </div>
    `;
}

// Initialize image slider
function initializeImageSlider(stationId) {
    const slider = document.getElementById(`slider-${stationId}`);
    if (slider) {
        slider.dataset.currentIndex = '0';
        
        // Add touch support for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        slider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe(stationId);
        });
        
        function handleSwipe(id) {
            if (touchEndX < touchStartX - 50) {
                moveSlider(id, 1); // Swipe left
            }
            if (touchEndX > touchStartX + 50) {
                moveSlider(id, -1); // Swipe right
            }
        }
    }
}

// Move slider
window.moveSlider = function(stationId, direction) {
    const slider = document.getElementById(`slider-${stationId}`);
    const dots = document.getElementById(`dots-${stationId}`);
    const counter = slider.parentElement.querySelector('.slider-counter');
    
    if (!slider) return;
    
    const imageCount = slider.children.length;
    let currentIndex = parseInt(slider.dataset.currentIndex) || 0;
    
    currentIndex += direction;
    
    // Loop around
    if (currentIndex < 0) currentIndex = imageCount - 1;
    if (currentIndex >= imageCount) currentIndex = 0;
    
    slider.dataset.currentIndex = currentIndex;
    slider.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Update counter
    if (counter) {
        counter.textContent = `${currentIndex + 1}/${imageCount}`;
    }
    
    // Update dots
    if (dots) {
        const dotElements = dots.children;
        for (let i = 0; i < dotElements.length; i++) {
            dotElements[i].classList.toggle('active', i === currentIndex);
        }
    }
};

// Go to specific slide
window.goToSlide = function(stationId, index) {
    const slider = document.getElementById(`slider-${stationId}`);
    const dots = document.getElementById(`dots-${stationId}`);
    const counter = slider.parentElement.querySelector('.slider-counter');
    
    if (!slider) return;
    
    const imageCount = slider.children.length;
    slider.dataset.currentIndex = index;
    slider.style.transform = `translateX(-${index * 100}%)`;
    
    // Update counter
    if (counter) {
        counter.textContent = `${index + 1}/${imageCount}`;
    }
    
    // Update dots
    if (dots) {
        const dotElements = dots.children;
        for (let i = 0; i < dotElements.length; i++) {
            dotElements[i].classList.toggle('active', i === index);
        }
    }
};

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
            
            if (userLocationMarker) {
                map.removeLayer(userLocationMarker);
            }

            const userIcon = L.divIcon({
                className: 'user-location-marker',
                html: `<div style="position: relative;">
                        <div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>
                    </div>`,
                iconSize: [22, 22],
                iconAnchor: [11, 11],
                popupAnchor: [0, -11]
            });

            userLocationMarker = L.marker([lat, lng], { icon: userIcon })
                .addTo(map)
                .bindPopup('<div style="text-align: center; font-weight: 600;"><span style="color: #3b82f6;">📍</span> You are here</div>')
                .openPopup();

            map.setView([lat, lng], 15, {
                animate: true,
                duration: 1
            });

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
    
    // Redirect to booking page with station ID
    window.location.href = `client-booking.html?station_id=${stationId}`;
};

// Add this navigation handling for the booking tab
// Find the section where tab switching happens and update it:

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        const tabId = this.getAttribute('data-tab');
        
        if (tabId === 'bookingTab') {
            // Navigate to booking page
            window.location.href = 'client-booking.html';
        } else if (tabId) {
            switchTab(tabId);
        }
    });
});

// Add this to handle navigation from booking page
window.addEventListener('DOMContentLoaded', function() {
    // Check if we need to navigate to a specific location
    const urlParams = new URLSearchParams(window.location.search);
    const navigate = urlParams.get('navigate');
    
    if (navigate && map) {
        const [lat, lng] = navigate.split(',').map(Number);
        
        // Center map on location
        map.setView([lat, lng], 16);
        
        // Add a highlight marker
        const highlightIcon = L.divIcon({
            className: 'highlight-marker',
            html: `<div style="background-color: #079FDB; width: 40px; height: 40px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(7, 159, 219, 0.5); animation: pulse 2s infinite;"></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
        
        const highlightMarker = L.marker([lat, lng], { icon: highlightIcon })
            .addTo(map)
            .bindPopup('<div style="text-align: center; font-weight: 600;"><span style="color: #079FDB;">📍</span> Your destination</div>')
            .openPopup();
        
        // Remove highlight after 5 seconds
        setTimeout(() => {
            map.removeLayer(highlightMarker);
        }, 5000);
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
    
    errorDiv.classList.add('d-none');
    successDiv.classList.add('d-none');
    
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
    
    const submitBtn = document.getElementById('submitPasswordChange');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Changing...';
    
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
            
            document.getElementById('changePasswordForm').reset();
            
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
    sessionStorage.clear();
    
    fetch('../php/logout.php', {
        method: 'POST'
    })
    .then(() => {
        window.location.href = 'client-login.html';
    })
    .catch(error => {
        console.error('Logout error:', error);
        window.location.href = 'client-login.html';
    });
}
const activeSessionBtn = document.getElementById('activeSessionBtn');
if (activeSessionBtn) {
    activeSessionBtn.addEventListener('click', function() {
        // Get active booking for current user
        fetch(`../php/get-active-booking.php?user_id=${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.booking_id) {
                    window.location.href = `client-charging.html?booking_id=${data.booking_id}`;
                } else {
                    alert('No active charging session found');
                }
            });
    });
}