// Global variables
let foodPosts = [];
let ngos = [];
let unsubscribeListener = null;

// Real NGO data
const realNGOs = [
    {
        id: '1',
        name: "Feeding America",
        mission: "Largest hunger-relief organization in the US, serving 40 million people annually",
        contact: "Sarah Johnson",
        phone: "+1-800-771-2303",
        email: "partners@feedingamerica.org",
        address: "National Office, Chicago, IL",
        website: "feedingamerica.org",
        areas: ["National Network", "Food Banks", "Emergency Relief"],
        verified: true
    },
    {
        id: '2',
        name: "World Food Programme",
        mission: "UN agency fighting hunger worldwide, providing food assistance in emergencies",
        contact: "David Chen",
        phone: "+1-202-747-0722",
        email: "private.sector@wfp.org",
        address: "Washington D.C. Office",
        website: "wfp.org",
        areas: ["Global Relief", "Emergency Response", "School Meals"],
        verified: true
    },
    {
        id: '3',
        name: "Food for Life Global",
        mission: "World's largest vegan food relief organization, serving 2 million+ daily meals",
        contact: "Maria Rodriguez",
        phone: "+1-845-620-0255",
        email: "info@ffl.org",
        address: "International Headquarters",
        website: "ffl.org",
        areas: ["Plant-based Meals", "Disaster Relief", "Community Kitchens"],
        verified: true
    },
    {
        id: '4',
        name: "The Global FoodBanking Network",
        mission: "Supporting community-led food banks in over 40 countries",
        contact: "James Wilson",
        phone: "+1-312-782-4566",
        email: "info@foodbanking.org",
        address: "Chicago, IL",
        website: "foodbanking.org",
        areas: ["Food Banking", "Capacity Building", "Network Support"],
        verified: true
    },
    {
        id: '5',
        name: "No Kid Hungry",
        mission: "Ending childhood hunger in America through school meals and education",
        contact: "Lisa Thompson",
        phone: "+1-800-969-4767",
        email: "info@nokidhungry.org",
        address: "National Campaign Office",
        website: "nokidhungry.org",
        areas: ["Child Nutrition", "School Meals", "Summer Programs"],
        verified: true
    },
    {
        id: '6',
        name: "Food Not Bombs",
        mission: "Volunteer movement sharing free vegetarian food and protesting war",
        contact: "Community Coordinator",
        phone: "Local Chapters",
        email: "info@foodnotbombs.net",
        address: "Global Network",
        website: "foodnotbombs.net",
        areas: ["Local Chapters", "Vegetarian Meals", "Activism"],
        verified: true
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 FoodConnect initialized!');
    setDefaultExpiryTime();
    loadFoodPostsFromFirebase();
    setupRealTimeUpdates();
    displayNGOs();
    updateLiveMetrics();
    setupEventListeners();
    
    // Update metrics every 30 seconds
    setInterval(updateLiveMetrics, 30000);
});

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle - FIXED VERSION
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                const navMenu = document.querySelector('.nav-menu');
                if (navMenu) navMenu.classList.remove('active');
            }
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            const navMenu = document.querySelector('.nav-menu');
            const navToggle = document.querySelector('.nav-toggle');
            
            if (navMenu && navMenu.classList.contains('active') && 
                !navMenu.contains(e.target) && 
                !navToggle.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        }
    });
    
    // Window resize handler - FIXED
    window.addEventListener('resize', function() {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            if (window.innerWidth > 768) {
                navMenu.classList.remove('active');
                // Remove any inline display styles
                navMenu.style.display = '';
            } else if (window.innerWidth <= 768 && navMenu.classList.contains('active')) {
                navMenu.style.display = 'flex';
            }
        }
    });
}

