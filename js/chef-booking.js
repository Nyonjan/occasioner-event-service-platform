let currentStep = 1;
const totalSteps = 4;
let isSubmitting = false;

document.addEventListener("DOMContentLoaded", () => {
    // Multi-step form setup Elements
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const submitBtn = document.getElementById("submitBtn");
    const progressBar = document.getElementById("progressBar");
    const chefBookingForm = document.getElementById("chefBookingForm");

    // Dynamic UI Elements
    const addCuisineSelect = document.getElementById("addCuisineSelect");
    const cuisineSelectionBox = document.querySelector(".cuisine-selection-box");
    const cuisineTypeInput = document.getElementById("cuisineType");

    // Modals
    const confirmModal = document.getElementById("confirmModal");
    const finalConfirmBtn = document.getElementById("finalConfirmBtn");
    const finalBackBtn = document.getElementById("finalBackBtn");

    // User Address logic elements
    const useRegisteredAddressContainer = document.getElementById("useRegisteredAddressContainer");
    const useRegisteredAddressCheckbox = document.getElementById("useRegisteredAddress");
    const specificLocationInput = document.getElementById("specificLocation");

    // User data references
    const chefCountInput = document.getElementById("chefCount");
    const guestCountInput = document.getElementById("guestCount");

    // Food selection elements
    const foodItemsTypeRadios = document.querySelectorAll('input[name="foodItemsType"]');
    const specificCuisineContainer = document.getElementById("specificCuisineContainer");
    const customItemContainer = document.getElementById("customItemContainer");
    const customItemInput = document.getElementById("customItemInput");
    const addCustomItemBtn = document.getElementById("addCustomItemBtn");
    const customSuggestions = document.getElementById("customSuggestions");

    // Price Summary Elements
    const summaryGuestCount = document.getElementById("summaryGuestCount");
    const summaryChefFee = document.getElementById("summaryChefFee");
    const summaryFoodCost = document.getElementById("summaryFoodCost");
    const summaryGroceryCost = document.getElementById("summaryGroceryCost");
    const summaryGrandTotal = document.getElementById("summaryGrandTotal");

    // Date/Time elements
    const eventDateInput = document.getElementById("eventDate");
    const eventTimeInput = document.getElementById("eventTime");

    let userAddress = "";

    // Init Progress bar
    updateProgressBar();

    // ----------------------------------------
    // Step Navigation logic
    // ----------------------------------------
    prevBtn.addEventListener("click", () => {
        if (currentStep > 1) {
            document.getElementById(`step-${currentStep}`).classList.remove("active");
            currentStep--;
            document.getElementById(`step-${currentStep}`).classList.add("active");
            updateNavButtons();
            updateProgressBar();
        }
    });

    nextBtn.addEventListener("click", () => {
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                document.getElementById(`step-${currentStep}`).classList.remove("active");
                currentStep++;
                const nextStepEl = document.getElementById(`step-${currentStep}`);
                nextStepEl.classList.add("active");

                // Fix for Google Maps rendering in hidden containers:
                // When Step 2 (containing the map) is shown, ensure it centers correctly
                if (currentStep === 2 && window.bookingMap && window.bookingMarker) {
                    const center = window.bookingMarker.getPosition();
                    google.maps.event.trigger(window.bookingMap, 'resize');
                    window.bookingMap.setCenter(center);
                }

                updateNavButtons();
                updateProgressBar();
            }
        }
    });

    function updateNavButtons() {
        if (currentStep === 1) {
            prevBtn.disabled = true;
        } else {
            prevBtn.disabled = false;
        }

        if (currentStep === totalSteps) {
            nextBtn.style.display = "none";
            submitBtn.style.display = "flex";
        } else {
            nextBtn.style.display = "flex";
            submitBtn.style.display = "none";
        }
    }

    function updateProgressBar() {
        const percentage = (currentStep / totalSteps) * 100;
        progressBar.style.width = percentage + "%";
    }

    function validateStep(step) {
        // Simple HTML5 validation check for the inputs in current step
        const stepElement = document.getElementById(`step-${step}`);
        const inputs = stepElement.querySelectorAll('input[required], select[required], textarea[required]');

        let isValid = true;
        inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.reportValidity();
                isValid = false;
            }
        });
        return isValid;
    }

    // ----------------------------------------
    // Food items / Cuisine chip logic
    // ----------------------------------------
    // Read initial chips (if any)
    let selectedCuisines = cuisineTypeInput.value.split(',').map(s => s.trim()).filter(s => s);

    function triggerRenderChips() {
        if (!cuisineSelectionBox) return;
        cuisineSelectionBox.innerHTML = '';
        selectedCuisines.forEach(cuisine => {
            const chip = document.createElement("div");
            chip.className = "cuisine-chip";
            chip.innerHTML = `${cuisine} <span class="close-chip" data-val="${cuisine}">&times;</span>`;
            cuisineSelectionBox.appendChild(chip);
        });
        cuisineTypeInput.value = selectedCuisines.join(", ");

        // Update price whenever chips change
        if (typeof calculateTotal === 'function') calculateTotal();

        // Rebind close events
        cuisineSelectionBox.querySelectorAll(".close-chip").forEach(close => {
            close.addEventListener("click", function () {
                const val = this.getAttribute("data-val");
                selectedCuisines = selectedCuisines.filter(c => c !== val);
                triggerRenderChips();
            });
        });
    }

    // ----------------------------------------
    // Dynamic Pricing Logic
    // ----------------------------------------
    const PRICES = {
        chef: 2000,
        meal: {
            breakfast: 150,
            lunch: 300,
            dinner: 400
        },
        cuisine: {
            "Italian": 300,
            "Chinese": 250,
            "Indian": 200,
            "Newari": 350,
            "Thakali": 400,
            "custom": 250 // Generic price for custom items
        },
        groceries: 500
    };

    function calculateTotal() {
        if (!summaryGrandTotal) return;

        const guests = parseInt(guestCountInput.value) || 0;
        const chefs = parseInt(chefCountInput.value) || 1;

        // 1. Chef Service
        const chefFee = chefs * PRICES.chef;

        // 2. Meal Base Price
        const selectedMeal = document.querySelector('input[name="mealType"]:checked');
        const mealPricePerGuest = selectedMeal ? PRICES.meal[selectedMeal.value] : 0;
        let foodCost = guests * mealPricePerGuest;

        // 3. Cuisine/Chips Price
        selectedCuisines.forEach(item => {
            let pricePerGuest = PRICES.cuisine.custom; // Default
            for (let [name, price] of Object.entries(PRICES.cuisine)) {
                if (item.includes(name)) {
                    pricePerGuest = price;
                    break;
                }
            }
            foodCost += (guests * pricePerGuest);
        });

        // 4. Groceries
        const groceriesIncluded = document.querySelector('input[name="groceries"]:checked')?.value === 'include';
        const groceryCost = groceriesIncluded ? (guests * PRICES.groceries) : 0;

        const grandTotal = chefFee + foodCost + groceryCost;

        // Update UI
        if (summaryGuestCount) summaryGuestCount.textContent = guests;
        if (summaryChefFee) summaryChefFee.textContent = `Rs. ${chefFee.toLocaleString()}`;
        if (summaryFoodCost) summaryFoodCost.textContent = `Rs. ${foodCost.toLocaleString()}`;
        if (summaryGroceryCost) summaryGroceryCost.textContent = `Rs. ${groceryCost.toLocaleString()}`;
        if (summaryGrandTotal) summaryGrandTotal.textContent = `Rs. ${grandTotal.toLocaleString()}`;
    }

    // ----------------------------------------
    // Registered Address Logic
    // ----------------------------------------
    function initUserAddressOption() {
        if (!useRegisteredAddressContainer) return;
        checkLoginSession().then(data => {
            if (data.logged_in && data.user) {
                if (data.user.address) {
                    userAddress = data.user.address;
                    useRegisteredAddressContainer.style.display = "block";
                }
                
                // Pre-fill name/phone from session
                const customerNameInput = document.getElementById("customerName");
                const phoneNumberInput = document.getElementById("phoneNumber");
                if (customerNameInput && data.user.name) customerNameInput.value = data.user.name;
                if (phoneNumberInput && data.user.phone_number) phoneNumberInput.value = data.user.phone_number;
            }
        });
    }

    // ----------------------------------------
    // All Listeners and Initializations
    // ----------------------------------------

    // Date/Time Lead Time Restrictions
    setupDateTimeRestrictions();

    // Init address logic
    initUserAddressOption();

    // Initial chips render
    triggerRenderChips();

    // Bind price updates to all inputs
    [guestCountInput, chefCountInput].forEach(el => {
        if (el) el.addEventListener("input", calculateTotal);
    });

    document.querySelectorAll('input[name="mealType"], input[name="groceries"], input[name="foodItemsType"]').forEach(radio => {
        radio.addEventListener("change", calculateTotal);
    });

    if (addCuisineSelect) {
        addCuisineSelect.addEventListener("change", function () {
            const val = this.value;
            if (val && !selectedCuisines.includes(val)) {
                const mealRadio = document.querySelector('input[name="mealType"]:checked');
                let mealAddon = mealRadio ? `(${mealRadio.value.charAt(0).toUpperCase() + mealRadio.value.slice(1)})` : '';
                selectedCuisines.push(val + mealAddon);
                triggerRenderChips();
            }
            this.value = "";
        });
    }

    // ----------------------------------------
    // Helper Functions
    // ----------------------------------------

    function checkLoginSession() {
        return fetch("../php/check_session.php", {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
            },
        })
            .then(res => res.json())
            .catch(() => ({ logged_in: false }));
    }

    useRegisteredAddressCheckbox.addEventListener("change", function () {
        if (this.checked && userAddress) {
            specificLocationInput.value = userAddress;
            // Update map marker
            if (window.google && window.google.maps) {
                geocodeAddress(userAddress);
            }
        } else {
            specificLocationInput.value = "";
        }
    });

    function geocodeAddress(address) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === "OK" && results[0]) {
                const pos = results[0].geometry.location;
                if (window.bookingMap && window.bookingMarker) {
                    window.bookingMap.setCenter(pos);
                    window.bookingMap.setZoom(17);
                    window.bookingMarker.setPosition(pos);

                    // Update locationArea hidden input
                    const locationAreaInput = document.querySelector('input[name="locationArea"]');
                    let area = "Unknown Area";
                    if (results[0].address_components) {
                        for (let comp of results[0].address_components) {
                            if (comp.types.includes("locality") || comp.types.includes("sublocality")) {
                                area = comp.long_name;
                                break;
                            }
                        }
                    }
                    if (locationAreaInput) locationAreaInput.value = area;
                }
            }
        });
    }

    // ----------------------------------------
    // Chef Recommendation Logic
    // ----------------------------------------
    function updateChefRecommendation() {
        const guests = parseInt(guestCountInput.value) || 0;
        let recommendedChefs = 1;

        if (guests > 50) {
            recommendedChefs = Math.ceil(guests / 15);
        } else if (guests > 30) {
            recommendedChefs = 3;
        } else if (guests > 15) {
            recommendedChefs = 2;
        } else if (guests > 0) {
            recommendedChefs = 1;
        }

        chefCountInput.min = recommendedChefs;
        if (parseInt(chefCountInput.value) < recommendedChefs) {
            chefCountInput.value = recommendedChefs;
        }
    }

    guestCountInput.addEventListener("input", updateChefRecommendation);
    guestCountInput.addEventListener("blur", updateChefRecommendation);

    // Strict enforcement for chef count input
    chefCountInput.addEventListener("change", function () {
        const min = parseInt(this.min) || 1;
        if (parseInt(this.value) < min) {
            this.value = min;
            alert(`Minimum ${min} chefs required for your guest count.`);
        }
    });

    // ----------------------------------------
    // Food Items Selection (Specific vs Custom)
    // ----------------------------------------
    foodItemsTypeRadios.forEach(radio => {
        radio.addEventListener("change", function () {
            if (this.value === "specific") {
                specificCuisineContainer.style.display = "block";
                customItemContainer.style.display = "none";
            } else {
                specificCuisineContainer.style.display = "none";
                customItemContainer.style.display = "block";
            }
        });
    });

    if (addCustomItemBtn) {
        addCustomItemBtn.addEventListener("click", function () {
            const val = customItemInput.value.trim();
            if (val && !selectedCuisines.includes(val)) {
                selectedCuisines.push(val);
                triggerRenderChips();
                customItemInput.value = "";
                if (typeof calculateTotal === 'function') calculateTotal();
            }
        });
        // Allow 'Enter' key to add item
        customItemInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                addCustomItemBtn.click();
            }
        });

        // Suggestion Chips Click
        if (customSuggestions) {
            customSuggestions.querySelectorAll(".suggestion-chip").forEach(chip => {
                chip.addEventListener("click", function () {
                    const val = this.getAttribute("data-val");
                    if (val && !selectedCuisines.includes(val)) {
                        selectedCuisines.push(val);
                        triggerRenderChips();
                        if (typeof calculateTotal === 'function') calculateTotal();
                    }
                });
            });
        }
    }

    // Allergy Toggle logic
    const hasAllergyRadios = document.querySelectorAll('input[name="hasAllergy"]');
    const allergyInputContainer = document.getElementById("allergyInputContainer");
    const allergyDetailsInput = document.getElementById("allergies");

    hasAllergyRadios.forEach(radio => {
        radio.addEventListener("change", function () {
            if (this.value === "yes") {
                if (allergyInputContainer) allergyInputContainer.style.display = "block";
                if (allergyDetailsInput) allergyDetailsInput.required = true;
            } else {
                if (allergyInputContainer) allergyInputContainer.style.display = "none";
                if (allergyDetailsInput) {
                    allergyDetailsInput.required = false;
                    allergyDetailsInput.value = "";
                }
            }
        });
    });

    // Run initial calculation
    calculateTotal();

    // ----------------------------------------
    // Date/Time Lead Time Restrictions
    // ----------------------------------------
    function setupDateTimeRestrictions() {
        if (!eventDateInput || !eventTimeInput) return;

        function updateMinTime() {
            const now = new Date();
            const minDT = new Date(now.getTime() + (12 * 60 * 60 * 1000));

            const minDateStr = formatDate(minDT);
            const minTimeStr = formatTime(minDT);

            eventDateInput.min = minDateStr;

            if (eventDateInput.value === minDateStr) {
                eventTimeInput.min = minTimeStr;
            } else {
                eventTimeInput.min = "";
            }
        }

        function formatDate(d) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        function formatTime(d) {
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }

        eventDateInput.addEventListener("change", updateMinTime);

        // Initial setup
        updateMinTime();

        // Periodically refresh (in case user leaves page open for hours)
        setInterval(updateMinTime, 60000); // Check every minute
    }

    setupDateTimeRestrictions();


    function populateSummary() {
        const confirmSummary = document.getElementById("confirmSummary");
        if (!confirmSummary) return;

        const guests = guestCountInput.value || 0;
        const chefs = chefCountInput.value || 1;
        const date = eventDateInput.value || "Not set";
        const time = eventTimeInput.value || "Not set";

        const mealRadio = document.querySelector('input[name="mealType"]:checked');
        const meal = mealRadio ? mealRadio.value : "None";

        const groceryRadio = document.querySelector('input[name="groceries"]:checked');
        const groceries = groceryRadio ? groceryRadio.value : "Exclude";

        const allergyType = document.querySelector('input[name="hasAllergy"]:checked')?.value;
        const allergies = allergyType === "yes" ? (document.getElementById("allergies")?.value || "Yes (no details)") : "None";

        const items = selectedCuisines.length > 0 ? selectedCuisines.join(", ") : "None";
        const total = summaryGrandTotal ? summaryGrandTotal.textContent : "Rs. 0";

        confirmSummary.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">👤 Guests</span>
                <span class="summary-value">${guests} People</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">👨‍🍳 Chefs Required</span>
                <span class="summary-value">${chefs} Professional(s)</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">📅 Date & Time</span>
                <span class="summary-value">${date} at ${time}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">🍽️ Selected Meal</span>
                <span class="summary-value">${meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">🍲 Menu Items</span>
                <span class="summary-value">${items}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">🛒 Groceries</span>
                <span class="summary-value">${groceries.charAt(0).toUpperCase() + groceries.slice(1)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">⚠️ Allergies</span>
                <span class="summary-value">${allergies}</span>
            </div>
            <div class="summary-total">
                <span class="label">Payable Total</span>
                <span class="amount">${total}</span>
            </div>
        `;
    }

    submitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (validateStep(currentStep)) {
            populateSummary();
            confirmModal.style.display = "flex";
        }
    });

    finalBackBtn.addEventListener("click", () => {
        confirmModal.style.display = "none";
    });

    finalConfirmBtn.addEventListener("click", () => {
        confirmModal.style.display = "none";
        handleFinalHire();
    });

    function handleFinalHire() {
        if (isSubmitting) return;

        checkLoginStatus().then(isLoggedIn => {
            if (!isLoggedIn) {
                // Show login modal
                document.getElementById("authModal").style.display = "flex";
                document.getElementById("loginForm").style.display = "block";
                document.getElementById("signupForm").style.display = "none";
                alert("Please login to complete your booking.");
            } else {
                processBooking();
            }
        }).catch(err => {
            console.error("Auth check failed:", err);
            alert("Error checking login status. Please login.");
            document.getElementById("authModal").style.display = "flex";
        });
    }

    function checkLoginStatus() {
        return fetch("../php/check_session.php", {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
            },
        })
            .then(res => res.json())
            .then(data => data.logged_in === true)
            .catch(() => false);
    }

    function processBooking() {
        if (isSubmitting) return;
        isSubmitting = true;

        finalConfirmBtn.textContent = "Processing...";
        finalConfirmBtn.disabled = true;

        const formData = new FormData(chefBookingForm);

        // Use the real calculated price from the pricing summary
        const totalRaw = summaryGrandTotal ? summaryGrandTotal.textContent : "0";
        const totalPrice = parseFloat(totalRaw.replace(/[^\d.]/g, '')) || 0;
        formData.append("totalPrice", totalPrice);

        // Map customer name and phone from current inputs/hidden fields
        const cName = document.getElementById("customerName")?.value || "";
        const cPhone = document.getElementById("phoneNumber")?.value || "";
        if (cName) formData.set("customerName", cName);
        if (cPhone) formData.set("phoneNumber", cPhone);

        fetch("../php/create_chef_booking.php", {
            method: "POST",
            body: formData,
            credentials: "same-origin",
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`Chef booking confirmed!\nWe will contact you within 24 hours to confirm details.`);
                    window.location.href = "home.html";
                } else {
                    alert("Booking failed: " + data.message);
                    isSubmitting = false;
                    finalConfirmBtn.textContent = "Confirm";
                    finalConfirmBtn.disabled = false;
                }
            })
            .catch(error => {
                console.error("Booking error:", error);
                alert("An error occurred while processing your booking. Please try again.");
                isSubmitting = false;
                finalConfirmBtn.textContent = "Confirm";
                finalConfirmBtn.disabled = false;
            });
    }


    // ----------------------------------------
    // Auth Modal Handlers
    // ----------------------------------------
    const authClose = document.getElementById("authClose");
    if (authClose) {
        authClose.addEventListener("click", () => {
            document.getElementById("authModal").style.display = "none";
        });
    }

    const showSignupBtn = document.getElementById("showSignup");
    if (showSignupBtn) {
        showSignupBtn.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("loginForm").style.display = "none";
            document.getElementById("signupForm").style.display = "block";
        });
    }

    const showLoginBtn = document.getElementById("showLogin");
    if (showLoginBtn) {
        showLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("signupForm").style.display = "none";
            document.getElementById("loginForm").style.display = "block";
        });
    }

    const loginFormElement = document.getElementById("loginFormElement");
    if (loginFormElement) {
        loginFormElement.addEventListener("submit", function (e) {
            e.preventDefault();
            const formData = new FormData(this);
            fetch("../php/login.php", {
                method: "POST",
                body: formData,
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        document.getElementById("authModal").style.display = "none";
                        processBooking();
                    } else {
                        alert(data.message);
                    }
                });
        });
    }

    const signupFormElement = document.getElementById("signupFormElement");
    if (signupFormElement) {
        signupFormElement.addEventListener("submit", function (e) {
            e.preventDefault();
            const formData = new FormData(this);
            fetch("../php/signup.php", {
                method: "POST",
                body: formData,
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        document.getElementById("signupForm").style.display = "none";
                        document.getElementById("loginForm").style.display = "block";
                        alert("Registration successful, please login.");
                    } else {
                        alert(data.message);
                    }
                });
        });
    }

    // Listen for login event to update address options
    document.addEventListener('userLoaded', (e) => {
        initUserAddressOption();
    });

});

// Google Maps Initialization Callback
window.initMap = function () {
    const mapElement = document.getElementById("map");
    const inputElement = document.getElementById("specificLocation");
    const locationAreaInput = document.querySelector('input[name="locationArea"]');

    if (!mapElement || !inputElement) return;

    // Default to Kathmandu
    const defaultCenter = { lat: 27.7172, lng: 85.3240 };

    const map = new google.maps.Map(mapElement, {
        center: defaultCenter,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
    });

    // Make map and marker available globally for geocoding
    window.bookingMap = map;

    const marker = new google.maps.Marker({
        map: map,
        position: defaultCenter,
        draggable: true
    });

    window.bookingMarker = marker;

    const autocomplete = new google.maps.places.Autocomplete(inputElement);
    autocomplete.bindTo("bounds", map);

    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
            return;
        }

        map.setCenter(place.geometry.location);
        map.setZoom(15);
        marker.setPosition(place.geometry.location);

        // Try to extract city/area from address components if available
        let area = "Unknown Area";
        if (place.address_components) {
            for (let comp of place.address_components) {
                if (comp.types.includes("locality") || comp.types.includes("sublocality")) {
                    area = comp.long_name;
                    break;
                }
            }
        }

        if (locationAreaInput) locationAreaInput.value = area;
    });

    // Update input text if marker dragged
    marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        map.panTo(pos);

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: pos }, (results, status) => {
            if (status === "OK" && results[0]) {
                inputElement.value = results[0].formatted_address;

                let area = "Unknown Area";
                for (let comp of results[0].address_components) {
                    if (comp.types.includes("locality") || comp.types.includes("sublocality")) {
                        area = comp.long_name;
                        break;
                    }
                }
                if (locationAreaInput) locationAreaInput.value = area;
            }
        });
    });

    // Allow users to click the map to select a location
    map.addListener("click", (event) => {
        const pos = event.latLng;
        marker.setPosition(pos);
        map.panTo(pos);

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: pos }, (results, status) => {
            if (status === "OK" && results[0]) {
                inputElement.value = results[0].formatted_address;

                let area = "Unknown Area";
                for (let comp of results[0].address_components) {
                    if (comp.types.includes("locality") || comp.types.includes("sublocality")) {
                        area = comp.long_name;
                        break;
                    }
                }
                if (locationAreaInput) locationAreaInput.value = area;
            }
        });
    });
}
