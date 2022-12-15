function toggleMenu() {
  let header = document.querySelector(".header");
  header.className = (header.className == "header") ? "header mobile-open" : "header";
}