// Navigation function
function showSection(sectionId, event) {
    console.log('🔄 Switching to:', sectionId);
    
    // Prevent default behavior for anchor links
    if (event) {
        event.preventDefault();
    }
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    if (event) {
        let targetElement = event.currentTarget; // Use currentTarget instead of target
        if (targetElement.classList.contains('nav-link')) {
            targetElement.classList.add('active');
        }
    } else {
        // Fallback: find and activate the corresponding nav link
        const correspondingLink = document.querySelector(`.nav-link[onclick*="${sectionId}"]`);
        if (correspondingLink) {
            correspondingLink.classList.add('active');
        }
    }
    
    // Close mobile menu if open (using class instead of display none)
    if (window.innerWidth <= 768) {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.classList.remove('active'); // Use class to control visibility
        }
    }
    
    // Section-specific actions
    if (sectionId === 'listings') {
        loadFoodPostsFromFirebase();
        setupRealTimeUpdates();
    } else if (sectionId === 'post-food') {
        setDefaultExpiryTime();
    } else if (sectionId === 'ngos') {
        displayNGOs();
    }
}

// Load food posts from Firebase
async function loadFoodPostsFromFirebase() {
    showLoading(true);
    try {
        console.log('📥 Loading food posts from Firebase...');
        foodPosts = await getFoodPosts();
        console.log('✅ Loaded posts:', foodPosts.length);
        displayFoodListings(foodPosts);
        updateLocationFilter();
        updateMiniStats();
        updateLiveMetrics();
    } catch (error) {
        console.error('❌ Error loading from Firebase:', error);
        displayFoodListings([]);
    }
    showLoading(false);
}

// Set up real-time updates
function setupRealTimeUpdates() {
    if (unsubscribeListener) {
        unsubscribeListener();
    }
    
    unsubscribeListener = setupFoodPostsListener((posts) => {
        console.log('🔄 Real-time update:', posts.length, 'posts');
        foodPosts = posts;
        displayFoodListings(posts);
        updateLocationFilter();
        updateMiniStats();
        updateLiveMetrics();
    });
}

