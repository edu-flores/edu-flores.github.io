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
const lightFiles = document.querySelector("#about--files-light");
const darkFiles = document.querySelector("#about--files-dark");
theme = localStorage.getItem("theme");
if (theme == "dark") {
  document.body.classList.add("dark-theme");
  darkFiles.style.display = "initial";
} else {
  light.style.display = "initial";
}

// Toggle theme
function toggleTheme() {
  document.body.classList.toggle("dark-theme");
  if (theme == "light") {
    localStorage.setItem("theme", "dark");
    lightFiles.style.display = "none";
    darkFiles.style.display = "initial";
    theme = "dark";
  } else {
    localStorage.setItem("theme", "light");
    lightFiles.style.display = "initial";
    darkFiles.style.display = "none";
    theme = "light";
  }
}

// Show scroll to top button
const scrollBtn = document.querySelector("#scroll-top");
window.addEventListener("scroll", () => {
  (scrollY > 300) ? scrollBtn.style.opacity = "1" : scrollBtn.style.opacity = "0";
});

// Open and close nav
const header = document.querySelector(".header");
function toggleMenu() {
  header.classList.toggle("mobile-open");
}

const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".navbar--link");

// Highlight current section in nav
const windowHeight = window.innerHeight;
window.addEventListener("scroll", () => {
  let current;
  sections.forEach(section => {
    const sectionPos = section.offsetTop ;
    if (scrollY + (windowHeight / 2) >= sectionPos) {
      current = section.getAttribute("id");
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

const form = document.getElementById("contact--form");
form.addEventListener("submit", handleSubmit);

// Contact form, using Formspree AJAX method
async function handleSubmit(event) {
  event.preventDefault();
  const status = document.getElementById("contact--form-status");
  const data = new FormData(event.target);
  fetch(event.target.action, {
    method: form.method,
    body: data,
    headers: {
        'Accept': 'application/json'
    }
  }).then(response => {
    if (response.ok) {
      status.innerHTML = "Sent!";
      Array.from(form.elements).forEach(element => element.disabled = true);
    } else {
      response.json().then(data => {
        if (Object.hasOwn(data, 'errors')) {
          status.innerHTML = data["errors"].map(error => error["message"]).join(", ");
        } else {
          status.innerHTML = "Oops! Try again.";
        }
      });
    }
  }).catch(error => {
    status.innerHTML = "Oops! Try again.";
  });
}