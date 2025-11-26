// Booking History JavaScript
let allBookings = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Booking History Page Loaded');

    // Check if user is logged in
    const userName = sessionStorage.getItem('user_name');
    const userId = sessionStorage.getItem('user_id');

    if (!userName || !userId) {
        alert('Please log in first');
        window.location.href = 'client-login.html';
        return;
    }

    // Initialize page
    initializeBookingHistory();
    setupEventListeners();
});

// Initialize booking history
function initializeBookingHistory() {
    loadBookings();
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'client-dashboard.html';
        });
    }

    // Filter button
    const filterBtn = document.getElementById('filterBtn');
    const filterBar = document.getElementById('filterBar');
    if (filterBtn && filterBar) {
        filterBtn.addEventListener('click', function() {
            filterBar.classList.toggle('active');
        });
    }

    // Filter chips
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', function() {
            // Update active state
            filterChips.forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            // Apply filter
            currentFilter = this.getAttribute('data-status');
            filterBookings(currentFilter);
        });
    });

    // Browse stations button
    const browseStationsBtn = document.getElementById('browseStationsBtn');
    if (browseStationsBtn) {
        browseStationsBtn.addEventListener('click', function() {
            window.location.href = 'client-dashboard.html';
        });
    }

    // Cancel booking button
    const cancelBookingBtn = document.getElementById('cancelBookingBtn');
    if (cancelBookingBtn) {
        cancelBookingBtn.addEventListener('click', function() {
            handleCancelBooking();
        });
    }
}

