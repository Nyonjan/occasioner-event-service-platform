let selectedPackage = null
let formData = {}
const currentStep = 1
const totalSteps = 4
let isSubmitting = false
let userAddress = "";

// Get URL parameters to populate service details
function getUrlParameter(name) {
    name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]")
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
    var results = regex.exec(location.search)
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "))
}

// Initialize page with service details
function initializePage() {
    const service = getUrlParameter("service")
    const serviceData = {
        birthday: {
            title: "Birthday Party Planning",
            description:
                "Complete birthday party planning with decorations, entertainment, and catering services to make your special day memorable. Our experienced team handles everything from venue setup to cleanup, ensuring a stress-free celebration for you and your guests.",
            image: "../image/birthday.jpg",
        },
        wedding: {
            title: "Wedding Planning",
            description:
                "Full-service wedding planning from venue selection to day-of coordination. We handle every detail for your perfect day, including decoration, catering, photography, and entertainment coordination.",
            image: "https://i.imgur.com/RZMlGGB.jpg",
        },
        corporate: {
            title: "Corporate Events",
            description:
                "Professional corporate event management including conferences, team building, and company celebrations. We provide comprehensive planning and execution services for all your business events.",
            image: "https://i.imgur.com/x0S1xg3.jpg",
        },
    }

    if (service && serviceData[service]) {
        const title = serviceData[service].title
        document.getElementById("serviceTitle").textContent = title
        document.getElementById("serviceDescription").textContent = serviceData[service].description
        document.getElementById("serviceImage").src = serviceData[service].image

        // Set the hidden occasionName field for proper database storage
        const occasionInput = document.getElementById("occasionName")
        if (occasionInput) {
            occasionInput.value = title
        }
    }
}

// Select package function
function selectPackage(id, name, price, guestCount, staffInfo) {
    selectedPackage = { id, name, price, guestCount, staffInfo }

    // Reset form data when opening
    resetBookingForm()

    // Update modal content
    document.getElementById("selectedPackageName").textContent = name

    // Set hidden form fields
    document.getElementById("packageId").value = id
    document.getElementById("packageName").value = name
    document.getElementById("packagePrice").value = price
    document.getElementById("guestCount").value = guestCount
    document.getElementById("staffInfo").value = staffInfo

    // Hide services already included in package
    hideIncludedServices(id)

    // Show booking modal
    document.getElementById("bookingModal").style.display = "block"

    // Fix for Google Maps rendering in hidden containers:
    // Fix for Google Maps rendering in hidden containers:
    if (occMap && occMarker) {
        setTimeout(() => {
            google.maps.event.trigger(occMap, 'resize');
            occMap.setCenter(occMarker.getPosition());
        }, 300);
    }

    // Check for user registered address
    initUserAddressOption();
}

// Reset booking form
function resetBookingForm() {
    const form = document.getElementById("bookingForm")
    form.reset()

    // Uncheck all checkboxes
    const checkboxes = form.querySelectorAll('input[type="checkbox"]')
    checkboxes.forEach((checkbox) => (checkbox.checked = false))

    // Clear radio buttons
    const radios = form.querySelectorAll('input[type="radio"]')
    radios.forEach((radio) => (radio.checked = false))

    // Clear text inputs
    const textInputs = form.querySelectorAll(
        'input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="time"], textarea, select',
    )
    textInputs.forEach((input) => (input.value = ""))
}

// Function to hide services already included in the package
function hideIncludedServices(packageId) {
    // Reset all services to visible first
    const allServices = [
        "decoratorOption",
        "photographerOption",
        "entertainmentOption",
        "cleanupOption",
        "cateringOption",
        "helperOption",
    ]
    allServices.forEach((serviceId) => {
        const element = document.getElementById(serviceId)
        if (element) {
            element.style.display = "block"
        }
    })

    // Hide services based on package
    const servicesToHide = {
        1: ["helperOption"], // Package 1 includes 1 helper
        2: ["helperOption", "decoratorOption"], // Package 2 includes helpers and decorator
        3: ["helperOption", "decoratorOption", "photographerOption"], // Package 3 includes helpers, decorators, and photographer
    }

    if (servicesToHide[packageId]) {
        servicesToHide[packageId].forEach((serviceId) => {
            const element = document.getElementById(serviceId)
            if (element) {
                element.style.display = "none"
                // Uncheck if it was checked
                const checkbox = element.querySelector('input[type="checkbox"]')
                if (checkbox) {
                    checkbox.checked = false
                }
            }
        })
    }
}

