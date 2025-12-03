// Load statistics when Stats tab is opened
document.addEventListener('DOMContentLoaded', function() {
    const statsNavItem = document.querySelector('[data-tab="statsTab"]');
    if (statsNavItem) {
        statsNavItem.addEventListener('click', function() {
            loadProviderStats();
        });
    }
    
    // Load stats on initial page load if on stats tab
    if (document.getElementById('statsTab').classList.contains('active')) {
        loadProviderStats();
    }
});

function loadProviderStats() {
    const providerId = sessionStorage.getItem('user_id');
    
    if (!providerId) {
        console.error('Provider ID not found');
        return;
    }
    
    // Show loading state
    showStatsLoading();
    
    fetch(`../php/get-provider-stats.php?prov_id=${providerId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayStats(data);
            } else {
                showStatsError(data.message);
            }
        })
        .catch(error => {
            console.error('Error loading stats:', error);
            showStatsError('Failed to load statistics');
        });
}

function showStatsLoading() {
    const statsContent = document.getElementById('statsContent');
    if (statsContent) {
        statsContent.innerHTML = `
            <div class="loading-stats">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading statistics...</p>
            </div>
        `;
    }
}

function showStatsError(message) {
    const statsContent = document.getElementById('statsContent');
    if (statsContent) {
        statsContent.innerHTML = `
            <div class="error-stats">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="bi bi-exclamation-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                    <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
                </svg>
                <p>${message}</p>
            </div>
        `;
    }
}

function displayStats(data) {
    const statsContent = document.getElementById('statsContent');
    if (!statsContent) return;
    
    statsContent.innerHTML = `
        <!-- Overview Cards -->
        <div class="stats-cards">
            <div class="stat-card primary">
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-ev-station-fill" viewBox="0 0 16 16">
                        <path d="M1 2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v8a2 2 0 0 1 2 2v.5a.5.5 0 0 0 1 0V8h-.5a.5.5 0 0 1-.5-.5V4.375a.5.5 0 0 1 .5-.5h1.495c-.011-.476-.053-.894-.201-1.222a.97.97 0 0 0-.394-.458c-.184-.11-.464-.195-.9-.195a.5.5 0 0 1 0-1c.564 0 1.034.11 1.412.336.383.228.672.538.837.958.18.43.252.995.252 1.581v3.625a1.5 1.5 0 0 1-.5 1.118v2.382a1.5 1.5 0 0 1-3 0V12a1 1 0 0 0-1-1v4h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1zm2 .5v2h3v-2zm0 3v3h3v-3z"/>
                    </svg>
                </div>
                <div class="stat-info">
                    <p class="stat-label">Total Stations</p>
                    <h3 class="stat-value">${data.total_stations}</h3>
                </div>
            </div>
            
            <div class="stat-card success">
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-calendar-check-fill" viewBox="0 0 16 16">
                        <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2m-5.146-5.146-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L7.5 10.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
                    </svg>
                </div>
                <div class="stat-info">
                    <p class="stat-label">Total Bookings</p>
                    <h3 class="stat-value">${data.total_bookings}</h3>
                </div>
            </div>
            
            <div class="stat-card warning">
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-cash-stack" viewBox="0 0 16 16">
                        <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
                        <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2z"/>
                    </svg>
                </div>
                <div class="stat-info">
                    <p class="stat-label">Total Revenue</p>
                    <h3 class="stat-value">₱${formatNumber(data.total_revenue)}</h3>
                </div>
            </div>
            
            <div class="stat-card info">
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
                        <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                    </svg>
                </div>
                <div class="stat-info">
                    <p class="stat-label">Avg Rating</p>
                    <h3 class="stat-value">${data.average_rating > 0 ? data.average_rating.toFixed(1) : 'N/A'}</h3>
                    <small class="stat-sublabel">${data.total_reviews} reviews</small>
                </div>
            </div>
        </div>
        
        <!-- Station Status Overview -->
        <div class="status-overview">
            <h4 class="section-title">Station Status</h4>
            <div class="status-cards">
                <div class="status-card available">
                    <div class="status-count">${data.available_stations}</div>
                    <div class="status-label">Available</div>
                </div>
                <div class="status-card occupied">
                    <div class="status-count">${data.occupied_stations}</div>
                    <div class="status-label">Occupied</div>
                </div>
                <div class="status-card maintenance">
                    <div class="status-count">${data.maintenance_stations}</div>
                    <div class="status-label">Maintenance</div>
                </div>
                <div class="status-card out-of-service">
                    <div class="status-count">${data.out_of_service_stations}</div>
                    <div class="status-label">Out of Service</div>
                </div>
            </div>
        </div>
        
        <!-- Revenue Chart -->
        ${data.revenue_by_month.length > 0 ? `
        <div class="chart-container">
            <h4 class="section-title">Revenue Trend (Last 6 Months)</h4>
            <div class="revenue-chart">
                ${createRevenueChart(data.revenue_by_month)}
            </div>
        </div>
        ` : ''}
        
        <!-- Station Performance -->
        ${data.station_performance.length > 0 ? `
        <div class="performance-section">
            <h4 class="section-title">Station Performance</h4>
            <div class="performance-list">
                ${data.station_performance.map(station => `
                    <div class="performance-item">
                        <div class="performance-header">
                            <div>
                                <h5 class="station-name">${station.stat_name || 'Unnamed Station'}</h5>
                                <p class="station-location">${station.location}</p>
                            </div>
                            <span class="station-status ${getStatusClass(station.status)}">
                                ${station.status}
                            </span>
                        </div>
                        <div class="performance-stats">
                            <div class="perf-stat">
                                <span class="perf-label">Bookings</span>
                                <span class="perf-value">${station.total_bookings}</span>
                            </div>
                            <div class="perf-stat">
                                <span class="perf-label">Revenue</span>
                                <span class="perf-value">₱${formatNumber(station.revenue)}</span>
                            </div>
                            <div class="perf-stat">
                                <span class="perf-label">Rating</span>
                                <span class="perf-value">${station.avg_rating ? station.avg_rating.toFixed(1) + '⭐' : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <!-- Recent Bookings -->
        ${data.recent_bookings.length > 0 ? `
        <div class="recent-bookings-section">
            <h4 class="section-title">Recent Bookings</h4>
            <div class="bookings-list">
                ${data.recent_bookings.map(booking => `
                    <div class="booking-item">
                        <div class="booking-header">
                            <span class="booking-id">#${booking.book_id}</span>
                            <span class="booking-status status-${booking.status}">${booking.status}</span>
                        </div>
                        <div class="booking-details">
                            <p class="booking-station">${booking.station_name}</p>
                            <p class="booking-customer">${booking.customer_name}</p>
                            <p class="booking-date">${formatDate(booking.date)}</p>
                        </div>
                        <div class="booking-footer">
                            <span class="booking-duration">${booking.duration}h</span>
                            <span class="booking-revenue">₱${formatNumber(booking.revenue)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;
}

function createRevenueChart(data) {
    if (data.length === 0) return '<p class="no-data">No revenue data available</p>';
    
    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const chartHeight = 200;
    
    return `
        <div class="chart">
            <div class="chart-bars">
                ${data.map(item => {
                    const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                    return `
                        <div class="chart-bar-wrapper">
                            <div class="chart-bar" style="height: ${height}%" title="₱${formatNumber(item.revenue)}">
                                <span class="bar-value">₱${formatNumber(item.revenue)}</span>
                            </div>
                            <span class="bar-label">${item.month}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
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