let slideIndex = 1;
showSlides(slideIndex);

// Next/previous controls
function changeSlide(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("slide");
  let indicators = document.getElementsByClassName("indicator");
  
  if (slides.length === 0) return; // Exit if no slides are found

  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  
  for (i = 0; i < slides.length; i++) {
    slides[i].classList.remove("active");
  }
  
  for (i = 0; i < indicators.length; i++) {
    indicators[i].classList.remove("active");
  }
  
  slides[slideIndex-1].classList.add("active");
  if (indicators[slideIndex-1]) {
    indicators[slideIndex-1].classList.add("active");
  }
}

// Auto slideshow (optional)
setInterval(() => {
  changeSlide(1);
}, 5000);
