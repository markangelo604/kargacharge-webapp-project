// Global variables
let bookingData = null;
let stationData = null;
let timerInterval = null;
let selectedRating = 0;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Charging page loaded');

    // Check if user is logged in
    const userName = sessionStorage.getItem('user_name');
    const userId = sessionStorage.getItem('user_id');

    if (!userName || !userId) {
        alert('Please log in first');
        window.location.href = 'client-login.html';
        return;
    }

    // Get booking ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('booking_id');

    if (!bookingId) {
        alert('No booking found');
        window.location.href = 'client-dashboard.html';
        return;
    }

    // Load booking data
    loadBookingData(bookingId);

    // Initialize event listeners
    initializeEventListeners();
});

// Load booking and station data
function loadBookingData(bookingId) {
    // Create form data
    const formData = new FormData();
    formData.append('action', 'get_booking_details');
    formData.append('booking_id', bookingId);

    fetch('../php/client-charging.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            bookingData = data.booking;
            stationData = data.station;
            populateBookingInfo();
            startChargingTimer();
        } else {
            alert('Failed to load booking details: ' + data.message);
            window.location.href = 'client-dashboard.html';
        }
    })
    .catch(error => {
        console.error('Error loading booking data:', error);
        alert('Error loading booking information');
    });
}

// Populate booking information across all steps
function populateBookingInfo() {
    if (!bookingData || !stationData) return;

    // Format dates
    const startDate = new Date(bookingData.time_in * 1000);
    const endDate = new Date(bookingData.time_out * 1000);
    
    const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    
    const dateStr = startDate.toLocaleDateString('en-US', dateOptions);
    const startTimeStr = startDate.toLocaleTimeString('en-US', timeOptions);
    const endTimeStr = endDate.toLocaleTimeString('en-US', timeOptions);
    
    const bookingDateStr = `${dateStr}: ${startTimeStr} - ${endTimeStr}`;

    // Station images
    const imageUrl = stationData.images && stationData.images.length > 0 
        ? `data:image/jpeg;base64,${stationData.images[0]}`
        : '../assets/images/placeholder-station.jpg';

    // Step 1: Charging
    document.getElementById('stationImage').src = imageUrl;
    document.getElementById('stationImage').onerror = function() {
        this.src = '../assets/images/placeholder-station.jpg';
    };
    document.getElementById('stationName').textContent = stationData.stat_name;
    document.getElementById('stationRating').textContent = '4.8 (6)'; // Placeholder
    document.getElementById('bookingDate').textContent = bookingDateStr;
    document.getElementById('currentType').textContent = stationData.charge_type;
    document.getElementById('totalRate').textContent = `₱ ${parseFloat(bookingData.rate).toFixed(2)}`;

    // Step 2: Finished
    document.getElementById('stationImage2').src = imageUrl;
    document.getElementById('stationImage2').onerror = function() {
        this.src = '../assets/images/placeholder-station.jpg';
    };
    document.getElementById('stationName2').textContent = stationData.stat_name;
    document.getElementById('stationRating2').textContent = '4.8 (6)'; // Placeholder
    document.getElementById('bookingDate2').textContent = bookingDateStr;
    document.getElementById('currentType2').textContent = stationData.charge_type;
    document.getElementById('totalRate2').textContent = `₱ ${parseFloat(bookingData.rate).toFixed(2)}`;

    // Step 3: Completed
    document.getElementById('stationImage3').src = imageUrl;
    document.getElementById('stationImage3').onerror = function() {
        this.src = '../assets/images/placeholder-station.jpg';
    };
    document.getElementById('stationName3').textContent = stationData.stat_name;
    document.getElementById('ownerName').textContent = stationData.provider_name || 'Station Owner';
}

// Start charging timer
function startChargingTimer() {
    if (!bookingData) return;

    const endTime = bookingData.time_out * 1000; // Convert to milliseconds
    
    timerInterval = setInterval(() => {
        const now = Date.now();
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            document.getElementById('timerDisplay').textContent = '00:00:00';
            // Auto-finish charging when time runs out
            setTimeout(() => {
                finishCharging();
            }, 1000);
            return;
        }

        // Calculate hours, minutes, seconds
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        // Format with leading zeros
        const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.getElementById('timerDisplay').textContent = timeString;
    }, 1000);
}