// Function to update total price including additional services
function updateTotalPrice() {
    if (!selectedPackage) return

    const basePrice = selectedPackage.price
    let additionalCost = 0

    const servicePrices = {
        decorator: 3000,
        photographer: 8000,
        entertainment: 4000,
        cleanup: 2000,
        catering: 6000,
        helper: 2500,
    }

    const selectedServices = document.querySelectorAll('input[name="additionalServices"]:checked')
    selectedServices.forEach((service) => {
        additionalCost += servicePrices[service.value] || 0
    })

    const totalPrice = basePrice + additionalCost
    return { basePrice, additionalCost, totalPrice }
}

// Handle booking form submission
function handleBookingSubmission(e) {
    e.preventDefault()

    // Prevent double submission
    if (isSubmitting) {
        return
    }

    // Collect form data
    const form = document.getElementById("bookingForm")
    const formDataObj = new FormData(form)

    // Convert to regular object
    formData = {}
    for (const [key, value] of formDataObj.entries()) {
        if (formData[key]) {
            if (Array.isArray(formData[key])) {
                formData[key].push(value)
            } else {
                formData[key] = [formData[key], value]
            }
        } else {
            formData[key] = value
        }
    }

    // Add pricing information
    const pricing = updateTotalPrice()
    formData.basePrice = pricing.basePrice
    formData.additionalCost = pricing.additionalCost
    formData.totalPrice = pricing.totalPrice

    // Show summary modal
    showBookingSummary()
}

// Show booking summary
function showBookingSummary() {
    const pricing = updateTotalPrice()
    const selectedServices = document.querySelectorAll('input[name="additionalServices"]:checked')

    let extraServicesList = []
    selectedServices.forEach((service) => {
        const serviceNames = {
            decorator: "Extra Decoration",
            photographer: "Photography",
            entertainment: "Entertainment",
            cleanup: "Extra Cleanup",
            catering: "Premium Catering",
            helper: "Extra Helper",
        }
        extraServicesList.push(serviceNames[service.value])
    })

    const items = extraServicesList.length > 0 ? extraServicesList.join(", ") : "None"

    const summaryHtml = `
    <div class="confirm-summary">
        <div class="summary-item">
            <span class="summary-label">📦 Package</span>
            <span class="summary-value">${formData.packageName}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">👥 Guest Count</span>
            <span class="summary-value">${formData.guestCount}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">👷‍♂️ Staff Info</span>
            <span class="summary-value">${formData.staffInfo}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">📅 Date & Time</span>
            <span class="summary-value">${formData.eventDate} at ${formData.eventTime}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">🥗 Food Preference</span>
            <span class="summary-value">${formData.foodPreference ? (formData.foodPreference.charAt(0).toUpperCase() + formData.foodPreference.slice(1)) : "None"}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">📍 Address</span>
            <span class="summary-value">${formData.specificLocation}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">✨ Extra Services</span>
            <span class="summary-value">${items}</span>
        </div>
        <div class="summary-total">
            <span class="label">Total Amount</span>
            <span class="amount">Rs. ${pricing.totalPrice.toLocaleString()}</span>
        </div>
    </div>
  `

    document.getElementById("bookingSummaryContent").innerHTML = summaryHtml
    document.getElementById("bookingModal").style.display = "none"
    document.getElementById("summaryModal").style.display = "block"
}

// Check if user is logged in - IMPROVED WITH BETTER DEBUGGING
function checkLoginStatus() {
    console.log("🔍 Starting login status check...")

    return new Promise((resolve, reject) => {
        checkLoginSession().then(data => {
            console.log("🎯 Login check result data:", data)
            resolve(data.logged_in === true)
        }).catch(error => {
            console.error("❌ Login check error:", error)
            resolve(false)
        });
    })
}

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

function initUserAddressOption() {
    const useRegisteredAddressContainer = document.getElementById("useRegisteredAddressContainer");
    if (!useRegisteredAddressContainer) return;

    checkLoginSession().then(data => {
        if (data.logged_in && data.user && data.user.address) {
            userAddress = data.user.address;
            useRegisteredAddressContainer.style.display = "block";

            // Also pre-fill name/phone if available
            const customerNameInput = document.getElementById("customerName");
            const phoneNumberInput = document.getElementById("phoneNumber");
            if (customerNameInput && data.user.name) customerNameInput.value = data.user.name;
            if (phoneNumberInput && data.user.phone_number) phoneNumberInput.value = data.user.phone_number;
        }
    });
}

