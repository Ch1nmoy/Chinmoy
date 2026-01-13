/* =========================
   Helpers
========================= */
const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => [...root.querySelectorAll(q)];

function escapeHTML(str = "") {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

/* =========================
   Preloader
========================= */
window.addEventListener("load", () => {
  const pre = $("#preloader");
  setTimeout(() => {
    pre.style.opacity = "0";
    pre.style.pointerEvents = "none";
    setTimeout(() => pre.remove(), 250);
  }, 450);
});

/* =========================
   Mobile Nav
========================= */
const navToggle = $("#navToggle");
const navLinks = $("#navLinks");

navToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

$$(".nav-link").forEach((a) => {
  a.addEventListener("click", () => navLinks.classList.remove("open"));
});

/* =========================
   Active Link on Scroll
========================= */
const sections = $$("section[id]");
const navMap = new Map($$(".nav-link").map(a => [a.getAttribute("href").slice(1), a]));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      const id = e.target.id;
      $$(".nav-link").forEach(n => n.classList.remove("active"));
      const active = navMap.get(id);
      if (active) active.classList.add("active");
    }
  });
}, { root: null, threshold: 0.35 });

sections.forEach(s => sectionObserver.observe(s));

/* =========================
   Reveal Animations
========================= */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("in-view");
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.14 });

function attachReveal() {
  $$(".reveal").forEach(el => revealObs.observe(el));
}
attachReveal();

/* =========================
   Custom Cursor (Ring + Dot)
========================= */
const dot = $(".cursor-dot");
const ring = $(".cursor-ring");

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let ringX = mouseX, ringY = mouseY;

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  dot.style.left = mouseX + "px";
  dot.style.top = mouseY + "px";
});

function animateRing() {
  ringX += (mouseX - ringX) * 0.14;   // smooth follow
  ringY += (mouseY - ringY) * 0.14;
  ring.style.left = ringX + "px";
  ring.style.top = ringY + "px";
  requestAnimationFrame(animateRing);
}
animateRing();

function setHover(state) {
  if (state) ring.classList.add("hover");
  else ring.classList.remove("hover");
}

document.addEventListener("mouseover", (e) => {
  const t = e.target;
  if (t.closest("[data-cursor='link'], button, a, .card, .chip, input, textarea")) setHover(true);
});
document.addEventListener("mouseout", () => setHover(false));

/* =========================
   Particle Network Background (Canvas)
========================= */
const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");

let W = 0, H = 0, DPR = Math.min(2, window.devicePixelRatio || 1);
let particles = [];
let maxParticles = 90;
let linkDist = 140;

function resizeCanvas() {
  W = window.innerWidth;
  H = window.innerHeight;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  maxParticles = W < 700 ? 55 : 90;
  linkDist = W < 700 ? 120 : 150;

  initParticles();
}