// Display food listings
function displayFoodListings(posts) {
    const container = document.getElementById('foodListings');
    if (!container) {
        console.error('❌ Food listings container not found!');
        return;
    }
    
    console.log('📋 Displaying posts:', posts.length);
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No food available yet</h3>
                <p>Be the first to post available food in your area!</p>
                <button class="btn btn-primary" onclick="showSection('post-food')" style="margin-top: 20px;">
                    <i class="fas fa-plus"></i> Post Food Now
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = posts.map(post => {
        const expiryTime = new Date(post.expiryTime);
        const postTime = getPostTimestamp(post);
        const expiryTimer = getExpiryTimer(expiryTime);
        const isExpiringSoon = expiryTimer.includes('Expires in') && !expiryTimer.includes('day');
        
        return `
        <div class="food-card" data-id="${post.id}">
            <div class="food-card-header">
                <h3 class="food-card-title">${post.title}</h3>
                <p class="food-card-description">${post.description}</p>
                <div class="food-card-details">
                    <span class="food-quantity">
                        <i class="fas fa-utensils"></i>
                        ${post.quantity} ${post.quantityUnit}
                    </span>
                    <span class="food-expiry">
                        <i class="fas fa-clock"></i>
                        ${formatExpiryTime(expiryTime)}
                    </span>
                    <span class="food-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${post.location}
                    </span>
                </div>
            </div>
            <div class="food-card-body">
                <div class="expiry-timer ${expiryTimer === 'Expired' ? 'expired' : isExpiringSoon ? 'warning' : ''}">
                    ${expiryTimer}
                </div>
                <div class="food-card-contact">
                    <p><i class="fas fa-user"></i> ${post.donorName}</p>
                    <p><i class="fas fa-phone"></i> ${post.donorPhone}</p>
                    ${post.donorEmail ? `<p><i class="fas fa-envelope"></i> ${post.donorEmail}</p>` : ''}
                    <p><i class="fas fa-calendar"></i> Posted: ${formatExpiryTime(postTime)}</p>
                </div>
                <div class="food-card-actions">
                    <button class="btn btn-outline btn-sm" onclick="contactDonor('${post.donorName}', '${post.donorPhone}', '${post.donorEmail || ''}')">
                        <i class="fas fa-phone"></i> Contact Donor
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="shareFoodPost('${post.title}', '${post.location}')">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Get timestamp from post (handles both createdAt and timestamp)
function getPostTimestamp(post) {
    if (post.createdAt) {
        return post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
    }
    return new Date(post.timestamp);
}

// Format expiry time
function formatExpiryTime(date) {
    try {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }
        return date.toLocaleDateString('en-US', { 
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) + ' ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Date error';
    }
}

// Get expiry timer
function getExpiryTimer(expiryTime) {
    try {
        const now = new Date();
        const expiry = expiryTime instanceof Date ? expiryTime : new Date(expiryTime);
        
        if (isNaN(expiry.getTime())) {
            return 'Date error';
        }
        
        const diffMs = expiry - now;
        
        if (diffMs <= 0) return 'Expired';
        
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours > 24) {
            const days = Math.floor(diffHours / 24);
            return `Expires in ${days} day${days > 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
            return `Expires in ${diffHours}h ${diffMinutes}m`;
        } else {
            return `Expires in ${diffMinutes}m`;
        }
    } catch (error) {
        return 'Timer error';
    }
}

// Update location filter options
function updateLocationFilter() {
    const locationFilter = document.getElementById('locationFilter');
    if (!locationFilter) return;
    
    const locations = [...new Set(foodPosts.map(post => post.location))];
    
    // Keep the current selection
    const currentSelection = locationFilter.value;
    
    locationFilter.innerHTML = '<option value="">All Locations</option>' +
        locations.map(location => 
            `<option value="${location}" ${location === currentSelection ? 'selected' : ''}>${location}</option>`
        ).join('');
}

// Set default expiry time
function setDefaultExpiryTime() {
    const expiryInput = document.getElementById('expiryTime');
    if (expiryInput) {
        const now = new Date();
        now.setHours(now.getHours() + 4);
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        expiryInput.value = localDateTime;
    }
}

// Submit food form to Firebase
async function submitFoodForm(event) {
    event.preventDefault();
    showLoading(true);
    
    const foodData = {
        title: document.getElementById('foodTitle').value.trim(),
        description: document.getElementById('foodDescription').value.trim(),
        quantity: document.getElementById('foodQuantity').value,
        quantityUnit: document.getElementById('quantityUnit').value,
        expiryTime: document.getElementById('expiryTime').value,
        location: document.getElementById('location').value.trim(),
        donorName: document.getElementById('donorName').value.trim(),
        donorPhone: document.getElementById('donorPhone').value.trim(),
        donorEmail: document.getElementById('donorEmail').value.trim() || '',
        timestamp: new Date().toISOString(),
        status: 'available'
    };

    // Basic validation
    if (!foodData.title || !foodData.description || !foodData.location || !foodData.donorName || !foodData.donorPhone) {
        showNotification('❌ Please fill in all required fields.', 'error');
        showLoading(false);
        return;
    }

    try {
        console.log('📤 Submitting food data:', foodData);
        await addFoodPost(foodData);
        showNotification('✅ Food posted successfully! NGOs will contact you soon.');
        
        // Reset form
        document.getElementById('foodForm').reset();
        setDefaultExpiryTime();
        
        // Real-time listener will automatically update the listings
        // Just switch to listings page after a delay
        setTimeout(() => {
            showSection('listings');
        }, 2000);
        
    } catch (error) {
        showNotification('❌ Error posting food. Please try again.', 'error');
        console.error('Error submitting food form:', error);
    }
    showLoading(false);
}

// Filter food listings
function filterFoodListings() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const locationFilter = document.getElementById('locationFilter').value;
    
    let filteredPosts = foodPosts;
    
    if (searchTerm) {
        filteredPosts = filteredPosts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) ||
            post.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (locationFilter) {
        filteredPosts = filteredPosts.filter(post => post.location === locationFilter);
    }
    
    console.log('🔍 Filtered posts:', filteredPosts.length);
    displayFoodListings(filteredPosts);
}

// Sort food listings
function sortFoodListings() {
    const sortBy = document.getElementById('sortFilter').value;
    let sortedPosts = [...foodPosts];
    
    switch (sortBy) {
        case 'newest':
            sortedPosts.sort((a, b) => {
                const timeA = getPostTimestamp(a).getTime();
                const timeB = getPostTimestamp(b).getTime();
                return timeB - timeA;
            });
            break;
        case 'expiring':
            sortedPosts.sort((a, b) => {
                const timeA = new Date(a.expiryTime).getTime();
                const timeB = new Date(b.expiryTime).getTime();
                return timeA - timeB;
            });
            break;
        case 'quantity':
            sortedPosts.sort((a, b) => {
                const qtyA = parseInt(a.quantity) || 0;
                const qtyB = parseInt(b.quantity) || 0;
                return qtyB - qtyA;
            });
            break;
    }
    
    displayFoodListings(sortedPosts);
}

