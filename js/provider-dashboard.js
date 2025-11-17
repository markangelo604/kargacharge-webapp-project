// Stations functionality
let currentStationId = null;
let map = null;
let marker = null;
let selectedLatLng = null;
let currentExistingImages = []; // Track existing images
let currentNewFiles = []; // Track new files to upload

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

    // Stations Tab Functionality
    // Add stations tab initialization
    const stationsNavItem = document.querySelector('[data-tab="stationsTab"]');
    if (stationsNavItem) {
        stationsNavItem.addEventListener('click', function() {
            loadProviderStations();
        });
    }

    // Add Station Button
    const addStationBtn = document.getElementById('addStationBtn');
    if (addStationBtn) {
        addStationBtn.addEventListener('click', function() {
            openStationModal('add');
        });
    }

    // Submit Station Button
    const submitStationBtn = document.getElementById('submitStation');
    if (submitStationBtn) {
        submitStationBtn.addEventListener('click', function() {
            handleStationSubmit();
        });
    }

    // Confirm Delete Station Button
    const confirmDeleteBtn = document.getElementById('confirmDeleteStation');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            handleStationDelete();
        });
    }

    // Select Location Button
    const selectLocationBtn = document.getElementById('selectLocationBtn');
    if (selectLocationBtn) {
        selectLocationBtn.addEventListener('click', function() {
            openMapModal();
        });
    }

    // Use Current Location Button
    const useCurrentLocationBtn = document.getElementById('useCurrentLocation');
    if (useCurrentLocationBtn) {
        useCurrentLocationBtn.addEventListener('click', function() {
            getCurrentLocation();
        });
    }

    // Confirm Location Button
    const confirmLocationBtn = document.getElementById('confirmLocation');
    if (confirmLocationBtn) {
        confirmLocationBtn.addEventListener('click', function() {
            confirmLocationSelection();
        });
    }

    // Initialize map when modal is shown
    const mapModal = document.getElementById('mapModal');
    if (mapModal) {
        mapModal.addEventListener('shown.bs.modal', function() {
            initializeMap();
        });
    }

    const stationImagesInput = document.getElementById('stationImages');
    if (stationImagesInput) {
        stationImagesInput.addEventListener('change', handleNewImagesSelect);
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

function loadProviderStations() {
    const stationsList = document.getElementById('stationsList');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const providerId = sessionStorage.getItem('user_id');

    if (!providerId) {
        console.error('Provider ID not found');
        return;
    }

    // Show loading state
    if (loadingState) loadingState.classList.remove('d-none');
    if (emptyState) emptyState.classList.add('d-none');

    // Remove existing station cards
    const existingCards = stationsList.querySelectorAll('.station-card');
    existingCards.forEach(card => card.remove());

    fetch(`../php/get-stations.php?prov_id=${providerId}`)
        .then(response => response.json())
        .then(data => {
            if (loadingState) loadingState.classList.add('d-none');

            if (data.success && data.stations && data.stations.length > 0) {
                if (emptyState) emptyState.classList.add('d-none');
                displayStations(data.stations);
            } else {
                if (emptyState) emptyState.classList.remove('d-none');
            }
        })
        .catch(error => {
            console.error('Error loading stations:', error);
            if (loadingState) loadingState.classList.add('d-none');
            if (emptyState) emptyState.classList.remove('d-none');
        });
}

function displayStations(stations) {
    const stationsList = document.getElementById('stationsList');
    
    stations.forEach(station => {
        const stationCard = createStationCard(station);
        stationsList.appendChild(stationCard);
    });
}

function createStationCard(station) {
    const card = document.createElement('div');
    card.className = 'station-card';
    card.innerHTML = `
        <div class="station-card-header">
            <div class="station-info">
                <h3 class="station-name">${station.stat_name || 'Unnamed Station'}</h3>
                <p class="station-location">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16">
                        <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                    </svg>
                    ${station.location}
                </p>
                <p class="station-place-type">${station.place_type}</p>
            </div>
            <div class="station-actions">
                <button class="station-action-btn edit-btn" onclick="openStationModal('edit', ${station.stat_id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                    </svg>
                </button>
                <button class="station-action-btn delete-btn" onclick="openDeleteModal(${station.stat_id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                    </svg>
                </button>
            </div>
        </div>
        
        <div class="station-details">
            <div class="detail-item">
                <p class="detail-label">Charge Type</p>
                <p class="detail-value">${station.charge_type}</p>
            </div>
            <div class="detail-item">
                <p class="detail-label">Rate</p>
                <p class="detail-value">₱${parseFloat(station.rate).toFixed(2)}/kWh</p>
            </div>
        </div>
        
        <div class="station-status-container">
            <span class="station-status ${getStatusClass(station.availability_status)}">
                ${station.availability_status}
            </span>
        </div>
        
        ${station.details ? `
        <div class="station-additional-details">
            <p class="additional-details-label">Additional Details</p>
            <p class="additional-details-text">${station.details}</p>
        </div>
        ` : ''}
    `;
    
    return card;
}

function getStatusClass(status) {
    const statusMap = {
        'Available': 'status-available',
        'Occupied': 'status-occupied',
        'Maintenance': 'status-maintenance',
        'Out of Service': 'status-out-of-service'
    };
    return statusMap[status] || 'status-available';
}

function openStationModal(mode, stationId = null) {
    const modal = new bootstrap.Modal(document.getElementById('stationModal'));
    const modalTitle = document.getElementById('stationModalLabel');
    const form = document.getElementById('stationForm');
    const errorDiv = document.getElementById('stationError');
    const successDiv = document.getElementById('stationSuccess');
    
    // Reset form and messages
    form.reset();
    resetImageHandling(); // Add this line
    if (errorDiv) errorDiv.classList.add('d-none');
    if (successDiv) successDiv.classList.add('d-none');
    
    if (mode === 'add') {
        modalTitle.textContent = 'Add Station';
        document.getElementById('stationId').value = '';
        modal.show();
    } else if (mode === 'edit' && stationId) {
        modalTitle.textContent = 'Edit Station';
        loadStationData(stationId);
        modal.show();
    }
}

function loadStationData(stationId) {
    fetch(`../php/get-station-details.php?stat_id=${stationId}`)
        .then(response => response.json())
        .then(data => {
            console.log('Station data received:', data);
            
            if (data.success && data.station) {
                const station = data.station;
                document.getElementById('stationId').value = station.stat_id;
                document.getElementById('statName').value = station.stat_name || '';
                document.getElementById('stationLocation').value = station.location;
                document.getElementById('placeType').value = station.place_type;
                document.getElementById('chargeType').value = station.charge_type;
                document.getElementById('rate').value = station.rate;
                document.getElementById('availabilityStatus').value = station.availability_status;
                document.getElementById('details').value = station.details || '';
                
                // Load existing images
                currentExistingImages = station.images || [];
                displayExistingImages(currentExistingImages);
            } else {
                console.error('Error in response:', data);
                alert('Failed to load station data: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error loading station data:', error);
            alert('Failed to load station data');
        });
}

function handleStationSubmit() {
    const form = document.getElementById('stationForm');
    const errorDiv = document.getElementById('stationError');
    const successDiv = document.getElementById('stationSuccess');
    const submitBtn = document.getElementById('submitStation');
    
    if (errorDiv) errorDiv.classList.add('d-none');
    if (successDiv) successDiv.classList.add('d-none');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    const formData = new FormData();
    
    // Add all form fields except images
    formData.append('prov_id', sessionStorage.getItem('user_id'));
    formData.append('stat_name', document.getElementById('statName').value);
    formData.append('location', document.getElementById('stationLocation').value);
    formData.append('place_type', document.getElementById('placeType').value);
    formData.append('charge_type', document.getElementById('chargeType').value);
    formData.append('rate', document.getElementById('rate').value);
    formData.append('availability_status', document.getElementById('availabilityStatus').value);
    formData.append('details', document.getElementById('details').value);
    
    const stationId = document.getElementById('stationId').value;
    if (stationId) {
        formData.append('stat_id', stationId);
    }
    
    // Add new images
    currentNewFiles.forEach((file) => {
        formData.append('images[]', file);
    });
    
    // Send existing images data (for edit mode)
    if (stationId) {
        const remainingImages = currentExistingImages.filter(img => img !== null);
        formData.append('existing_images', JSON.stringify(remainingImages));
    }
    
    const endpoint = stationId ? '../php/update-station.php' : '../php/add-station.php';
    
    fetch(endpoint, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Station';
        
        if (data.success) {
            if (successDiv) {
                submitBtn.disabled = true;
                successDiv.textContent = data.message;
                successDiv.classList.remove('d-none');
            }
            
            loadProviderStations();
            
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('stationModal'));
                modal.hide();
                submitBtn.disabled = false;
                if (successDiv) successDiv.classList.add('d-none');
                resetImageHandling();
            }, 1500);
        } else {
            if (errorDiv) {
                errorDiv.textContent = data.message;
                errorDiv.classList.remove('d-none');
            }
        }
    })
    .catch(error => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Station';
        console.error('Error:', error);
        if (errorDiv) {
            errorDiv.textContent = 'An error occurred. Please try again.';
            errorDiv.classList.remove('d-none');
        }
    });
}

