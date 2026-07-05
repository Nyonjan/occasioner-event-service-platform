document.addEventListener('DOMContentLoaded', function () {
    const bookingsList = document.getElementById('bookingsList');
    const emptyState = document.getElementById('emptyState');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const detailsModal = document.getElementById('detailsModal');
    const detailsClose = document.getElementById('detailsClose');
    const eventSummaryContent = document.getElementById('eventSummaryContent');
    const workerProfileContent = document.getElementById('workerProfileContent');
    const workerProfileSection = document.getElementById('workerProfileSection');

    let allBookings = [];
    let currentFilter = 'all';

    // Dummy Chef Profiles for Hackathon Demo
    const chefProfiles = [
        {
            id: 0,
            name: "Chef Arjun Magar",
            image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop",
            specialty: "Nepali & Indian",
            experience: "14 Years Experience",
            bio: "Master of authentic Newari and North Indian cuisines with 12+ years of experience in 5-star hotels.",
            rating: 4.9,
            skills: ["Advanced Tandoor", "Newari Cuisine Master", "Kitchen Management", "Menu Engineering"],
            fullCv: "Chef Arjun started his journey at the Annapurna Hotel before moving to prestigious kitchens in Dubai. He specializes in slow-cooked meats and traditional spices. Certified in Food Safety (Level 3) and Culinary Arts from Global Academy.",
            reviews: [
                { user: "Suman Adhikari", text: "Hajur ko Mutton Curry ekdam mitho thiyo! Truly authentic taste.", date: "Feb 2024" },
                { user: "Riya Phuyal", text: "Arjun was very professional. 50 guest ko party ramrari handle gardinu bhayo.", date: "Jan 2024" },
                { user: "Dinesh Magar", text: "Kitchen ekdam saaf rakhnu bhayo. Khana ko quality bishal thiyo.", date: "Dec 2023" }
            ]
        },
        {
            id: 1,
            name: "Chef Li Wei",
            image: "https://images.unsplash.com/photo-1583394838336-acd977730f90?w=400&h=400&fit=crop",
            specialty: "Chinese",
            experience: "10 Years Experience",
            bio: "Specializing in Cantonese and Szechuan styles. Brings the authentic flavors of Beijing to your kitchen.",
            rating: 4.8,
            skills: ["Wok Mastery", "Dim Sum Crafting", "Szechuan Spices", "Seafood Specialization"],
            fullCv: "Trained in the bustling kitchens of Guangzhou, Chef Li Wei brings high-heat wok techniques and delicate dumpling artistry. He has served as Head Chef at 'The Orient' for 5 years. Renowned for his precision and flavor balance.",
            reviews: [
                { user: "Binod Thapa", text: "Hajur ko Dim Sum ta number 1 ho. Our guests were really amazed.", date: "Mar 2024" },
                { user: "Anjali Shrestha", text: "Quick service and great taste. Authentic Chinese flavors in Nepal.", date: "Feb 2024" }
            ]
        },
        {
            id: 2,
            name: "Chef Maria Rossi",
            image: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=400&h=400&fit=crop",
            specialty: "Italian",
            experience: "12 Years Experience",
            bio: "Trained in Naples, Maria excels at hand-tossed pizzas and artisanal pasta dishes.",
            rating: 5.0,
            skills: ["Handmade Pasta", "Wood-fired Pizza", "Mediterranean Sauces", "Pastry & Desserts"],
            fullCv: "Chef Maria grew up in a family-run trattoria in Naples. After moving to Nepal, she has been a consultant for top Italian restaurants. She is a master of fermentation and fresh ingredients. Winner of the 2022 Continental Excellence Award.",
            reviews: [
                { user: "Elena Gurung", text: "Tiramisu ta Nepal mai sabse ramro hola. Highly recommend Chef Maria.", date: "Mar 2024" },
                { user: "Bibek Pandey", text: "Perfect Al Dente pasta. Anniversary celebrate garna ekdam sahi bhayo.", date: "Jan 2024" }
            ]
        }
    ];

    // Check if user is logged in
    document.addEventListener('userLoaded', function (e) {
        fetchBookings();
    });

    if (window.currentUser) {
        fetchBookings();
    }

    function fetchBookings() {
        fetch('../php/get_user_bookings.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    allBookings = data.bookings;
                    renderBookings();
                } else {
                    console.error('Failed to fetch bookings:', data.message);
                    bookingsList.innerHTML = `<p class="error-msg">Error: ${data.message}</p>`;
                }
            })
            .catch(error => {
                console.error('Error fetching bookings:', error);
                bookingsList.innerHTML = `<p class="error-msg">An unexpected error occurred while fetching your bookings.</p>`;
            });
    }

    function renderBookings() {
        const filtered = allBookings.filter(b => {
            if (currentFilter === 'all') return true;
            return b.booking_type_display.toLowerCase() === currentFilter;
        });

        bookingsList.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        filtered.forEach(booking => {
            const card = createBookingCard(booking);
            bookingsList.appendChild(card);
        });
    }

    function createBookingCard(booking) {
        const card = document.createElement('div');
        card.className = 'booking-card';

        const typeLabel = booking.booking_type_display === 'package' ? 'PACKAGE HIRE' : booking.booking_type_display.toUpperCase();
        const statusClass = `badge-${booking.status.toLowerCase()}`;
        const formattedDate = formatDate(booking.event_date);
        const formattedTotal = formatCurrency(booking.total_price);
        const addedDate = new Date(booking.created_at).toLocaleDateString();

        card.innerHTML = `
            <div class="booking-card-header">
                <span class="booking-badge ${statusClass}">${booking.status.replace('_', ' ')}</span>
                <span class="booking-type-label">${typeLabel}</span>
                <h3 class="booking-title">${booking.title || 'Service Booking'}</h3>
                ${booking.subtitle ? `<div class="booking-subtitle">${booking.subtitle}</div>` : ''}
            </div>
            <div class="booking-card-body">
                <div class="booking-info-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span><strong>Date:</strong> ${formattedDate}</span>
                </div>
                <div class="booking-info-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span><strong>Time:</strong> ${booking.event_time}</span>
                </div>
                <div class="booking-info-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span><strong>Location:</strong> ${booking.location}</span>
                </div>
                
                <button class="details-btn" onclick="showBookingDetails(${booking.id}, '${booking.booking_type_display}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    View Details
                </button>
            </div>
            <div class="booking-card-footer">
                <div class="booking-price">${formattedTotal}</div>
                <div class="booking-date-added">ID: #${booking.id} • ${addedDate}</div>
            </div>
        `;

        return card;
    }

    // Modal Global Access
    window.showBookingDetails = function (bookingId, type) {
        const booking = allBookings.find(b => b.id == bookingId && b.booking_type_display === type);
        if (!booking) return;

        // 1. Render Event Summary
        let detailsHtml = `
            <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value">${booking.status.toUpperCase()}</span></div>
            <div class="detail-item"><span class="detail-label">Date</span><span class="detail-value">${formatDate(booking.event_date)}</span></div>
            <div class="detail-item"><span class="detail-label">Time</span><span class="detail-value">${booking.event_time}</span></div>
            <div class="detail-item"><span class="detail-label">Total Amount</span><span class="detail-value">${formatCurrency(booking.total_price)}</span></div>
        `;

        // Parse JSON details if they exist
        if (booking.booking_details) {
            try {
                const data = typeof booking.booking_details === 'string' ? JSON.parse(booking.booking_details) : booking.booking_details;

                // Common fields
                if (data.guestCount) detailsHtml += `<div class="detail-item"><span class="detail-label">Guests</span><span class="detail-value">${data.guestCount}</span></div>`;
                if (data.mealType) detailsHtml += `<div class="detail-item"><span class="detail-label">Meal Type</span><span class="detail-value">${data.mealType}</span></div>`;
                if (data.foodPreference) detailsHtml += `<div class="detail-item"><span class="detail-label">Preference</span><span class="detail-value">${data.foodPreference}</span></div>`;

                // Cuisines (Service-specific)
                if (data.cuisines || data.cuisineType) {
                    const cui = data.cuisines || data.cuisineType;
                    const cuiStr = Array.isArray(cui) ? cui.join(", ") : cui;
                    detailsHtml += `<div class="detail-item"><span class="detail-label">Cuisines</span><span class="detail-value">${cuiStr}</span></div>`;
                }

                // Staff Info (Package-specific or general)
                if (data.staffInfo) {
                    const staff = typeof data.staffInfo === 'object' ? (data.staffInfo.details || JSON.stringify(data.staffInfo)) : data.staffInfo;
                    detailsHtml += `<div class="detail-item"><span class="detail-label">Staff</span><span class="detail-value">${staff}</span></div>`;
                }

                // Additional Services (Package-specific)
                if (data.additionalServices && Object.keys(data.additionalServices).length > 0) {
                    const services = Object.keys(data.additionalServices).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(", ");
                    detailsHtml += `<div class="detail-item"><span class="detail-label">Extras</span><span class="detail-value">${services}</span></div>`;
                }

                if (data.allergies) detailsHtml += `<div class="detail-item"><span class="detail-label">Allergies</span><span class="detail-value">${data.allergies}</span></div>`;
                if (data.chefsRequired) detailsHtml += `<div class="detail-item"><span class="detail-label">Staff Count</span><span class="detail-value">${data.chefsRequired} Professionals</span></div>`;

            } catch (e) {
                console.error("JSON parse error", e);
            }
        }

        eventSummaryContent.innerHTML = detailsHtml;

        // 2. Render Matching Worker Profile (If Chef)
        if (booking.title.toLowerCase().includes('chef') || booking.category?.toLowerCase() === 'chef') {
            workerProfileSection.style.display = "block";

            // Logic: Match specialty based on booking cuisines
            let matchedChef = chefProfiles[0]; // Default
            if (booking.booking_details) {
                const data = JSON.parse(booking.booking_details);
                const cuisinesStr = (Array.isArray(data.cuisines) ? data.cuisines.join(" ") : (data.cuisines || "")).toLowerCase();

                if (cuisinesStr.includes("chinese")) matchedChef = chefProfiles[1];
                else if (cuisinesStr.includes("italian")) matchedChef = chefProfiles[2];
            }

            workerProfileContent.innerHTML = `
                <div class="chef-card">
                    <div class="clickable-profile" onclick="showChefFullProfile(${matchedChef.id})">
                        <div class="chef-header">
                            <img src="${matchedChef.image}" alt="${matchedChef.name}" class="chef-img">
                            <div class="chef-meta">
                                <h4>${matchedChef.name}</h4>
                                <span class="verified-badge">✓ Verified Partner</span>
                                <div class="rating-stars">★★★★★ ${matchedChef.rating}</div>
                                <div class="specialty-tag">${matchedChef.specialty} Specialty</div>
                            </div>
                        </div>
                        <div class="chef-bio">"${matchedChef.bio}"</div>
                        <div class="view-cv-hint">
                            <span>Click to view full CV & Reviews</span>
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                        </div>
                    </div>
                    
                    ${booking.status.toLowerCase() === 'confirmed' ? `
                        <div class="chef-card-actions">
                            <button class="change-worker-btn" onclick="requestChangeWorker(${booking.id}, '${booking.booking_type_display}')">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 2l4 4-4 4M3 22l4-4-4-4M7 18H21M21 6H7"></path></svg>
                                Not satisfied? Request another Chef
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            workerProfileSection.style.display = "none";
        }

        detailsModal.style.display = "block";
    };

    window.requestChangeWorker = function(bookingId, type) {
        if (confirm("Are you sure you want to request a different professional? Your booking status will return to 'Pending' while we search for a new match.")) {
            // Find the booking in allBookings to update UI state
            const booking = allBookings.find(b => b.id == bookingId && b.booking_type_display === type);
            if (booking) {
                booking.status = 'pending';
                renderBookings();
                detailsModal.style.display = "none";
                alert("Request Sent! Admin has been notified. We will assign a new professional shortly.");
            }
        }
    };

    window.showChefFullProfile = function (chefId) {
        const chef = chefProfiles.find(c => c.id === chefId);
        if (!chef) return;

        // Create a temporary overlay for the full profile
        const overlay = document.createElement('div');
        overlay.id = 'fullProfileOverlay';
        overlay.className = 'profile-overlay';
        overlay.innerHTML = `
            <div class="profile-card-detailed">
                <button class="back-btn" onclick="document.getElementById('fullProfileOverlay').remove()">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
                    Back to Booking
                </button>
                <div class="detailed-header">
                    <img src="${chef.image}" class="detailed-img">
                    <div class="detailed-meta">
                        <h2>${chef.name}</h2>
                        <div class="experience-tag">${chef.experience}</div>
                        <div class="stars big-stars">★★★★★ ${chef.rating}</div>
                    </div>
                </div>
                
                <div class="detailed-grid">
                    <div class="detailed-info">
                        <h3>Professional Background</h3>
                        <p class="cv-text">${chef.fullCv}</p>
                        
                        <h3>Core Specialties</h3>
                        <div class="skills-grid">
                            ${chef.skills.map(s => `<span class="skill-pill">${s}</span>`).join('')}
                        </div>
                        
                        <div class="verification-badges">
                            <div class="v-badge"><span class="v-icon">🛡️</span> Identity Verified</div>
                            <div class="v-badge"><span class="v-icon">🧪</span> Background Checked</div>
                            <div class="v-badge"><span class="v-icon">📋</span> Health Certified</div>
                        </div>
                    </div>
                    
                    <div class="detailed-reviews">
                        <h3>Client Testimonials</h3>
                        ${chef.reviews.map(r => `
                            <div class="full-review-item">
                                <div class="r-header">
                                    <span class="r-user">${r.user}</span>
                                    <span class="r-date">${r.date || 'Review'}</span>
                                </div>
                                <div class="r-stars">★★★★★</div>
                                <p class="r-text">"${r.text}"</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    };

    // Modal Close logic
    if (detailsClose) {
        detailsClose.addEventListener('click', () => detailsModal.style.display = "none");
    }

    window.addEventListener('click', (event) => {
        if (event.target == detailsModal) detailsModal.style.display = "none";
    });

    function formatDate(dateStr) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString(undefined, options);
    }

    function formatCurrency(amount) {
        return 'Rs. ' + parseFloat(amount).toLocaleString();
    }

    // Filter functionality
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderBookings();
        });
    });
});
