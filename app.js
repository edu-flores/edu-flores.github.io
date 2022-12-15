const header = document.querySelector(".header");

// Add shadow to header after scrolling
window.addEventListener("scroll", () => {
  (scrollY > 0) ? header.classList.add("shadow") : header.classList.remove("shadow");
});

// Open and close nav
function toggleMenu() {
  if (!header.classList.contains("mobile-open")) {
    header.classList.add("mobile-open");
  } 
  else {
    header.classList.remove("mobile-open");
  }
}

const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".navbar--link");

// Highlight current section in nav
window.addEventListener("scroll", () => {
  
  let current;
  sections.forEach(section => {
    const sectionPos = section.offsetTop;
    if (scrollY >= sectionPos) {
      current = section.getAttribute("id");
      return;
    }
  });

  navLinks.forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("href") == "#" + current) {
      link.classList.add("active");
    }
  });
});