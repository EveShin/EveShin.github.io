(async function () {
  initTheme();
  buildNav("index.html");

  const root = document.getElementById("home");

  let data;
  try {
    data = await loadData();
  } catch (e) {
    showError(root);
    return;
  }

  const p = data.profile;
  const byId = new Map(data.entries.map((e) => [e.id, e]));
  fillFooter(p);

  root.innerHTML = "";

  /* ---------- hero ---------- */

  const hero = el("header", "hero");

  const h1 = el("h1", "hero-name");
  h1.appendChild(document.createTextNode(p.name));
  h1.appendChild(el("span", "hero-ko", p.nameKo));
  hero.appendChild(h1);

  const role = el("p", "hero-role", p.role);
  hero.appendChild(role);

  /* 사진 두 장 + 연락처를 가로 한 줄로 */
  const media = el("div", "media");
  const shots = el("div", "shots");

  /* 증명사진 — ViT 패치처럼 타일 단위로 드러남 */
  const COLS = 8;
  const ROWS = 10;
  const col = el("div", "shot-col");
  const photo = el("div", "photo");

  const img = document.createElement("img");
  img.src = p.photo;
  img.alt = p.photoAlt || p.name;
  img.decoding = "async";
  photo.appendChild(img);

  const grid = el("div", "photo-grid");
  const tiles = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const t = el("div", "tile");
    grid.appendChild(t);
    tiles.push(t);
  }
  photo.appendChild(grid);
  photo.appendChild(el("div", "photo-frame"));
  col.appendChild(photo);
  col.appendChild(el("div", "photo-cap", COLS + " × " + ROWS + " patches"));
  shots.appendChild(col);

  /* 일상 사진 */
  if (p.casual) {
    const cw = el("div", "casual");
    const ci = document.createElement("img");
    ci.src = p.casual;
    ci.alt = p.casualAlt || "";
    ci.loading = "lazy";
    ci.decoding = "async";
    cw.appendChild(ci);
    shots.appendChild(cw);
  }

  media.appendChild(shots);
  hero.appendChild(media);
  root.appendChild(hero);

  /* 타일을 무작위 순서로 걷어냄 */
  const revealTiles = () => {
    if (REDUCED) {
      tiles.forEach((t) => (t.style.opacity = "0"));
      return;
    }
    const order = tiles.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    order.forEach((idx, n) => {
      setTimeout(() => { tiles[idx].style.opacity = "0"; }, 260 + n * 11);
    });
  };

  if (img.complete) revealTiles();
  else img.addEventListener("load", revealTiles, { once: true });

  /* ---------- 소개 ---------- */

  const intro = el("div", "intro");
  (p.intro || []).forEach((t) => intro.appendChild(el("p", null, t)));

  const how = el("div", "how");
  (p.how || []).forEach((t) => how.appendChild(el("p", null, t)));
  intro.appendChild(how);

  root.appendChild(intro);
  stagger([h1, role, ...intro.querySelectorAll(":scope > p"), how], 80, 40);

  const blocks = [];

  /* ---------- 연락처 ---------- */

  const bcon = el("section", "block");
  bcon.appendChild(el("h2", "block-h", "Contact"));
  const contact = el("div", "contact");
  const mk = (href, icon, label, blank) => {
    const a = el("a");
    a.href = href;
    if (blank) { a.target = "_blank"; a.rel = "noopener"; }
    const span = document.createElement("span");
    span.innerHTML = icon;
    a.appendChild(span.firstChild);
    a.appendChild(el("span", "lbl", label));
    return a;
  };
  contact.appendChild(mk("mailto:" + p.email, ICON.mail, p.email, false));
  contact.appendChild(mk(p.github, ICON.github, p.githubLabel || p.github, true));
  bcon.appendChild(contact);
  root.appendChild(bcon);
  blocks.push(bcon);

  /* ---------- 관심 분야 ---------- */

  const bi = el("section", "block");
  bi.appendChild(el("h2", "block-h", "Research Interests"));
  const chips = el("div", "chips");
  (p.interests || []).forEach((t) => chips.appendChild(el("span", "chip", t)));
  bi.appendChild(chips);
  root.appendChild(bi);
  blocks.push(bi);

  /* ---------- 최근 ---------- */

  if (p.recent && p.recent.length) {
    const bc = el("section", "block");
    bc.appendChild(el("h2", "block-h", "Recent"));
    const ul = el("ul", "rowlist");
    p.recent.forEach((c) => {
      const target = byId.get(c.id);
      const li = el("li");
      const node = target && hasDetail(target) ? el("a", "row") : el("div", "row");
      if (node.tagName === "A") node.href = entryHref(c.id, "home");
      node.appendChild(el("span", "row-title", c.text));
      node.appendChild(el("span", "row-note", c.note || (target ? target.dateLabel : "")));
      li.appendChild(node);
      ul.appendChild(li);
    });
    bc.appendChild(ul);
    root.appendChild(bc);
    blocks.push(bc);
  }

  /* ---------- 논문 · 학회 ---------- */

  if (p.selected && p.selected.length) {
    const bs = el("section", "block");
    bs.appendChild(el("h2", "block-h", "Selected"));
    p.selected.forEach((s) => {
      const box = el("div", "pub");
      box.appendChild(el("span", "pub-title", s.label));
      if (s.venue) box.appendChild(el("span", "pub-venue", s.venue));
      if (s.note) box.appendChild(el("span", "pub-note", s.note));

      const links = el("div", "pub-links");
      if (s.url) {
        const a = el("a", null, "원문 보기 ↗");
        a.href = s.url;
        a.target = "_blank";
        a.rel = "noopener";
        links.appendChild(a);
      }
      if (s.id && byId.get(s.id) && hasDetail(byId.get(s.id))) {
        const a = el("a", null, "프로젝트 →");
        a.href = entryHref(s.id, "home");
        links.appendChild(a);
      }
      if (links.childNodes.length) box.appendChild(links);

      bs.appendChild(box);
    });
    root.appendChild(bs);
    blocks.push(bs);
  }

  revealOnScroll(blocks);
})();
