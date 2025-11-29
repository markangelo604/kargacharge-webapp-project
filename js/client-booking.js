// Global variables
let selectedStation = null;
let allStations = [];
let currentUserId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Booking page loaded');

    // Check if user is logged in
    const userName = sessionStorage.getItem('user_name');
    currentUserId = sessionStorage.getItem('user_id');

    if (!userName || !currentUserId) {
        alert('Please log in first');
        window.location.href = 'client-login.html';
        return;
    }

    // Check if a station was passed from the map
    const urlParams = new URLSearchParams(window.location.search);
    const stationId = urlParams.get('station_id');

    // Initialize page
    if (stationId) {
        loadStationById(stationId);
    } else {
        loadAvailableStations();
    }

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').min = today;
    document.getElementById('bookingDate').value = today;

    // Event Listeners
    document.getElementById('backButton').addEventListener('click', handleBack);
    document.getElementById('cancelBooking').addEventListener('click', handleCancel);
    document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmit);
    document.getElementById('startTime').addEventListener('change', calculateTotal);
    document.getElementById('endTime').addEventListener('change', calculateTotal);
    document.getElementById('getDirectionBtn').addEventListener('click', handleGetDirection);
    document.getElementById('closeSuccessModal').addEventListener('click', closeSuccessModal);

    // Bottom Navigation
    document.getElementById('navMap').addEventListener('click', () => {
        window.location.href = 'client-dashboard.html';
    });
    document.getElementById('navAccount').addEventListener('click', () => {
        window.location.href = 'client-dashboard.html#account';
    });
});

// Load all available stations
function loadAvailableStations() {
    console.log('Loading available stations...');
    
    fetch('../php/get-all-stations.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.stations) {
                allStations = data.stations;
                // Filter only available stations
                const availableStations = data.stations.filter(s => s.availability_status === 'Available');
                displayStations(availableStations);
            } else {
                showError('Failed to load stations: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error loading stations:', error);
            showError('Error loading charging stations. Please try again.');
        });
}

// Load specific station by ID
function loadStationById(stationId) {
    fetch('../php/get-all-stations.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.stations) {
                allStations = data.stations;
                const station = data.stations.find(s => s.stat_id == stationId);
                if (station) {
                    // Parse location coordinates
                    const coords = station.location.split(',').map(coord => parseFloat(coord.trim()));
                    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                        station.latitude = coords[0];
                        station.longitude = coords[1];
                    }
                    selectStation(station);
                } else {
                    showError('Station not found');
                    loadAvailableStations();
                }
            }
        })
        .catch(error => {
            console.error('Error loading station:', error);
            showError('Error loading station details');
            loadAvailableStations();
        });
}

