/* 공통 — 모든 페이지가 사용 */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 테마: 시스템 → 밝게 → 어둡게 ---------- */

const THEME_KEY = "aeri-theme";
const THEME_ORDER = ["system", "light", "dark"];
const THEME_ICON = { system: "◐", light: "○", dark: "●" };
const THEME_NAME = { system: "시스템 설정", light: "밝게", dark: "어둡게" };

function readTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return THEME_ORDER.includes(v) ? v : "system";
  } catch (e) {
    return "system";
  }
}

function resolveTheme(pref) {
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(pref) {
  document.documentElement.dataset.theme = resolveTheme(pref);
  const btn = document.querySelector(".theme-btn");
  if (btn) {
    btn.textContent = THEME_ICON[pref];
    btn.setAttribute("aria-label", "테마: " + THEME_NAME[pref] + " (눌러서 변경)");
    btn.title = THEME_NAME[pref];
  }
}

function initTheme() {
  let pref = readTheme();
  applyTheme(pref);

  const btn = document.querySelector(".theme-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      pref = THEME_ORDER[(THEME_ORDER.indexOf(pref) + 1) % THEME_ORDER.length];
      try { localStorage.setItem(THEME_KEY, pref); } catch (e) {}
      applyTheme(pref);
    });
  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (pref === "system") applyTheme("system");
  });
}

/* ---------- 네비게이션 ---------- */

const TABS = [
  { href: "index.html", label: "Home", key: "home" },
  { href: "projects.html", label: "Projects", key: "projects" },
  { href: "research.html", label: "Research", key: "research" },
  { href: "timeline.html", label: "Timeline", key: "timeline" }
];

function buildNav(currentHref) {
  const nav = document.querySelector(".nav-tabs");
  if (!nav) return;
  TABS.forEach((t) => {
    const a = document.createElement("a");
    a.className = "nav-tab";
    a.href = t.href;
    a.textContent = t.label;
    if (t.href === currentHref) a.setAttribute("aria-current", "page");
    nav.appendChild(a);
  });
}

/* 상세 페이지에서 어디로 돌아갈지 — 링크에 실어 보낸 from 값을 사용 */
const ORIGIN = {
  home: { href: "index.html", label: "← Home" },
  projects: { href: "projects.html", label: "← Projects" },
  research: { href: "research.html", label: "← Research" },
  timeline: { href: "timeline.html", label: "← Timeline" }
};

function entryHref(id, from) {
  return "entry.html?id=" + encodeURIComponent(id) + (from ? "&from=" + from : "");
}

/* ---------- 데이터 ---------- */

async function loadData() {
  const res = await fetch("data/timeline.json");
  if (!res.ok) throw new Error("timeline.json을 불러오지 못했습니다.");
  return res.json();
}

function yearOf(ym) { return parseInt(String(ym).slice(0, 4), 10); }

function monthOf(ym) {
  const m = parseInt(String(ym).slice(5, 7), 10);
  return Number.isFinite(m) ? m : 1;
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.end !== b.end) return a.end < b.end ? 1 : -1;
    if (a.start !== b.start) return a.start < b.start ? 1 : -1;
    return 0;
  });
}

function hasDetail(e) { return Array.isArray(e.sections) && e.sections.length > 0; }

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}

const ICON = {
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6 9 6.5L21 6"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.7a10.3 10.3 0 0 0-3.26 20.07c.52.1.71-.22.71-.5v-1.9c-2.87.62-3.48-1.22-3.48-1.22-.47-1.2-1.15-1.52-1.15-1.52-.94-.64.07-.63.07-.63 1.04.07 1.58 1.07 1.58 1.07.92 1.58 2.42 1.13 3.01.86.09-.67.36-1.13.66-1.39-2.29-.26-4.7-1.15-4.7-5.1 0-1.13.4-2.05 1.06-2.77-.1-.26-.46-1.3.1-2.72 0 0 .87-.28 2.85 1.06a9.9 9.9 0 0 1 5.19 0c1.98-1.34 2.85-1.06 2.85-1.06.57 1.42.21 2.46.1 2.72.66.72 1.06 1.64 1.06 2.77 0 3.96-2.42 4.83-4.72 5.09.37.32.7.95.7 1.92v2.85c0 .28.19.61.72.5A10.3 10.3 0 0 0 12 1.7z"/></svg>'
};

function fillFooter(profile) {
  const box = document.querySelector(".foot");
  if (!box) return;
  const mail = el("a", null, profile.email);
  mail.href = "mailto:" + profile.email;
  const gh = el("a", null, profile.githubLabel || profile.github);
  gh.href = profile.github;
  gh.target = "_blank";
  gh.rel = "noopener";
  box.appendChild(mail);
  box.appendChild(el("span", "foot-sep", "·"));
  box.appendChild(gh);
}

function showError(container) {
  container.innerHTML = "";
  container.appendChild(
    el("p", "msg", "데이터를 불러오지 못했습니다. 로컬에서 보는 중이라면 서버가 필요합니다 — python -m http.server")
  );
}

/* ---------- 모션 ---------- */

function stagger(nodes, step = 90, delay = 60) {
  if (REDUCED) return;
  nodes.filter(Boolean).forEach((n, i) => {
    n.classList.add("lift");
    n.style.animationDelay = delay + i * step + "ms";
  });
}

function revealOnScroll(nodes) {
  const list = nodes.filter(Boolean);
  if (REDUCED || !("IntersectionObserver" in window)) {
    list.forEach((n) => n.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (items) => {
      items.forEach((i) => {
        if (i.isIntersecting) {
          i.target.classList.add("in");
          io.unobserve(i.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  list.forEach((n) => {
    n.classList.add("rise");
    io.observe(n);
  });
}

/* ---------- 라이트박스 ---------- */

function initLightbox(root) {
  const imgs = root.querySelectorAll(".fig img, .shot img");
  if (!imgs.length) return;

  const box = el("div", "lb");
  const big = document.createElement("img");
  box.appendChild(big);
  document.body.appendChild(box);

  const close = () => box.classList.remove("on");
  box.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  imgs.forEach((im) => {
    im.addEventListener("click", () => {
      big.src = im.src;
      big.alt = im.alt || "";
      if (im.dataset.invert === "1") big.dataset.invert = "1";
      else delete big.dataset.invert;
      box.classList.add("on");
    });
  });
}

/* 본문 HTML 안의 figure 이미지에 다크모드 반전 플래그를 붙입니다.
   반전이 어울리지 않는 사진·스크린샷은 파일명으로 걸러냅니다. */
const NO_INVERT = ["aivs-seg-psp", "aivs-seg-deeplab", "bada-mockup", "cv-voc-result", "anc-spectrogram", "paper-lapa", "paper-groot", "paper-dinowm", "luna-"];

function markInvert(root) {
  root.querySelectorAll(".fig img, .shot img").forEach((im) => {
    const src = im.getAttribute("src") || "";
    const skip = NO_INVERT.some((k) => src.includes(k));
    if (!skip) im.dataset.invert = "1";
    im.loading = "lazy";
    im.decoding = "async";
  });
}
