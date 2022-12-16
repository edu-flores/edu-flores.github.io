// Log custom message
console.log(
  `
   ._________________.
   |.---------------.|
   ||               ||      I hope you liked
   ||    Eduardo    ||      my website. Please,
   ||    Flores     ||      contact me if you
   ||               ||      need me for work!
   ||_______________||
   /.-.-.-.-.-.-.-.-.\\      eduardo.floresramones@gmail.com
  /.-.-.-.-.-.-.-.-.-.\\
 /.-.-.-.-.-.-.-.-.-.-.\\
/______/__________\\___o_\\
\\_______________________/

Repo: https://github.com/edu-flores/edu-flores.github.io
  `
);

// Check theme
let theme = localStorage.getItem("theme");
if (!theme) {
  const { matches } = window.matchMedia("(prefers-color-scheme: dark)");
  matches ? localStorage.setItem("theme", "dark") : localStorage.setItem("theme", "light");
}

// Apply theme
theme = localStorage.getItem("theme");
if (theme == "dark") {
  document.body.classList.add("dark-theme");
}

// Toggle theme
function toggleTheme() {
  if (theme == "light") {
    document.body.classList.add("dark-theme");
    localStorage.setItem("theme", "dark");
    theme = "dark";
  } else {
    document.body.classList.remove("dark-theme");
    localStorage.setItem("theme", "light");
    theme = "light";
  }
}

const header = document.querySelector(".header");
const scrollBtn = document.querySelector("#scroll-top");

// Add shadow to header after scrolling & show scroll button
window.addEventListener("scroll", () => {
  (scrollY > 0) ? header.classList.add("shadow") : header.classList.remove("shadow");
  (scrollY > 300) ? scrollBtn.style.display = "block" : scrollBtn.style.display = "none";
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

// Scroll to top of the page
function scrollUp() {
  window.scrollTo(0, 0);
}