// Display stations list
function displayStations(stations) {
    const stationsList = document.getElementById('stationsList');
    
    if (stations.length === 0) {
        stationsList.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                </svg>
                <h3>No Available Stations</h3>
                <p>All stations are currently occupied or under maintenance.</p>
            </div>
        `;
        return;
    }

    stationsList.innerHTML = stations.map(station => {
        // Parse location coordinates
        const coords = station.location.split(',').map(coord => parseFloat(coord.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            station.latitude = coords[0];
            station.longitude = coords[1];
        }

        const imageUrl = station.images && station.images.length > 0 
            ? `data:image/jpeg;base64,${station.images[0]}`
            : '../assets/images/placeholder-station.jpg';

        return `
            <div class="station-card" data-station-id="${station.stat_id}">
                <img src="${imageUrl}" alt="${station.stat_name}" class="station-image" 
                     onerror="this.src='../assets/images/placeholder-station.jpg'">
                <div class="station-info">
                    <h3>${station.stat_name}</h3>
                    <div class="station-details">
                        <div class="detail-row">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8.5 8.5a.5.5 0 0 0-1 0v3.362l-1.429 2.38a.5.5 0 1 0 .858.515l1.5-2.5A.5.5 0 0 0 8.5 12z"/>
                                <path d="M6.5 0a.5.5 0 0 0 0 1H7v1.07a7.001 7.001 0 0 0-3.273 12.474l-.602.602a.5.5 0 0 0 .707.708l.746-.746A6.97 6.97 0 0 0 8 16a6.97 6.97 0 0 0 3.422-.892l.746.746a.5.5 0 0 0 .707-.708l-.601-.602A7.001 7.001 0 0 0 9 2.07V1h.5a.5.5 0 0 0 0-1zm1.038 3.018a6.093 6.093 0 0 1 .924 0 6 6 0 1 1-.924 0M0 3.5c0 .753.333 1.429.86 1.887A8.04 8.04 0 0 1 4.387 1.86 2.5 2.5 0 0 0 0 3.5M13.5 1c-.753 0-1.429.333-1.887.86a8.04 8.04 0 0 1 3.527 3.527A2.5 2.5 0 0 0 13.5 1"/>
                            </svg>
                            <span>${station.charge_type}</span>
                        </div>
                        <div class="detail-row">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z"/>
                            </svg>
                            <span>₱${station.rate.toFixed(2)}/kWh</span>
                        </div>
                        <div class="detail-row">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                            </svg>
                            <span>${station.place_type}</span>
                        </div>
                    </div>
                    <span class="status-badge status-${station.availability_status.toLowerCase()}">
                        ${station.availability_status}
                    </span>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers to station cards
    document.querySelectorAll('.station-card').forEach(card => {
        card.addEventListener('click', function() {
            const stationId = this.dataset.stationId;
            const station = stations.find(s => s.stat_id == stationId);
            if (station) {
                selectStation(station);
            }
        });
    });
}

// Select a station and show booking form
function selectStation(station) {
    selectedStation = station;
    console.log('Station selected:', station);

    // Parse location coordinates from the location string
    if (station.location) {
        const coords = station.location.split(',').map(coord => parseFloat(coord.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            selectedStation.latitude = coords[0];
            selectedStation.longitude = coords[1];
        }
    }

    // Hide station selection, show booking form
    document.getElementById('stationSelectionView').style.display = 'none';
    document.getElementById('bookingFormView').style.display = 'block';

    // Display selected station info
    const imageUrl = station.images && station.images.length > 0 
        ? `data:image/jpeg;base64,${station.images[0]}`
        : '../assets/images/placeholder-station.jpg';

    document.getElementById('selectedStationInfo').innerHTML = `
        <div class="station-card selected">
            <img src="${imageUrl}" alt="${station.stat_name}" class="station-image"
                 onerror="this.src='../assets/images/placeholder-station.jpg'">
            <div class="station-info">
                <h3>${station.stat_name}</h3>
                <div class="station-details">
                    <div class="detail-row">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8.5 8.5a.5.5 0 0 0-1 0v3.362l-1.429 2.38a.5.5 0 1 0 .858.515l1.5-2.5A.5.5 0 0 0 8.5 12z"/>
                            <path d="M6.5 0a.5.5 0 0 0 0 1H7v1.07a7.001 7.001 0 0 0-3.273 12.474l-.602.602a.5.5 0 0 0 .707.708l.746-.746A6.97 6.97 0 0 0 8 16a6.97 6.97 0 0 0 3.422-.892l.746.746a.5.5 0 0 0 .707-.708l-.601-.602A7.001 7.001 0 0 0 9 2.07V1h.5a.5.5 0 0 0 0-1zm1.038 3.018a6.093 6.093 0 0 1 .924 0 6 6 0 1 1-.924 0M0 3.5c0 .753.333 1.429.86 1.887A8.04 8.04 0 0 1 4.387 1.86 2.5 2.5 0 0 0 0 3.5M13.5 1c-.753 0-1.429.333-1.887.86a8.04 8.04 0 0 1 3.527 3.527A2.5 2.5 0 0 0 13.5 1"/>
                        </svg>
                        <span>${station.charge_type}</span>
                    </div>
                    <div class="detail-row">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z"/>
                        </svg>
                        <span>₱${station.rate.toFixed(2)}/kWh</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Update rate display
    document.getElementById('rateDisplay').textContent = `₱${station.rate.toFixed(2)}`;
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Calculate booking total
function calculateTotal() {
    if (!selectedStation) return;

    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    if (!startTime || !endTime) return;

    // Calculate duration in hours
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end <= start) {
        showError('End time must be after start time');
        document.getElementById('durationDisplay').textContent = '0 hours';
        document.getElementById('energyDisplay').textContent = '0 kWh';
        document.getElementById('totalDisplay').textContent = '₱0.00';
        return;
    }

    const durationMs = end - start;
    const durationHours = durationMs / (1000 * 60 * 60);

    // Estimate energy consumption with more realistic values
    // Average EV consumption during charging session (kWh)
    let chargingRate;
    
    switch(selectedStation.charge_type) {
        case 'AC Level 1':
            chargingRate = 1.8; // 1.8kW typical for Level 1
            break;
        case 'AC Level 2':
            chargingRate = 7.2; // 7.2kW typical for Level 2
            break;
        case 'DC Fast Charging':
            chargingRate = 50; // 50kW typical for DC fast charging
            break;
        case 'Tesla Supercharger':
            chargingRate = 80; // 80kW typical for Tesla Supercharger
            break;
        default:
            chargingRate = 3.6; // Default fallback
    }

    // Calculate energy based on actual charging rate and duration
    const estimatedEnergy = (chargingRate * durationHours);

    // Calculate cost
    const totalCost = estimatedEnergy * selectedStation.rate;

    // Update display
    document.getElementById('durationDisplay').textContent = `${durationHours.toFixed(1)} hours`;
    document.getElementById('energyDisplay').textContent = `${estimatedEnergy.toFixed(1)} kWh`;
    document.getElementById('totalDisplay').textContent = `₱${totalCost.toFixed(2)}`;
}

// Handle booking submission
function handleBookingSubmit(e) {
    e.preventDefault();

    if (!selectedStation) {
        showError('Please select a station');
        return;
    }

    const bookingDate = document.getElementById('bookingDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    if (!bookingDate || !startTime || !endTime) {
        showError('Please fill in all fields');
        return;
    }

    // First check if user has any pending bookings
    checkPendingBookings()
        .then(hasPending => {
            if (hasPending) {
                showError('You already have a pending booking. Please wait for confirmation or cancel the existing booking.');
            } else {
                // No pending bookings, proceed to payment
                showPaymentModal();
            }
        })
        .catch(error => {
            console.error('Error checking pending bookings:', error);
            showError('Error checking booking status. Please try again.');
        });
}

function checkPendingBookings() {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('action', 'check_pending_bookings');
        formData.append('client_id', currentUserId);

        fetch('../php/client-booking.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                resolve(data.has_pending);
            } else {
                reject(new Error(data.message || 'Failed to check booking status'));
            }
        })
        .catch(error => {
            reject(error);
        });
    });
}


// Show success modal
function showSuccessModal() {
    document.getElementById('successModal').classList.add('active');
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');
    window.location.href = 'client-dashboard.html';
}

// Handle get direction
function handleGetDirection() {
    if (selectedStation && selectedStation.latitude && selectedStation.longitude) {
        // Redirect to dashboard map with navigation parameters
        window.location.href = `client-dashboard.html?navigate=${selectedStation.latitude},${selectedStation.longitude}`;
    } else {
        // If we don't have coordinates, try to get them from the server
        fetch(`../php/get-station-details.php?stat_id=${selectedStation.stat_id}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.station) {
                    // Parse location from string format "lat, lng"
                    const locationParts = data.station.location.split(',');
                    if (locationParts.length === 2) {
                        const lat = parseFloat(locationParts[0].trim());
                        const lng = parseFloat(locationParts[1].trim());
                        if (!isNaN(lat) && !isNaN(lng)) {
                            window.location.href = `client-dashboard.html?navigate=${lat},${lng}`;
                            return;
                        }
                    }
                }
                // If we can't get location, just go to dashboard
                closeSuccessModal();
            })
            .catch(error => {
                console.error('Error fetching station details:', error);
                closeSuccessModal();
            });
    }
}

