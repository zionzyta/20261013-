const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');
const form = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

menuToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

siteNav.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    siteNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
});

async function loadProfile() {
  try {
    const response = await fetch('/api/profile');
    if (!response.ok) throw new Error('profile unavailable');
    const profile = await response.json();
    document.querySelector('#hero-intro').textContent = profile.intro;
  } catch (error) {
    // The page already contains a useful static fallback.
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  formStatus.textContent = '傳送中…';
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '送出失敗');
    formStatus.textContent = result.message;
    form.reset();
  } catch (error) {
    formStatus.textContent = error.message || '目前無法送出，請稍後再試。';
  }
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const tiltCards = document.querySelectorAll('.tilt-card');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
tiltCards.forEach((card) => {
  if (reducedMotion.matches || !finePointer.matches) return;
  card.addEventListener('pointermove', (event) => {
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    card.style.setProperty('--tilt-x', `${(x * 4).toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${(-y * 4).toFixed(2)}deg`);
  });
  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  });
});

const canvas = document.querySelector('#particle-field');
const context = canvas.getContext('2d');
const heroCanvas = document.querySelector('#hero-canvas');
const heroContext = heroCanvas.getContext('2d');
let particles = [];
let orbitParticles = [];
let pointer = { x: -1000, y: -1000 };

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const count = window.innerWidth < 700 ? 22 : 48;
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - .5) * .18,
    vy: (Math.random() - .5) * .18,
    size: Math.random() * 1.6 + .4
  }));
  const heroSize = heroCanvas.getBoundingClientRect().width || 420;
  const heroRatio = Math.min(window.devicePixelRatio || 1, 2);
  heroCanvas.width = heroSize * heroRatio;
  heroCanvas.height = heroSize * heroRatio;
  heroContext.setTransform(heroRatio, 0, 0, heroRatio, 0, 0);
  orbitParticles = Array.from({ length: window.innerWidth < 700 ? 12 : 26 }, (_, index) => ({
    angle: (Math.PI * 2 * index) / 15,
    radius: heroSize * (.29 + (index % 3) * .055),
    speed: .0018 + (index % 4) * .00045,
    size: 1.35 + (index % 3) * .7,
    color: index % 4 === 0 ? '99, 230, 226' : '255, 178, 210'
  }));
}

function drawParticles() {
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  particles.forEach((particle) => {
    if (!reducedMotion.matches) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
      if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;
    }
    const distance = Math.hypot(pointer.x - particle.x, pointer.y - particle.y);
    const alpha = distance < 150 ? .66 : .25;
    context.beginPath();
    context.fillStyle = particle.size > 1.2 ? `rgba(99, 230, 226, ${alpha})` : `rgba(255, 178, 210, ${alpha})`;
    context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    context.fill();
  });
  if (!reducedMotion.matches) window.requestAnimationFrame(drawParticles);
}

function drawOrbit() {
  const size = heroCanvas.getBoundingClientRect().width || 420;
  const center = size / 2;
  heroContext.clearRect(0, 0, size, size);
  heroContext.save();
  heroContext.translate(center, center);
  heroContext.rotate(-.42);
  heroContext.scale(1, .48);
  heroContext.beginPath();
  heroContext.arc(0, 0, size * .4, 0, Math.PI * 2);
  heroContext.strokeStyle = 'rgba(99, 230, 226, .4)';
  heroContext.lineWidth = 1.5;
  heroContext.shadowBlur = 18;
  heroContext.shadowColor = 'rgba(99, 230, 226, .45)';
  heroContext.stroke();
  heroContext.restore();
  heroContext.save();
  heroContext.translate(center, center);
  heroContext.rotate(.92);
  heroContext.scale(1, .48);
  heroContext.beginPath();
  heroContext.arc(0, 0, size * .3, 0, Math.PI * 2);
  heroContext.strokeStyle = 'rgba(255, 178, 210, .48)';
  heroContext.lineWidth = 1.25;
  heroContext.shadowBlur = 18;
  heroContext.shadowColor = 'rgba(255, 178, 210, .5)';
  heroContext.stroke();
  heroContext.restore();
  orbitParticles.forEach((particle) => {
    if (!reducedMotion.matches) particle.angle += particle.speed;
    const orbitOffsetX = (pointer.x / Math.max(window.innerWidth, 1) - .5) * 5;
    const orbitOffsetY = (pointer.y / Math.max(window.innerHeight, 1) - .5) * 5;
    const x = center + Math.cos(particle.angle) * particle.radius + orbitOffsetX;
    const y = center + Math.sin(particle.angle) * particle.radius * .48 + orbitOffsetY;
    heroContext.beginPath();
    heroContext.fillStyle = `rgba(${particle.color}, .8)`;
    heroContext.shadowBlur = 12;
    heroContext.shadowColor = `rgba(${particle.color}, .8)`;
    heroContext.arc(x, y, particle.size, 0, Math.PI * 2);
    heroContext.fill();
  });
  heroContext.shadowBlur = 0;
  if (!reducedMotion.matches) window.requestAnimationFrame(drawOrbit);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('pointermove', (event) => { pointer = { x: event.clientX, y: event.clientY }; });
resizeCanvas();
drawParticles();
drawOrbit();
loadProfile();
