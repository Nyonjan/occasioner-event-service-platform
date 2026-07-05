class ServiceCarousel {
  constructor(carouselId, prevBtnId, nextBtnId) {
    this.carousel = document.getElementById(carouselId)
    this.prevBtn = document.getElementById(prevBtnId)
    this.nextBtn = document.getElementById(nextBtnId)
    this.currentIndex = 0
    this.init()
    
    // Add to a global registry for resizing
    if (!window.activeCarousels) window.activeCarousels = []
    window.activeCarousels.push(this)
  }

  init() {
    this.updateLayout()
    this.prevBtn.addEventListener("click", () => this.scrollLeft())
    this.nextBtn.addEventListener("click", () => this.scrollRight())

    // Add hire button event listeners
    const hireButtons = this.carousel.querySelectorAll(".hire-btn")
    hireButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        const card = e.target.closest(".service-card")
        const title = card.querySelector(".card-title").textContent
        const serviceType = card.getAttribute("data-service")

        if (serviceType === "birthday") {
          window.location.href = "booking.html?service=birthday"
        } else if (serviceType === "wedding") {
          window.location.href = "booking.html?service=wedding"
        } else if (serviceType === "corporate") {
          window.location.href = "booking.html?service=corporate"
        } else if (serviceType === "chef") {
          window.location.href = "chef-booking.html"
        } else {
          alert(`Hire request for: ${title}`)
        }
      })
    })
  }

  updateLayout() {
    const wrapper = this.carousel.parentElement
    if (!wrapper) return

    const card = this.carousel.querySelector(".service-card")
    if (!card) return

    // Get real card width including gap
    const style = window.getComputedStyle(this.carousel)
    const gap = parseInt(style.gap) || 0
    
    this.cardWidth = card.offsetWidth + gap
    
    // Calculate visible cards
    const wrapperWidth = wrapper.offsetWidth
    this.visibleCards = Math.floor(wrapperWidth / card.offsetWidth) || 1
    
    this.updateCarousel()
    this.updateButtons()
  }

  get maxIndex() {
    const totalCards = this.carousel.children.length
    return Math.max(0, totalCards - this.visibleCards)
  }

  scrollLeft() {
    if (this.currentIndex > 0) {
      this.currentIndex--
      this.updateCarousel()
      this.updateButtons()
    }
  }

  scrollRight() {
    if (this.currentIndex < this.maxIndex) {
      this.currentIndex++
      this.updateCarousel()
      this.updateButtons()
    }
  }

  updateCarousel() {
    const translateX = -this.currentIndex * this.cardWidth
    this.carousel.style.transform = `translateX(${translateX}px)`
  }

  updateButtons() {
    this.prevBtn.disabled = this.currentIndex === 0
    this.nextBtn.disabled = this.currentIndex >= this.maxIndex
  }
}

// Initialize carousels and handle login status once
document.addEventListener("DOMContentLoaded", () => {
  new ServiceCarousel("occasion-carousel", "occasion-prev", "occasion-next")
  new ServiceCarousel("service-carousel", "service-prev", "service-next")
  checkLoginStatus()
})

// Handle responsive behavior efficiently
let resizeTimeout
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    if (window.activeCarousels) {
      window.activeCarousels.forEach(carousel => carousel.updateLayout())
    }
  }, 100)
})