// Display NGOs
function displayNGOs() {
    const container = document.getElementById('ngoListings');
    if (!container) return;
    
    container.innerHTML = realNGOs.map(ngo => `
        <div class="ngo-card">
            <div class="ngo-icon">
                <i class="fas fa-hands-helping"></i>
            </div>
            <h3>${ngo.name}</h3>
            <p>${ngo.mission}</p>
            <div class="ngo-contact">
                <p><i class="fas fa-user"></i> Contact: ${ngo.contact}</p>
                <p><i class="fas fa-phone"></i> ${ngo.phone}</p>
                <p><i class="fas fa-envelope"></i> ${ngo.email}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${ngo.address}</p>
                <p><i class="fas fa-globe"></i> ${ngo.website}</p>
            </div>
            <div class="ngo-areas">
                ${ngo.areas.map(area => `<span class="area-tag">${area}</span>`).join('')}
            </div>
            <div class="ngo-actions">
                <button class="btn btn-outline" onclick="contactNGO('${ngo.name}', '${ngo.email}')">
                    <i class="fas fa-envelope"></i> Contact NGO
                </button>
                <button class="btn btn-primary" onclick="visitWebsite('${ngo.website}')">
                    <i class="fas fa-external-link-alt"></i> Visit Website
                </button>
            </div>
        </div>
    `).join('');
}

// Contact NGO function
function contactNGO(ngoName, email) {
    const subject = `FoodConnect: Food Donation Inquiry - ${ngoName}`;
    const body = `Dear ${ngoName} Team,\n\nI would like to coordinate a food donation through FoodConnect.\n\nPlease let me know the best way to proceed.\n\nThank you,\n[Your Name]`;
    
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
}

// Visit website function
function visitWebsite(url) {
    window.open(`https://${url}`, '_blank');
}

// Contact donor function
function contactDonor(donorName, phone, email) {
    if (email) {
        const subject = `FoodConnect: Inquiry about your food donation`;
        const body = `Dear ${donorName},\n\nI saw your food donation listing on FoodConnect and would like to coordinate pickup.\n\nPlease let me know what would be a convenient time.\n\nThank you!`;
        window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    } else {
        // Fallback to phone
        window.open(`tel:${phone}`, '_blank');
    }
}

// Share food post function
function shareFoodPost(title, location) {
    const text = `Check out this food donation available on FoodConnect: ${title} at ${location}. Help reduce food waste!`;
    
    if (navigator.share) {
        navigator.share({
            title: 'FoodConnect - Available Food',
            text: text,
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
            showNotification('📋 Food details copied to clipboard!');
        });
    }
}

// Update live metrics
function updateLiveMetrics() {
    // Calculate metrics from food posts
    const totalMeals = foodPosts.reduce((sum, post) => {
        const quantity = parseInt(post.quantity) || 0;
        let multiplier = 1;
        
        switch (post.quantityUnit) {
            case 'servings':
            case 'plates':
                multiplier = 1;
                break;
            case 'kg':
                multiplier = 4; // Estimate 4 servings per kg
                break;
            case 'boxes':
            case 'packets':
                multiplier = 8; // Estimate 8 servings per box/packet
                break;
        }
        
        return sum + (quantity * multiplier);
    }, 0);
    
    const totalDonors = new Set(foodPosts.map(post => post.donorPhone)).size;
    const totalWeight = foodPosts.reduce((sum, post) => {
        const quantity = parseInt(post.quantity) || 0;
        let weight = 0;
        
        switch (post.quantityUnit) {
            case 'kg':
                weight = quantity;
                break;
            case 'servings':
            case 'plates':
                weight = quantity * 0.25; // Estimate 0.25kg per serving
                break;
            case 'boxes':
            case 'packets':
                weight = quantity * 2; // Estimate 2kg per box
                break;
        }
        
        return sum + weight;
    }, 0);
    
    // Update DOM elements with animation
    animateCounter('totalMeals', totalMeals);
    document.getElementById('totalNGOs').textContent = realNGOs.length;
    animateCounter('totalDonors', totalDonors);
    animateCounter('totalWeight', Math.round(totalWeight));
}