// Handle back button
function handleBack() {
    if (document.getElementById('bookingFormView').style.display === 'block') {
        // Go back to station selection
        document.getElementById('bookingFormView').style.display = 'none';
        document.getElementById('stationSelectionView').style.display = 'block';
        selectedStation = null;
    } else {
        // Go back to dashboard
        window.location.href = 'client-dashboard.html';
    }
}

// Handle cancel button
function handleCancel() {
    if (confirm('Are you sure you want to cancel?')) {
        handleBack();
    }
}

// Show error message
function showError(message) {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = `
        <div class="alert alert-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
            </svg>
            ${message}
        </div>
    `;
    
    window.scrollTo(0, 0);
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// Show info message
function showInfo(message) {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = `
        <div class="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533z"/>
                <circle cx="8" cy="4.5" r="1"/>
            </svg>
            ${message}
        </div>
    `;
    
    window.scrollTo(0, 0);
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}
// ============================================
// PAYMENT MODAL FUNCTIONS
// ============================================

let selectedPaymentMethod = 'gcash';

// Show payment modal with booking details
function showPaymentModal() {
    const modal = document.getElementById('paymentModal');
    modal.classList.add('active');
    
    // Populate payment modal with booking details
    populatePaymentDetails();
    
    // Show step 1
    showPaymentStep(1);
    
    // Add event listeners for payment modal
    initializePaymentModalListeners();
}

// Populate payment modal with booking data
function populatePaymentDetails() {
    if (!selectedStation) return;
    
    const bookingDate = document.getElementById('bookingDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const totalCost = document.getElementById('totalDisplay').textContent;
    
    // Format booking date and time
    const dateObj = new Date(bookingDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    }) + ': ' + startTime + ' - ' + endTime;
    
    // Get station image
    const imageUrl = selectedStation.images && selectedStation.images.length > 0 
        ? `data:image/jpeg;base64,${selectedStation.images[0]}`
        : '../assets/images/placeholder-station.jpg';
    
    // Populate station info for all steps
    const stationInfoHTML = `
        <img src="${imageUrl}" alt="${selectedStation.stat_name}" 
             onerror="this.src='../assets/images/placeholder-station.jpg'">
        <div class="payment-station-details">
            <h3>${selectedStation.stat_name}</h3>
            <div class="payment-station-rating">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                </svg>
                <span>4.8 (5)</span>
            </div>
        </div>
    `;
    
    document.getElementById('paymentStationInfo').innerHTML = stationInfoHTML;
    document.getElementById('paymentStationInfo2').innerHTML = stationInfoHTML;
    
    // Populate booking details for all steps
    document.getElementById('paymentBookingDate').textContent = formattedDate;
    document.getElementById('paymentBookingDate2').textContent = formattedDate;
    document.getElementById('paymentCurrentType').textContent = selectedStation.charge_type + ' (AC)';
    document.getElementById('paymentTotalRate').textContent = totalCost;
    document.getElementById('paymentTotalRate2').textContent = totalCost;
}

// Initialize payment modal event listeners
function initializePaymentModalListeners() {
    // Close buttons
    document.getElementById('closePaymentModal').onclick = closePaymentModal;
    document.getElementById('closePaymentModal2').onclick = closePaymentModal;
    document.getElementById('closePaymentModal3').onclick = closePaymentModal;
    
    // Navigation buttons
    document.getElementById('goToPaymentMethodBtn').onclick = () => showPaymentStep(2);
    document.getElementById('backToReviewBtn').onclick = () => showPaymentStep(1);
    document.getElementById('goToConfirmBtn').onclick = () => showPaymentStep(3);
    document.getElementById('backToPaymentMethodBtn').onclick = () => showPaymentStep(2);
    document.getElementById('changePaymentMethodBtn').onclick = () => showPaymentStep(2);
    
    // Change buttons (go back to booking form)
    document.getElementById('changeDateBtn').onclick = closePaymentModal;
    document.getElementById('changeCurrentBtn').onclick = closePaymentModal;
    document.getElementById('changeDateBtn2').onclick = closePaymentModal;
    
    // Payment method selection
    document.querySelectorAll('.payment-method-option').forEach(option => {
        option.onclick = function() {
            document.querySelectorAll('.payment-method-option').forEach(opt => {
                opt.classList.remove('selected');
                opt.querySelector('input[type="radio"]').checked = false;
            });
            this.classList.add('selected');
            this.querySelector('input[type="radio"]').checked = true;
            selectedPaymentMethod = this.dataset.method;
        };
    });
    
    // Confirm and pay button
    document.getElementById('confirmAndPayBtn').onclick = handleConfirmAndPay;
}

// Show specific payment step
function showPaymentStep(step) {
    document.getElementById('paymentStep1').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('paymentStep2').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('paymentStep3').style.display = step === 3 ? 'block' : 'none';
}

// Close payment modal
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    modal.classList.remove('active');
}