function geocodeAddress(address) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
        if (status === "OK" && results[0]) {
            const pos = results[0].geometry.location;
            if (occMap && occMarker) {
                occMap.setCenter(pos);
                occMap.setZoom(17);
                occMarker.setPosition(pos);

                updateLocationDetails(pos, results[0].formatted_address, results[0].address_components);
            }
        }
    });
}

// Handle final hire button - IMPROVED WITH STEP-BY-STEP DEBUGGING
function handleFinalHire() {
    console.log("🚀 Final hire button clicked")

    // Prevent double submission
    if (isSubmitting) {
        console.log("⚠️ Already submitting, preventing double submission")
        return
    }

    // Check if required elements exist
    const summaryModal = document.getElementById("summaryModal")
    const authModal = document.getElementById("authModal")
    const hireButton = document.getElementById("finalHireBtn")

    console.log("🔍 Checking elements:", {
        summaryModal: !!summaryModal,
        authModal: !!authModal,
        hireButton: !!hireButton
    })

    // Show loading state
    if (hireButton) {
        hireButton.disabled = true
        hireButton.textContent = "Checking login..."
    }

    console.log("🔐 About to check login status...")

    checkLoginStatus()
        .then((isLoggedIn) => {
            console.log("🎯 Login check result:", isLoggedIn)

            if (!isLoggedIn) {
                console.log("❌ User not logged in - showing auth modal")

                // Hide summary modal
                if (summaryModal) {
                    summaryModal.style.display = "none"
                    console.log("✅ Summary modal hidden")
                } else {
                    console.error("❌ Summary modal not found!")
                }

                // Show auth modal
                if (authModal) {
                    authModal.style.display = "flex"
                    console.log("✅ Auth modal shown")
                } else {
                    console.error("❌ Auth modal not found!")
                }

                // Reset forms and show login by default
                const loginForm = document.getElementById("loginForm")
                const signupForm = document.getElementById("signupForm")

                if (loginForm && signupForm) {
                    loginForm.style.display = "block"
                    signupForm.style.display = "none"
                    console.log("✅ Login form shown, signup form hidden")
                }

                // Clear previous messages
                const loginMessage = document.getElementById("loginMessage")
                const signupMessage = document.getElementById("signupMessage")

                if (loginMessage) loginMessage.style.display = "none"
                if (signupMessage) signupMessage.style.display = "none"

                // Show login required message
                setTimeout(() => {
                    showMessage("loginMessage", "Please login to complete your booking.", "error")
                }, 100)

                // Re-enable button
                if (hireButton) {
                    hireButton.disabled = false
                    hireButton.textContent = "Hire"
                }

            } else {
                console.log("✅ User is logged in - processing booking")
                processBooking()
            }
        })
        .catch((error) => {
            console.error("💥 Error in handleFinalHire:", error)
            alert("Error checking login status. Please try again.")

            // Re-enable button
            if (hireButton) {
                hireButton.disabled = false
                hireButton.textContent = "Hire Now"
            }
        })
}

// Process booking
function processBooking() {
    console.log("Processing booking...") // Debug log

    // Prevent double submission
    if (isSubmitting) {
        return
    }

    isSubmitting = true // Set flag to prevent double submission

    // Disable the button to prevent multiple clicks
    const hireButton = document.getElementById("finalHireBtn")
    if (hireButton) {
        hireButton.disabled = true
        hireButton.textContent = "Hire"
    }

    const bookingFormData = new FormData()

    // Add all form data
    for (const [key, value] of Object.entries(formData)) {
        if (Array.isArray(value)) {
            value.forEach((v) => bookingFormData.append(key, v))
        } else {
            bookingFormData.append(key, value)
        }
    }

    fetch("../php/submit_booking.php", {
        method: "POST",
        body: bookingFormData,
        credentials: "same-origin", // Include cookies
    })
        .then((response) => response.json())
        .then((data) => {
            console.log("Booking response:", data) // Debug log

            if (data.success) {
                alert(`Booking confirmed! 
Package: ${formData.packageName}
Date: ${formData.eventDate}
Time: ${formData.eventTime}
Total: Rs. ${formData.totalPrice.toLocaleString()}

We will contact you within 24 hours to confirm details.`)

                // Close modal and stay on same page
                document.getElementById("summaryModal").style.display = "none"

                // Reset the form and flags
                resetBookingForm()
                selectedPackage = null
                formData = {}
                isSubmitting = false

                // Re-enable button
                if (hireButton) {
                    hireButton.disabled = false
                    hireButton.textContent = "Hire"
                }
            } else {
                alert("Booking failed: " + data.message)
                // Re-enable button on error
                if (hireButton) {
                    hireButton.disabled = false
                    hireButton.textContent = "Hire"
                }
                isSubmitting = false
            }
        })
        .catch((error) => {
            console.error("Booking error:", error)
            alert("An error occurred while processing your booking. Please try again.")
            // Re-enable button on error
            if (hireButton) {
                hireButton.disabled = false
                hireButton.textContent = "Hire Now"
            }
            isSubmitting = false
        })
}