// Animate counter
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
    const duration = 1000; // 1 second
    const steps = 60;
    const stepValue = (targetValue - currentValue) / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
        currentStep++;
        const value = Math.round(currentValue + (stepValue * currentStep));
        element.textContent = value.toLocaleString();
        
        if (currentStep >= steps) {
            element.textContent = targetValue.toLocaleString();
            clearInterval(timer);
        }
    }, duration / steps);
}

// Update mini stats in listings
function updateMiniStats() {
    const activeListings = foodPosts.length;
    const expiringSoon = foodPosts.filter(post => {
        const expiry = new Date(post.expiryTime);
        const now = new Date();
        const hoursUntilExpiry = (expiry - now) / (1000 * 60 * 60);
        return hoursUntilExpiry > 0 && hoursUntilExpiry < 24;
    }).length;
    
    document.getElementById('activeListings').textContent = activeListings;
    document.getElementById('expiringSoon').textContent = expiringSoon;
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

// Open NGO registration form
function openNGOForm() {
    showNotification('📧 Please contact us at moinraza313786@gmail.com to register your NGO.', 'info');
}

// Initialize demo data (for testing)
function initializeDemoData() {
    const demoPosts = [
        {
            title: "Fresh Pizza Margherita",
            description: "8 large pizzas from office event, completely untouched and freshly made. Vegetarian options available.",
            quantity: "8",
            quantityUnit: "pizzas",
            expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            location: "Downtown Office Tower",
            donorName: "TechCorp Inc",
            donorPhone: "+1 (555) 123-4567",
            donorEmail: "events@techcorp.com",
            timestamp: new Date().toISOString(),
            status: "available"
        },
        {
            title: "Assorted Sandwiches & Salads",
            description: "Fresh sandwiches, wraps, and garden salads from cancelled corporate meeting. All items are freshly prepared today.",
            quantity: "25",
            quantityUnit: "servings",
            expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
            location: "City Convention Center",
            donorName: "Sarah Johnson",
            donorPhone: "+1 (555) 987-6543",
            timestamp: new Date().toISOString(),
            status: "available"
        }
    ];
    
    // Only add demo data if no posts exist
    if (foodPosts.length === 0) {
        foodPosts = [...demoPosts, ...foodPosts];
        displayFoodListings(foodPosts);
        updateLiveMetrics();
    }
}

// Export data function (for analytics)
function exportData() {
    const data = {
        foodPosts: foodPosts,
        metrics: {
            totalMeals: document.getElementById('totalMeals').textContent,
            totalDonors: document.getElementById('totalDonors').textContent,
            totalWeight: document.getElementById('totalWeight').textContent,
            activeListings: document.getElementById('activeListings').textContent
        },
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `foodconnect-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Make functions globally available
window.showSection = showSection;
window.submitFoodForm = submitFoodForm;
window.filterFoodListings = filterFoodListings;
window.sortFoodListings = sortFoodListings;
window.contactNGO = contactNGO;
window.visitWebsite = visitWebsite;
window.contactDonor = contactDonor;
window.shareFoodPost = shareFoodPost;
window.openNGOForm = openNGOForm;
window.loadFoodPostsFromFirebase = loadFoodPostsFromFirebase;

// Add CSS for new elements
const additionalStyles = `
    .food-card-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
        flex-wrap: wrap;
    }
    
    .btn-sm {
        padding: 8px 16px;
        font-size: 0.85rem;
    }
    
    .ngo-areas {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 20px;
        justify-content: center;
    }
    
    .area-tag {
        background: var(--primary-light);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .expiry-timer.warning {
        background: var(--warning-color);
    }
    
    .notification.info {
        background: var(--secondary-color);
    }
    
    @media (max-width: 480px) {
        .food-card-actions {
            flex-direction: column;
        }
        
        .btn-sm {
            width: 100%;
            justify-content: center;
        }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

console.log('🎉 FoodConnect script loaded successfully!');