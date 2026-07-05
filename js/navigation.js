// Enhanced slideshow functionality with carousel support
let currentSlideIndex = 0
let slideInterval
let servicesIndex = 0
let presenceIndex = 0
let testimonialsIndex = 0

// Initialize all sliders when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Inject mobile menu toggle before nav-links
  const nav = document.querySelector('nav');
  const navLinks = document.querySelector('.nav-links');
  if (nav && navLinks) {
    const menuToggle = document.createElement('div');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '☰';
    nav.insertBefore(menuToggle, navLinks);

    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('sidebar-active');
      const isActive = navLinks.classList.contains('sidebar-active');
      menuToggle.style.opacity = isActive ? '0' : '1';
      menuToggle.style.pointerEvents = isActive ? 'none' : 'auto';
    });
    
    // Close sidebar if clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('sidebar-active');
            menuToggle.style.opacity = '1';
            menuToggle.style.pointerEvents = 'auto';
        }
    });
  }

  initializeSlideshow()
  initializeCarousels()
})

function initializeSlideshow() {
  const slides = document.querySelectorAll(".slide")

  if (slides.length === 0) {
    return
  }

  showSlide(0)
  startAutoSlide()

  const slideshowContainer = document.querySelector(".slideshow-container")
  if (slideshowContainer) {
    slideshowContainer.addEventListener("mouseenter", stopAutoSlide)
    slideshowContainer.addEventListener("mouseleave", startAutoSlide)
  }
}

function initializeCarousels() {
  // Initialize services carousel
  const servicesTrack = document.getElementById("servicesTrack")
  if (servicesTrack) {
    updateServicesDisplay()
  }

  // Initialize presence carousel
  const presenceTrack = document.getElementById("presenceTrack")
  if (presenceTrack) {
    updatePresenceDisplay()
  }

  // Initialize testimonials carousel
  const testimonialsTrack = document.getElementById("testimonialsTrack")
  if (testimonialsTrack) {
    updateTestimonialsDisplay()
  }
}

// Hero slideshow functions
function showSlide(index) {
  const slides = document.querySelectorAll(".slide")
  const indicators = document.querySelectorAll(".indicator")

  if (slides.length === 0) return

  slides.forEach((slide) => {
    slide.classList.remove("active")
  })

  indicators.forEach((indicator) => {
    indicator.classList.remove("active")
  })

  if (slides[index]) {
    slides[index].classList.add("active")
  }

  if (indicators[index]) {
    indicators[index].classList.add("active")
  }

  currentSlideIndex = index
}

function changeSlide(direction) {
  const slides = document.querySelectorAll(".slide")
  const totalSlides = slides.length

  if (totalSlides === 0) return

  currentSlideIndex += direction

  if (currentSlideIndex >= totalSlides) {
    currentSlideIndex = 0
  } else if (currentSlideIndex < 0) {
    currentSlideIndex = totalSlides - 1
  }

  showSlide(currentSlideIndex)
  resetAutoSlide()
}

function currentSlide(slideNumber) {
  showSlide(slideNumber - 1)
  resetAutoSlide()
}

function nextSlide() {
  const slides = document.querySelectorAll(".slide")
  const totalSlides = slides.length

  if (totalSlides === 0) return

  currentSlideIndex++
  if (currentSlideIndex >= totalSlides) {
    currentSlideIndex = 0
  }

  showSlide(currentSlideIndex)
}

function startAutoSlide() {
  stopAutoSlide()
  slideInterval = setInterval(nextSlide, 4000)
}

function stopAutoSlide() {
  if (slideInterval) {
    clearInterval(slideInterval)
    slideInterval = null
  }
}

function resetAutoSlide() {
  stopAutoSlide()
  startAutoSlide()
}

// Services carousel functions
function slideServices(direction) {
  const servicesTrack = document.getElementById("servicesTrack")
  const serviceItems = servicesTrack.querySelectorAll(".service-item")
  const totalItems = serviceItems.length
  const itemsToShow = window.innerWidth <= 768 ? 1 : 4
  const maxIndex = Math.max(0, totalItems - itemsToShow)

  servicesIndex += direction

  if (servicesIndex > maxIndex) {
    servicesIndex = 0
  } else if (servicesIndex < 0) {
    servicesIndex = maxIndex
  }

  updateServicesDisplay()
}

function updateServicesDisplay() {
  const servicesTrack = document.getElementById("servicesTrack")
  const itemWidth = window.innerWidth <= 768 ? 100 : 25 // 100% for mobile, 25% for desktop
  const translateX = -servicesIndex * itemWidth
  servicesTrack.style.transform = `translateX(${translateX}%)`
}

// Presence carousel functions
function slidePresence(direction) {
  const presenceTrack = document.getElementById("presenceTrack")
  const presenceItems = presenceTrack.querySelectorAll(".presence-item")
  const totalItems = presenceItems.length
  const itemsToShow = window.innerWidth <= 768 ? 1 : 3
  const maxIndex = Math.max(0, totalItems - itemsToShow)

  presenceIndex += direction

  if (presenceIndex > maxIndex) {
    presenceIndex = 0
  } else if (presenceIndex < 0) {
    presenceIndex = maxIndex
  }

  updatePresenceDisplay()
}

function updatePresenceDisplay() {
  const presenceTrack = document.getElementById("presenceTrack")
  const itemWidth = window.innerWidth <= 768 ? 100 : 33.333 // 100% for mobile, 33.333% for desktop
  const translateX = -presenceIndex * itemWidth
  presenceTrack.style.transform = `translateX(${translateX}%)`
}

// Testimonials carousel functions
function slideTestimonials(direction) {
  const testimonialsTrack = document.getElementById("testimonialsTrack")
  const testimonialItems = testimonialsTrack.querySelectorAll(".testimonial-item")
  const totalItems = testimonialItems.length
  const itemsToShow = window.innerWidth <= 768 ? 1 : 3
  const maxIndex = Math.max(0, totalItems - itemsToShow)

  testimonialsIndex += direction

  if (testimonialsIndex > maxIndex) {
    testimonialsIndex = 0
  } else if (testimonialsIndex < 0) {
    testimonialsIndex = maxIndex
  }

  updateTestimonialsDisplay()
}

function updateTestimonialsDisplay() {
  const testimonialsTrack = document.getElementById("testimonialsTrack")
  const itemWidth = window.innerWidth <= 768 ? 100 : 33.333 // 100% for mobile, 33.333% for desktop
  const translateX = -testimonialsIndex * itemWidth
  testimonialsTrack.style.transform = `translateX(${translateX}%)`
}

// Handle window resize
window.addEventListener("resize", () => {
  updateServicesDisplay()
  updatePresenceDisplay()
  updateTestimonialsDisplay()
})
