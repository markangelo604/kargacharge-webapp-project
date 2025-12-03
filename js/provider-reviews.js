// Load reviews when Reviews tab is opened
document.addEventListener('DOMContentLoaded', function() {
    const reviewsNavItem = document.querySelector('[data-tab="reviewsTab"]');
    if (reviewsNavItem) {
        reviewsNavItem.addEventListener('click', function() {
            loadProviderReviews();
        });
    }
});

function loadProviderReviews() {
    const providerId = sessionStorage.getItem('user_id');
    
    if (!providerId) {
        console.error('Provider ID not found');
        return;
    }
    
    // Show loading state
    showReviewsLoading();
    
    fetch(`../php/get-provider-reviews.php?prov_id=${providerId}`)
        .then(response => response.json())
        .then(data => {
            console.log('Reviews data received:', data);
            
            if (data.success) {
                displayReviews(data);
            } else {
                showReviewsError(data.message);
            }
        })
        .catch(error => {
            console.error('Error loading reviews:', error);
            showReviewsError('Failed to load reviews');
        });
}

function showReviewsLoading() {
    const reviewsContent = document.getElementById('reviewsContent');
    if (reviewsContent) {
        reviewsContent.innerHTML = `
            <div class="loading-state">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading reviews...</p>
            </div>
        `;
    }
}

function showReviewsError(message) {
    const reviewsContent = document.getElementById('reviewsContent');
    if (reviewsContent) {
        reviewsContent.innerHTML = `
            <div class="empty-reviews">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="bi bi-exclamation-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                    <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
                </svg>
                <p>${message}</p>
            </div>
        `;
    }
}

function displayReviews(data) {
    const reviewsContent = document.getElementById('reviewsContent');
    if (!reviewsContent) return;
    
    // Check if there are no reviews
    if (!data.reviews || data.reviews.length === 0) {
        reviewsContent.innerHTML = `
            <div class="empty-reviews">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
                    <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
                </svg>
                <h3>No Reviews Yet</h3>
                <p>Your charging stations haven't received any reviews yet</p>
            </div>
        `;
        return;
    }
    
    // Create reviews summary and list
    reviewsContent.innerHTML = `
        ${createReviewsSummary(data)}
        <div class="reviews-list">
            ${data.reviews.map(review => createReviewCard(review)).join('')}
        </div>
    `;
}

function createReviewsSummary(data) {
    const avgRating = parseFloat(data.average_rating) || 0;
    const totalReviews = data.total_reviews || 0;
    const distribution = data.rating_distribution || {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    
    return `
        <div class="reviews-summary">
            <div class="summary-top">
                <div class="overall-rating">
                    <div class="rating-number">${avgRating.toFixed(1)}</div>
                    <div class="rating-stars">
                        ${createStarRating(avgRating)}
                    </div>
                    <p class="total-reviews-text">${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'}</p>
                </div>
                
                <div class="rating-breakdown">
                    ${[5, 4, 3, 2, 1].map(rating => {
                        const count = distribution[rating] || 0;
                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                        return `
                            <div class="rating-row">
                                <span class="rating-label">
                                    ${rating} <span class="star">★</span>
                                </span>
                                <div class="rating-bar">
                                    <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                                </div>
                                <span class="rating-count">${count}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

function createReviewCard(review) {
    return `
        <div class="review-card">
            <div class="review-header">
                <div class="review-rating">
                    ${createStarRating(review.rating)}
                </div>
            </div>
            
            <div class="review-station">
                <p class="station-label">Charging Station</p>
                <p class="station-name-text">${review.station_name || 'N/A'}</p>
                <p class="station-location-text">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16">
                        <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                    </svg>
                    ${review.station_location || 'N/A'}
                </p>
            </div>
            
            <p class="review-comment">${escapeHtml(review.comment)}</p>
        </div>
    `;
}

function createStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<span class="star">★</span>';
    }
    
    // Half star (if applicable)
    if (hasHalfStar) {
        stars += '<span class="star">★</span>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars += '<span class="star empty">★</span>';
    }
    
    return stars;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}