// Show message function
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId)
    if (!messageElement) {
        console.error("Message element not found:", elementId)
        return
    }

    messageElement.textContent = message
    messageElement.style.display = "block"
    messageElement.style.padding = "10px"
    messageElement.style.marginBottom = "15px"
    messageElement.style.borderRadius = "4px"
    messageElement.style.textAlign = "center"

    if (type === "success") {
        messageElement.style.backgroundColor = "#d4edda"
        messageElement.style.color = "#155724"
        messageElement.style.border = "1px solid #c3e6cb"
    } else {
        messageElement.style.backgroundColor = "#f8d7da"
        messageElement.style.color = "#721c24"
        messageElement.style.border = "1px solid #f5c6cb"
    }
}

// Add event listeners when page loads
document.addEventListener("DOMContentLoaded", () => {
    initializePage()

    // Date/Time Lead Time Restrictions (24 hours minimum)
    const eventDateInput = document.getElementById("eventDate");
    const eventTimeInput = document.getElementById("eventTime");

    function setupDateTimeRestrictions() {
        if (!eventDateInput || !eventTimeInput) return;

        function updateMinTime() {
            const now = new Date();
            const minDT = new Date(now.getTime() + (12 * 60 * 60 * 1000)); // 12 hours from now

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

    // Modal close functionality
    const bookingClose = document.getElementById("bookingClose")
    const summaryClose = document.getElementById("summaryClose")
    const authClose = document.getElementById("authClose")
    const bookingModal = document.getElementById("bookingModal")
    const summaryModal = document.getElementById("summaryModal")
    const authModal = document.getElementById("authModal")

    if (bookingClose) {
        bookingClose.addEventListener("click", () => {
            bookingModal.style.display = "none"
        })
    }

    if (summaryClose) {
        summaryClose.addEventListener("click", () => {
            summaryModal.style.display = "none"
        })
    }

    if (authClose) {
        authClose.addEventListener("click", () => {
            authModal.style.display = "none"
        })
    }

    // Close modals when clicking outside
    window.addEventListener("click", (e) => {
        if (e.target === bookingModal) {
            bookingModal.style.display = "none"
        }
        if (e.target === summaryModal) {
            summaryModal.style.display = "none"
        }
        if (e.target === authModal) {
            authModal.style.display = "none"
        }
    })

    // Handle booking form submission
    const bookingForm = document.getElementById("bookingForm")
    if (bookingForm) {
        bookingForm.addEventListener("submit", handleBookingSubmission)
    }

    // Handle navigation buttons
    const backToFormBtn = document.getElementById("backToForm")
    if (backToFormBtn) {
        backToFormBtn.addEventListener("click", () => {
            document.getElementById("summaryModal").style.display = "none"
            document.getElementById("bookingModal").style.display = "block"
        })
    }

    const finalHireBtn = document.getElementById("finalHireBtn")
    if (finalHireBtn) {
        finalHireBtn.addEventListener("click", handleFinalHire)
    }

    // Add event listeners for additional service checkboxes to update pricing
    const additionalServiceCheckboxes = document.querySelectorAll('input[name="additionalServices"]')
    additionalServiceCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", updateTotalPrice)
    })

    // Auth form handling - LOGIN
    const loginFormElement = document.getElementById("loginFormElement")
    if (loginFormElement) {
        loginFormElement.addEventListener("submit", function (e) {
            e.preventDefault()

            console.log("Login form submitted") // Debug log

            const formData = new FormData(this)

            fetch("../php/login.php", {
                method: "POST",
                body: formData,
                credentials: "same-origin",
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log("Login response:", data) // Debug log

                    if (data.success) {
                        showMessage("loginMessage", data.message, "success")
                        setTimeout(() => {
                            document.getElementById("authModal").style.display = "none"
                            // Continue with booking process
                            processBooking()
                        }, 1500)
                    } else {
                        showMessage("loginMessage", data.message, "error")
                    }
                })
                .catch((error) => {
                    console.error("Login error:", error)
                    showMessage("loginMessage", "An error occurred. Please try again.", "error")
                })
        })
    }

    // Auth form handling - SIGNUP
    const signupFormElement = document.getElementById("signupFormElement")
    if (signupFormElement) {
        signupFormElement.addEventListener("submit", function (e) {
            e.preventDefault()

            console.log("Signup form submitted") // Debug log

            const formData = new FormData(this)

            fetch("../php/signup.php", {
                method: "POST",
                body: formData,
                credentials: "same-origin",
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log("Signup response:", data) // Debug log

                    if (data.success) {
                        showMessage("signupMessage", data.message, "success")
                        setTimeout(() => {
                            // Switch to login form
                            document.getElementById("signupForm").style.display = "none"
                            document.getElementById("loginForm").style.display = "block"
                            document.getElementById("signupFormElement").reset()
                        }, 2000)
                    } else {
                        showMessage("signupMessage", data.message, "error")
                    }
                })
                .catch((error) => {
                    console.error("Signup error:", error)
                    showMessage("signupMessage", "An error occurred. Please try again.", "error")
                })
        })
    }

    // Form switching
    const showSignupBtn = document.getElementById("showSignup")
    if (showSignupBtn) {
        showSignupBtn.addEventListener("click", (e) => {
            e.preventDefault()
            document.getElementById("loginForm").style.display = "none"
            document.getElementById("signupForm").style.display = "block"
        })
    }

    const showLoginBtn = document.getElementById("showLogin")
    if (showLoginBtn) {
        showLoginBtn.addEventListener("click", (e) => {
            e.preventDefault()
            document.getElementById("signupForm").style.display = "none"
            document.getElementById("loginForm").style.display = "block"
        })
    }

    // Registered Address checkbox listener
    const useRegisteredAddressCheckbox = document.getElementById("useRegisteredAddress");
    if (useRegisteredAddressCheckbox) {
        useRegisteredAddressCheckbox.addEventListener("change", function () {
            if (this.checked && userAddress) {
                const specificLocationInput = document.getElementById("specificLocation");
                if (specificLocationInput) {
                    specificLocationInput.value = userAddress;
                    geocodeAddress(userAddress);
                }
            } else {
                const specificLocationInput = document.getElementById("specificLocation");
                if (specificLocationInput) specificLocationInput.value = "";
            }
        });
    }

    // Listen for login event to update address options
    document.addEventListener('userLoaded', (e) => {
        initUserAddressOption();
    });
})

