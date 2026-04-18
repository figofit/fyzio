const yearNode = document.getElementById('year');
if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

const navToggle = document.getElementById('navToggle');
if (navToggle) {
  document.querySelectorAll('.nav a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.checked = false;
    });
  });
}