// Handle confirm and pay
function handleConfirmAndPay() {
    const bookingDate = document.getElementById('bookingDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    
    // Combine date and time
    const startDateTime = `${bookingDate} ${startTime}:00`;
    const endDateTime = `${bookingDate} ${endTime}:00`;

    // Show loading state
    const confirmBtn = document.getElementById('confirmAndPayBtn');
    const btnText = document.getElementById('confirmButtonText');
    const btnSpinner = document.getElementById('confirmButtonSpinner');
    
    confirmBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';

    // First, book the session
    const bookingData = new FormData();
    bookingData.append('action', 'book_session');
    bookingData.append('client_id', currentUserId);
    bookingData.append('station_id', selectedStation.stat_id);
    bookingData.append('start_time', startDateTime);
    bookingData.append('end_time', endDateTime);

    fetch('../php/client-booking.php', {
        method: 'POST',
        body: bookingData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // If booking is successful, process payment
            return processPayment(data.booking_id);
        } else {
            throw new Error(data.message || 'Failed to create booking');
        }
    })
    .then(paymentResult => {
        // Reset button state
        confirmBtn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';

        if (paymentResult.success) {
            closePaymentModal();
            showSuccessModal();
        } else {
            showError(paymentResult.message || 'Payment failed');
        }
    })
    .catch(error => {
        console.error('Booking/Payment error:', error);
        confirmBtn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
        showError(error.message || 'An error occurred. Please try again.');
    });
}

function processPayment(bookingId) {
    return new Promise((resolve, reject) => {
        // Get the total amount from the display
        const totalDisplay = document.getElementById('totalDisplay').textContent;
        const amount = parseFloat(totalDisplay.replace('₱', '').trim());
        
        if (isNaN(amount)) {
            reject(new Error('Invalid amount'));
            return;
        }

        const paymentData = new FormData();
        paymentData.append('action', 'booking_payment');
        paymentData.append('booking_id', bookingId);
        paymentData.append('amount', amount);
        paymentData.append('payment_method', selectedPaymentMethod);

        fetch('../php/client-booking.php', {
            method: 'POST',
            body: paymentData
        })
        .then(response => response.json())
        .then(data => {
            resolve(data);
        })
        .catch(error => {
            reject(error);
        });
    });
}