function openDeleteModal(stationId) {
    currentStationId = stationId;
    const modal = new bootstrap.Modal(document.getElementById('deleteStationModal'));
    modal.show();
}

function handleStationDelete() {
    if (!currentStationId) return;
    
    const confirmBtn = document.getElementById('confirmDeleteStation');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';
    
    const formData = new FormData();
    formData.append('stat_id', currentStationId);
    
    fetch('../php/delete-station.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Delete Station';
        
        if (data.success) {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteStationModal'));
            modal.hide();
            
            // Reload stations
            loadProviderStations();
            
            // Reset current station ID
            currentStationId = null;
        } else {
            alert(data.message || 'Failed to delete station');
        }
    })
    .catch(error => {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Delete Station';
        console.error('Error:', error);
        alert('An error occurred while deleting the station');
    });
}

// Map functionality
function initializeMap() {
    // Remove existing map if any
    if (map) {
        map.remove();
    }

    // Default center (Baguio City coordinates based on user location from prompt)
    const defaultLat = 16.4023;
    const defaultLng = 120.5960;

    // Initialize map
    map = L.map('map').setView([defaultLat, defaultLng], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Add click event to map
    map.on('click', function(e) {
        selectLocation(e.latlng.lat, e.latlng.lng);
    });

    // If editing and location already exists, set marker
    const currentLocation = document.getElementById('stationLocation').value;
    if (currentLocation) {
        const coords = currentLocation.split(',').map(c => parseFloat(c.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            selectLocation(coords[0], coords[1]);
            map.setView([coords[0], coords[1]], 15);
        }
    }
}

function selectLocation(lat, lng) {
    selectedLatLng = { lat, lng };

    // Remove existing marker
    if (marker) {
        map.removeLayer(marker);
    }

    // Add new marker
    marker = L.marker([lat, lng], {
        draggable: true
    }).addTo(map);

    // Update marker position on drag
    marker.on('dragend', function(e) {
        const position = e.target.getLatLng();
        selectLocation(position.lat, position.lng);
    });

    // Update display
    document.getElementById('selectedCoords').textContent = 
        `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    // Enable confirm button
    document.getElementById('confirmLocation').disabled = false;
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    const useLocationBtn = document.getElementById('useCurrentLocation');
    const originalText = useLocationBtn.innerHTML;
    useLocationBtn.disabled = true;
    useLocationBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Getting location...';

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            selectLocation(lat, lng);
            map.setView([lat, lng], 15);

            useLocationBtn.disabled = false;
            useLocationBtn.innerHTML = originalText;
        },
        function(error) {
            useLocationBtn.disabled = false;
            useLocationBtn.innerHTML = originalText;
            
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
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function openMapModal() {
    const mapModal = new bootstrap.Modal(document.getElementById('mapModal'));
    mapModal.show();
}

function confirmLocationSelection() {
    if (selectedLatLng) {
        const locationStr = `${selectedLatLng.lat.toFixed(6)}, ${selectedLatLng.lng.toFixed(6)}`;
        document.getElementById('stationLocation').value = locationStr;
        
        // Close map modal
        const mapModal = bootstrap.Modal.getInstance(document.getElementById('mapModal'));
        mapModal.hide();
        
        // Reset for next use
        selectedLatLng = null;
        document.getElementById('selectedCoords').textContent = 'Click on the map to select a location';
        document.getElementById('confirmLocation').disabled = true;
    }
}

// Accounts Functions
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

function handleNewImagesSelect(event) {
    const files = Array.from(event.target.files);
    currentNewFiles = files;
    displayNewImagePreviews();
}

function displayNewImagePreviews() {
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = '';
    
    if (currentNewFiles.length === 0) return;
    
    const label = document.createElement('small');
    label.className = 'text-muted d-block mb-2';
    label.textContent = 'New Images to Upload:';
    container.appendChild(label);
    
    const imgContainer = document.createElement('div');
    imgContainer.className = 'd-flex flex-wrap gap-2';
    
    currentNewFiles.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'position-relative';
            imgDiv.style.width = '100px';
            imgDiv.style.height = '100px';
            
            imgDiv.innerHTML = `
                <img src="${e.target.result}" class="img-thumbnail" 
                     style="width: 100%; height: 100%; object-fit: cover;">
                <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-1" 
                        onclick="removeNewImage(${index})" title="Remove">
                    ×
                </button>
            `;
            
            imgContainer.appendChild(imgDiv);
        };
        
        reader.readAsDataURL(file);
    });
    
    container.appendChild(imgContainer);
}

function removeNewImage(index) {
    currentNewFiles.splice(index, 1);
    
    // Update file input
    const dt = new DataTransfer();
    currentNewFiles.forEach(file => dt.items.add(file));
    document.getElementById('stationImages').files = dt.files;
    
    displayNewImagePreviews();
}

function displayExistingImages(images) {
    const container = document.getElementById('existingImagesContainer');
    container.innerHTML = '';
    
    // Filter out null/removed images
    const validImages = images.filter(img => img !== null);
    
    if (validImages.length === 0) return;
    
    const label = document.createElement('small');
    label.className = 'text-muted d-block mb-2';
    label.textContent = 'Current Images:';
    container.appendChild(label);
    
    const imgContainer = document.createElement('div');
    imgContainer.className = 'd-flex flex-wrap gap-2';
    
    images.forEach((imgBase64, index) => {
        if (imgBase64 === null) return; // Skip removed images
        
        const imgDiv = document.createElement('div');
        imgDiv.className = 'position-relative';
        imgDiv.style.width = '100px';
        imgDiv.style.height = '100px';
        
        imgDiv.innerHTML = `
            <img src="data:image/jpeg;base64,${imgBase64}" class="img-thumbnail" 
                 style="width: 100%; height: 100%; object-fit: cover;">
            <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-1" 
                    onclick="removeExistingImage(${index})" title="Remove">
                ×
            </button>
        `;
        
        imgContainer.appendChild(imgDiv);
    });
    
    container.appendChild(imgContainer);
}

function removeExistingImage(index) {
    currentExistingImages[index] = null;
    displayExistingImages(currentExistingImages);
}

function resetImageHandling() {
    currentExistingImages = [];
    currentNewFiles = [];
    document.getElementById('imagePreviewContainer').innerHTML = '';
    document.getElementById('existingImagesContainer').innerHTML = '';
    document.getElementById('stationImages').value = '';
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