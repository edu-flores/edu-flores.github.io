const header = document.querySelector(".header");

// Add shadow to header after scrolling
window.addEventListener("scroll", () => {
  let scroll =  document.documentElement.scrollTop;
  (scroll > 0) ? header.classList.add("shadow") : header.classList.remove("shadow");
});

// Open and close nav
function toggleMenu() {
  if (!header.classList.contains("mobile-open")) {
    header.classList.add("mobile-open");
    header.classList.add("shadow");
  } else {
    header.classList.remove("mobile-open");
    if (document.documentElement.scrollTop == 0) {
      header.classList.remove("shadow");
    }
  }
}