// Load bookings from server
function loadBookings() {
    const userId = sessionStorage.getItem('user_id');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const bookingsList = document.getElementById('bookingsList');

    // Show loading state
    loadingState.style.display = 'flex';
    emptyState.classList.add('d-none');
    bookingsList.innerHTML = '';

    // Create form data
    const formData = new FormData();
    formData.append('user_id', userId);

    // Fetch bookings
    fetch('../php/booking-history.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Bookings response:', data);
        
        loadingState.style.display = 'none';

        if (data.success && data.data && data.data.length > 0) {
            allBookings = data.data;
            displayBookings(allBookings);
            updateStats(allBookings);
        } else {
            // Show empty state
            emptyState.classList.remove('d-none');
            updateStats([]);
        }
    })
    .catch(error => {
        console.error('Error loading bookings:', error);
        loadingState.style.display = 'none';
        emptyState.classList.remove('d-none');
        
        // Show error message
        const bookingsContainer = document.getElementById('bookingsContainer');
        bookingsContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <strong>Error loading bookings.</strong> Please try again later.
            </div>
        `;
    });
}

// Display bookings
function displayBookings(bookings) {
    const bookingsList = document.getElementById('bookingsList');
    bookingsList.innerHTML = '';

    if (bookings.length === 0) {
        document.getElementById('emptyState').classList.remove('d-none');
        return;
    }

    document.getElementById('emptyState').classList.add('d-none');

    bookings.forEach((booking, index) => {
        const bookingCard = createBookingCard(booking, index);
        bookingsList.appendChild(bookingCard);
    });
}

// Create booking card element
function createBookingCard(booking, index) {
    const card = document.createElement('div');
    card.className = `booking-card ${booking.status.toLowerCase()}`;
    
    // Format dates
    const startDate = new Date(booking.start_time);
    const endDate = new Date(booking.end_time);
    
    const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    const startDateStr = startDate.toLocaleDateString('en-US', dateOptions);
    const startTimeStr = startDate.toLocaleTimeString('en-US', timeOptions);
    const endTimeStr = endDate.toLocaleTimeString('en-US', timeOptions);
    
    // Calculate duration
    const durationMs = endDate - startDate;
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationStr = durationHours > 0 
        ? `${durationHours}h ${durationMinutes}m` 
        : `${durationMinutes}m`;

    card.innerHTML = `
        <div class="booking-header">
            <div>
                <h3 class="station-name">${booking.stat_name}</h3>
                <div class="booking-id">ID: #${booking.booking_id || (1000 + index)}</div>
            </div>
            <span class="status-badge ${booking.status.toLowerCase()}">${booking.status}</span>
        </div>
        <div class="booking-details">
            <div class="detail-row">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar3" viewBox="0 0 16 16">
                    <path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2M1 3.857C1 3.384 1.448 3 2 3h12c.552 0 1 .384 1 .857v10.286c0 .473-.448.857-1 .857H2c-.552 0-1-.384-1-.857z"/>
                    <path d="M6.5 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
                </svg>
                <span>${startDateStr}</span>
            </div>
            <div class="detail-row">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock" viewBox="0 0 16 16">
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
                </svg>
                <span>${startTimeStr} - ${endTimeStr} (${durationStr})</span>
            </div>
        </div>
        <div class="booking-footer">
            <div class="booking-rate">₱${parseFloat(booking.rate).toFixed(2)}/hr</div>
            <button class="view-details-btn" onclick="showBookingDetails(${index})">
                View Details
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
                </svg>
            </button>
        </div>
    `;

    return card;
}

// Show booking details in modal
window.showBookingDetails = function(index) {
    const booking = allBookings[index];
    const modalBody = document.getElementById('modalBookingDetails');
    const cancelBtn = document.getElementById('cancelBookingBtn');
    
    // Format dates
    const startDate = new Date(booking.start_time);
    const endDate = new Date(booking.end_time);
    
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    
    // Calculate total cost
    const durationMs = endDate - startDate;
    const durationHours = durationMs / (1000 * 60 * 60);
    const totalCost = (durationHours * parseFloat(booking.rate)).toFixed(2);
    
    modalBody.innerHTML = `
        <div class="detail-section">
            <div class="section-title">Station Information</div>
            <div class="detail-item">
                <span class="detail-item-label">Station Name</span>
                <span class="detail-item-value">${booking.stat_name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-item-label">Booking ID</span>
                <span class="detail-item-value">#${booking.booking_id || (1000 + index)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-item-label">Status</span>
                <span class="detail-item-value">
                    <span class="status-badge ${booking.status.toLowerCase()}">${booking.status}</span>
                </span>
            </div>
        </div>
        
        <div class="detail-section">
            <div class="section-title">Booking Schedule</div>
            <div class="detail-item">
                <span class="detail-item-label">Start Date</span>
                <span class="detail-item-value">${startDate.toLocaleDateString('en-US', dateOptions)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-item-label">Start Time</span>
                <span class="detail-item-value">${startDate.toLocaleTimeString('en-US', timeOptions)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-item-label">End Time</span>
                <span class="detail-item-value">${endDate.toLocaleTimeString('en-US', timeOptions)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-item-label">Duration</span>
                <span class="detail-item-value">${durationHours.toFixed(2)} hours</span>
            </div>
        </div>
        
        <div class="detail-section">
            <div class="section-title">Pricing</div>
            <div class="detail-item">
                <span class="detail-item-label">Rate per Hour</span>
                <span class="detail-item-value">₱${parseFloat(booking.rate).toFixed(2)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-item-label">Total Cost</span>
                <span class="detail-item-value" style="color: #079FDB; font-size: 18px;">₱${totalCost}</span>
            </div>
        </div>
    `;
    
    // Show/hide cancel button based on status
    if (booking.status.toLowerCase() === 'upcoming') {
        cancelBtn.classList.remove('d-none');
        cancelBtn.setAttribute('data-booking-index', index);
    } else {
        cancelBtn.classList.add('d-none');
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
    modal.show();
};

// Update statistics
function updateStats(bookings) {
    const completed = bookings.filter(b => b.status.toLowerCase() === 'completed').length;
    const ongoing = bookings.filter(b => b.status.toLowerCase() === 'ongoing').length;
    const upcoming = bookings.filter(b => b.status.toLowerCase() === 'upcoming').length;
    
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('ongoingCount').textContent = ongoing;
    document.getElementById('upcomingCount').textContent = upcoming;
}

// Filter bookings
function filterBookings(status) {
    console.log('Filtering by status:', status);
    
    let filteredBookings = allBookings;
    
    if (status !== 'all') {
        filteredBookings = allBookings.filter(booking => 
            booking.status.toLowerCase() === status.toLowerCase()
        );
    }
    
    displayBookings(filteredBookings);
}

// Handle cancel booking
function handleCancelBooking() {
    const cancelBtn = document.getElementById('cancelBookingBtn');
    const bookingIndex = cancelBtn.getAttribute('data-booking-index');
    const booking = allBookings[bookingIndex];
    
    if (confirm(`Are you sure you want to cancel this booking at ${booking.stat_name}?`)) {
        // TODO: Implement actual cancellation API call
        const formData = new FormData();
        formData.append('booking_id', booking.booking_id || (1000 + parseInt(bookingIndex)));
        formData.append('user_id', sessionStorage.getItem('user_id'));
        
        // For now, just show a message
        alert('Booking cancellation feature coming soon!');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('bookingDetailsModal'));
        modal.hide();
        
    }
}

// Refresh bookings
function refreshBookings() {
    loadBookings();
}