let occMap;
let occMarker;

function initMap() {
    const mapElement = document.getElementById("map");
    const inputElement = document.getElementById("specificLocation");
    const specificAddressField = document.getElementById("specificLocation");

    if (!mapElement || !inputElement) return;

    // Default to Kathmandu
    const defaultCenter = { lat: 27.7172, lng: 85.3240 };

    occMap = new google.maps.Map(mapElement, {
        center: defaultCenter,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
    });

    occMarker = new google.maps.Marker({
        map: occMap,
        position: defaultCenter,
        draggable: true,
        animation: google.maps.Animation.DROP
    });

    const autocomplete = new google.maps.places.Autocomplete(inputElement);
    autocomplete.bindTo("bounds", occMap);

    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        occMap.setCenter(place.geometry.location);
        occMap.setZoom(17);
        occMarker.setPosition(place.geometry.location);

        updateLocationDetails(place.geometry.location, place.formatted_address, place.address_components);
    });

    // Update address if marker dragged
    occMarker.addListener("dragend", () => {
        geocodeLatLng(occMarker.getPosition());
    });

    // Support clicking directly on map
    occMap.addListener("click", (event) => {
        occMarker.setPosition(event.latLng);
        geocodeLatLng(event.latLng);
    });

    function geocodeLatLng(latLng) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === "OK" && results[0]) {
                updateLocationDetails(latLng, results[0].formatted_address, results[0].address_components);
            }
        });
    }

    function updateLocationDetails(latLng, address, components) {
        // Update input field
        if (specificAddressField) {
            specificAddressField.value = address;
        }

        // Update locationArea hidden input
        const locationAreaInput = document.querySelector('input[name="locationArea"]');
        let area = "Unknown Area";
        if (components) {
            for (let comp of components) {
                if (comp.types.includes("locality") || comp.types.includes("sublocality")) {
                    area = comp.long_name;
                    break;
                }
            }
        }
        if (locationAreaInput) locationAreaInput.value = area;
    }
}
