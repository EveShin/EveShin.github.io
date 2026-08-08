/* 공통 유틸 — index.js / entry.js 가 함께 사용 */

const DATA_URL = "data/timeline.json";

async function loadData() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error("timeline.json을 불러오지 못했습니다.");
  return res.json();
}

/** "2025-09" -> 2025 */
function yearOf(ym) {
  return parseInt(String(ym).slice(0, 4), 10);
}

/** "2025-09" -> 9 (없으면 1) */
function monthOf(ym) {
  const m = parseInt(String(ym).slice(5, 7), 10);
  return Number.isFinite(m) ? m : 1;
}

/** 항목을 최신순으로 정렬 (end 기준, 같으면 start 기준) */
function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.end !== b.end) return a.end < b.end ? 1 : -1;
    if (a.start !== b.start) return a.start < b.start ? 1 : -1;
    return 0;
  });
}

/** 프로필의 연락처를 헤더/푸터에 채워넣기 */
function applyProfileLinks(profile) {
  const mail = "mailto:" + profile.email;
  const set = (id, href, text) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.href = href;
    if (text !== undefined) el.textContent = text;
  };
  set("nav-email", mail);
  set("nav-github", profile.github);
  set("foot-email", mail, profile.email);
  set("foot-github", profile.github, profile.githubLabel || profile.github);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