function initParticles() {
  particles = [];
  const count = maxParticles;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      r: Math.random() * 1.6 + 0.6
    });
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // particles
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < -20) p.x = W + 20;
    if (p.x > W + 20) p.x = -20;
    if (p.y < -20) p.y = H + 20;
    if (p.y > H + 20) p.y = -20;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(41,255,138,0.50)";
    ctx.fill();
  }

  // lines
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < linkDist) {
        const alpha = (1 - d / linkDist) * 0.22;
        ctx.strokeStyle = `rgba(41,255,138,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(draw);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
draw();

/* =========================
   JSON Data -> Render UI
========================= */
async function loadData() {
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load data.json");
    const data = await res.json();
    renderAll(data);
  } catch (err) {
    console.error(err);
    // Friendly fallback for file:// issue
    $("#heroSummary").textContent =
      "⚠ data.json load হয়নি। VS Code Live Server / local server দিয়ে চালাও।";
  }
}

function renderAll(data) {
  const p = data.profile;

  // hero
  $("#heroName").textContent = p.name;
  $("#heroRole").textContent = p.role;
  $("#heroSummary").textContent = p.summary;
  $("#heroPhoto").src = p.photo;
  $("#aboutPhoto").src = p.photo;

  // about
  $("#aboutText").textContent = p.about;
  $("#infoName").textContent = p.name;
  $("#infoEmail").textContent = p.email;
  $("#infoPhone").textContent = p.phone;
  $("#infoGithub").textContent = p.github.replace("https://", "");
  const cvBtn = document.getElementById("downloadCv");
if (cvBtn) {
  cvBtn.href = p.cv;
  cvBtn.target = "_blank";
  cvBtn.rel = "noreferrer";
}

  // footer
  $("#year").textContent = new Date().getFullYear();
  $("#footerName").textContent = p.name;

  // experience
  const expGrid = $("#experienceGrid");
  expGrid.innerHTML = data.experience.map((e) => `
    <article class="card reveal" data-cursor="link">
      <div class="role">
        <div>
          <h4>${escapeHTML(e.title)}</h4>
          <div class="small">${escapeHTML(e.company)}</div>
        </div>
        <div class="badge">${escapeHTML(e.date)}</div>
      </div>
      <ul class="bullets">
        ${e.highlights.map(h => `<li>${escapeHTML(h)}</li>`).join("")}
      </ul>
    </article>
  `).join("");

  // education
  const eduGrid = $("#educationGrid");
  eduGrid.innerHTML = data.education.map((e) => `
    <article class="card reveal" data-cursor="link">
      <div class="role">
        <div>
          <h4>${escapeHTML(e.degree)}</h4>
          <div class="small">${escapeHTML(e.institute)}</div>
        </div>
        <div class="badge">${escapeHTML(e.date)}</div>
      </div>
      <p class="muted" style="margin:12px 0 0; line-height:1.7;">
        ${escapeHTML(e.details)}
      </p>
    </article>
  `).join("");

  // skills bars
  const skillBars = $("#skillBars");
  skillBars.innerHTML = data.skills.technical.map((s, idx) => `
    <div class="skill-row reveal" style="transition-delay:${idx * 60}ms">
      <div class="skill-name">${escapeHTML(s.name)}</div>
      <div class="skill-val">${s.value}%</div>
      <div class="bar"><i data-target="${s.value}"></i></div>
    </div>
  `).join("");

  // tool chips
  const toolChips = $("#toolChips");
  toolChips.innerHTML = data.skills.tools.map(t => `
    <span class="chip" data-cursor="link">${escapeHTML(t)}</span>
  `).join("");

  // soft skills
  const soft = $("#softSkills");
  soft.innerHTML = data.skills.soft.map(s => `<li>${escapeHTML(s)}</li>`).join("");

  // projects
  const projectsGrid = $("#projectsGrid");
  projectsGrid.innerHTML = data.projects.map((pr) => {
    const actions = [];
    if (pr.source) actions.push(`<a class="link-btn" href="${pr.source}" target="_blank" rel="noreferrer" data-cursor="link">View Source</a>`);
    if (pr.materials) actions.push(`<a class="link-btn" href="${pr.materials}" target="_blank" rel="noreferrer" data-cursor="link">Test Materials</a>`);
    return `
      <article class="card reveal" data-cursor="link">
        <div class="role">
          <div>
            <h4>${escapeHTML(pr.name)}</h4>
            <div class="small">${escapeHTML(pr.type)}</div>
          </div>
          <div class="badge">Project</div>
        </div>
        <p class="muted" style="margin:12px 0 0; line-height:1.7;">
          ${escapeHTML(pr.description)}
        </p>
        <div class="project-actions">
          ${actions.join("")}
        </div>
      </article>
    `;
  }).join("");

  // certificates
  const certGrid = $("#certGrid");
  certGrid.innerHTML = data.certifications.map((c, i) => `
    <article class="card reveal" data-idx="${i}" data-cert="true" data-cursor="link">
      <div class="role">
        <div>
          <h4>${escapeHTML(c.title)}</h4>
          <div class="small">${escapeHTML(c.category)}</div>
        </div>
        <div class="badge">Certificate</div>
      </div>
      <p class="muted" style="margin:12px 0 0; line-height:1.7;">
        ${escapeHTML(c.description)}
      </p>
      <div class="project-actions">
        <button class="link-btn" type="button" data-open="cert" data-idx="${i}" data-cursor="link">Click to view</button>
      </div>
    </article>
  `).join("");

  // contact
  $("#contactNote").textContent = data.contactNote || "";
  $("#contactEmail").textContent = p.email;
  $("#contactEmail").href = `mailto:${p.email}`;

  $("#contactPhone").textContent = p.phone;
  $("#contactPhone").href = `tel:${p.phone.replace(/\s+/g, "")}`;

  $("#contactWebsite").textContent = p.website;
  $("#contactWebsite").href = p.website;

  $("#contactGithub").textContent = p.github;
  $("#contactGithub").href = p.github;

  // socials
  const socialRow = $("#socialRow");
  socialRow.innerHTML = (data.socials || []).map(s => {
    const icon = s.icon;
    const svg = icon === "gh" ? githubSVG()
      : icon === "in" ? linkedinSVG()
      : icon === "fb" ? facebookSVG()
      : linkSVG();
    return `
      <a class="social" href="${s.url}" target="_blank" rel="noreferrer" aria-label="${escapeHTML(s.name)}" data-cursor="link">
        ${svg}
      </a>
    `;
  }).join("");

  // attach reveal to new nodes
  attachReveal();

  // animate progress bars when in view
  animateBarsOnView();

  // modal open
  setupCertModal(data);
}

/* =========================
   Skill Bar Animation
========================= */
function animateBarsOnView() {
  const bars = $$(".bar > i");
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const target = e.target.getAttribute("data-target");
        e.target.style.width = `${target}%`;
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.35 });

  bars.forEach(b => obs.observe(b));
}

/* =========================
   Certificate Modal
========================= */
function setupCertModal(data){
  const modal = $("#certModal");
  const closeBtn = $("#modalClose");
  const title = $("#modalTitle");
  const link = $("#modalLink");
  const body = $("#modalBody");

  function openCert(idx){
    const c = data.certifications[idx];
    if(!c) return;
    title.textContent = c.title;
    link.href = c.link || "#";
    link.textContent = c.link ? "Open Certificate" : "No link provided";
    body.textContent = c.description || "";
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }
  function close(){
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-open='cert']");
    if (btn) openCert(Number(btn.dataset.idx));
    if (e.target?.dataset?.close === "true") close();
  });

  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

/* =========================
   Contact Form (mailto)
========================= */
$("#contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#fName").value.trim();
  const email = $("#fEmail").value.trim();
  const subject = $("#fSubject").value.trim();
  const message = $("#fMessage").value.trim();

  if (!name || !email || !message) {
    alert("Please fill Name, Email, and Message.");
    return;
  }

  const mailto = $("#contactEmail").getAttribute("href") || "mailto:";
  const fullSubject = encodeURIComponent(subject || "Portfolio Contact");
  const body = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
  );

  window.location.href = `${mailto}?subject=${fullSubject}&body=${body}`;
});

/* =========================
   Inline SVG icons
========================= */
function githubSVG(){
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.48 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.38-3.37-1.38-.46-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.36 1.11 2.94.85.09-.66.35-1.11.64-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.33.1-2.77 0 0 .84-.27 2.75 1.05.8-.23 1.66-.35 2.52-.35.86 0 1.72.12 2.52.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.44.2 2.51.1 2.77.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.96.68 1.94 0 1.4-.01 2.53-.01 2.87 0 .26.18.59.69.48A10.2 10.2 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" fill="rgba(234,242,238,.90)"/>
  </svg>`;
}
function linkedinSVG(){
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6.94 6.5A2.19 2.19 0 1 1 6.94 2.12a2.19 2.19 0 0 1 0 4.38ZM3.9 21.9h6.08V8.1H3.9v13.8ZM14 8.1h-3.9v13.8h6.08v-7.2c0-1.9.35-3.74 2.7-3.74 2.3 0 2.32 2.16 2.32 3.86v7.08H24v-8.26c0-4.06-.88-7.18-5.62-7.18-2.28 0-3.8 1.25-4.38 2.43h-.04V8.1Z" fill="rgba(234,242,238,.90)"/>
  </svg>`;
}
function facebookSVG(){
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5.03 3.66 9.2 8.44 9.98v-7.06H7.72v-2.92h2.58V9.84c0-2.55 1.52-3.96 3.86-3.96 1.12 0 2.3.2 2.3.2v2.52h-1.3c-1.28 0-1.68.8-1.68 1.62v1.95h2.86l-.46 2.92h-2.4v7.06c4.78-.78 8.44-4.95 8.44-9.98Z" fill="rgba(234,242,238,.90)"/>
  </svg>`;
}
function linkSVG(){
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10.59 13.41a1.996 1.996 0 0 1 0-2.82l3.18-3.18a2 2 0 1 1 2.83 2.82l-.88.88" stroke="rgba(234,242,238,.9)" stroke-width="2" stroke-linecap="round"/>
    <path d="M13.41 10.59a1.996 1.996 0 0 1 0 2.82l-3.18 3.18a2 2 0 1 1-2.83-2.82l.88-.88" stroke="rgba(234,242,238,.9)" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

loadData();