// Initialize event listeners
function initializeEventListeners() {
    // Back buttons
    document.getElementById('backBtn').addEventListener('click', () => goBackToDashboard());
    document.getElementById('backBtn2').addEventListener('click', () => showStep('chargingStep'));
    document.getElementById('backBtn3').addEventListener('click', () => showStep('finishedStep'));

    // Close buttons
    document.getElementById('closeBtn').addEventListener('click', () => goBackToDashboard());
    document.getElementById('closeBtn2').addEventListener('click', () => goBackToDashboard());
    document.getElementById('closeBtn3').addEventListener('click', () => goBackToDashboard());

    // Finish Charging button
    document.getElementById('finishChargingBtn').addEventListener('click', () => finishCharging());

    // Report button
    document.getElementById('reportBtn').addEventListener('click', () => openReportModal());
    document.getElementById('submitReportBtn').addEventListener('click', () => submitReport());

    // Continue button
    document.getElementById('continueBtn').addEventListener('click', () => completeTransaction());

    // Star rating
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            updateStarRating(selectedRating);
        });

        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            updateStarRating(rating);
        });
    });

    document.getElementById('starRating').addEventListener('mouseleave', function() {
        updateStarRating(selectedRating);
    });

    // Submit review
    document.getElementById('submitReviewBtn').addEventListener('click', submitReview);
}

// Show specific step
function showStep(stepId) {
    document.querySelectorAll('.charging-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
}

// Finish charging
function finishCharging() {
    if (!bookingData) return;

    // Stop timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Update booking status in backend
    const formData = new FormData();
    formData.append('action', 'finish_charging');
    formData.append('booking_id', bookingData.book_id);

    fetch('../php/client-charging.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showStep('finishedStep');
        } else {
            alert('Failed to finish charging: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error finishing charging:', error);
        alert('Error finishing charging session');
    });
}

// Open report modal
function openReportModal() {
    const reportModal = new bootstrap.Modal(document.getElementById('reportModal'));
    reportModal.show();
}

// Submit report
function submitReport() {
    const reason = document.getElementById('reportReason').value;
    const description = document.getElementById('reportDescription').value;
    const errorDiv = document.getElementById('reportError');
    const successDiv = document.getElementById('reportSuccess');

    errorDiv.classList.add('d-none');
    successDiv.classList.add('d-none');

    if (!reason || !description) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.classList.remove('d-none');
        return;
    }

    const submitBtn = document.getElementById('submitReportBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const formData = new FormData();
    formData.append('action', 'submit_report');
    formData.append('booking_id', bookingData.book_id);
    formData.append('station_id', stationData.stat_id);
    formData.append('reason', reason);
    formData.append('description', description);
    formData.append('user_id', sessionStorage.getItem('user_id'));

    fetch('../php/client-charging.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Report';

        if (data.success) {
            successDiv.textContent = 'Report submitted successfully';
            successDiv.classList.remove('d-none');
            document.getElementById('reportForm').reset();

            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('reportModal'));
                modal.hide();
                successDiv.classList.add('d-none');
            }, 2000);
        } else {
            errorDiv.textContent = data.message || 'Failed to submit report';
            errorDiv.classList.remove('d-none');
        }
    })
    .catch(error => {
        console.error('Error submitting report:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Report';
        errorDiv.textContent = 'Error submitting report';
        errorDiv.classList.remove('d-none');
    });
}

// Complete transaction
function completeTransaction() {
    if (!bookingData) return;

    const formData = new FormData();
    formData.append('action', 'complete_transaction');
    formData.append('booking_id', bookingData.book_id);

    fetch('../php/client-charging.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showStep('completedStep');
        } else {
            alert('Failed to complete transaction: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error completing transaction:', error);
        alert('Error completing transaction');
    });
}

// Update star rating display
function updateStarRating(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Submit review
function submitReview() {
    if (selectedRating === 0) {
        alert('Please select a rating');
        return;
    }

    const comment = document.getElementById('commentText').value.trim();
    const anonymous = document.getElementById('anonymousCheck').checked;
    const submitBtn = document.getElementById('submitReviewBtn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const formData = new FormData();
    formData.append('action', 'submit_review');
    formData.append('booking_id', bookingData.book_id);
    formData.append('station_id', stationData.stat_id);
    formData.append('user_id', sessionStorage.getItem('user_id'));
    formData.append('rating', selectedRating);
    formData.append('comment', comment);
    formData.append('anonymous', anonymous ? '1' : '0');

    fetch('../php/client-charging.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';

        if (data.success) {
            alert('Thank you for your review!');
            window.location.href = 'client-dashboard.html';
        } else {
            alert('Failed to submit review: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error submitting review:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        alert('Error submitting review');
    });
}

// Go back to dashboard
function goBackToDashboard() {
    if (confirm('Are you sure you want to leave this page?')) {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        window.location.href = 'client-dashboard.html';
    }
}
