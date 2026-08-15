(async function () {
  initTheme();
  buildNav(null);

  const root = document.getElementById("detail");

  let data;
  try {
    data = await loadData();
  } catch (e) {
    showError(root);
    return;
  }

  const { profile, lanes, entries } = data;
  fillFooter(profile);

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const fromKey = params.get("from");

  const sorted = sortEntries(entries).filter((e) => !e.hidden);
  const e = sorted.find((x) => x.id === id);

  root.innerHTML = "";

  /* 돌아갈 곳: 링크에 실려 온 from 우선, 없으면 lane 기준 */
  let origin = ORIGIN[fromKey];
  if (!origin) {
    origin = e && e.lane === "research" ? ORIGIN.research
           : e && e.lane === "project" ? ORIGIN.projects
           : ORIGIN.timeline;
  }

  const back = el("a", "back", origin.label);
  back.href = origin.href;
  root.appendChild(back);

  if (!e) {
    root.appendChild(el("p", "msg", "해당 항목을 찾을 수 없습니다."));
    return;
  }

  const lane = lanes[e.lane] || { label: "" };
  document.title = e.title + " — Aeri Shin";

  const meta = el("div", "detail-meta");
  meta.appendChild(el("span", null, lane.label));
  meta.appendChild(el("span", null, e.dateLabel || e.start));
  (e.tags || []).forEach((t) => meta.appendChild(el("span", null, t)));
  root.appendChild(meta);

  const title = el("h1", "detail-title", e.title);
  root.appendChild(title);

  const head = [meta, title];
  if (e.titleSub) { const n = el("p", "detail-sub", e.titleSub); root.appendChild(n); head.push(n); }
  if (e.org) { const n = el("p", "detail-org", e.org); root.appendChild(n); head.push(n); }
  if (e.summary) { const n = el("p", "detail-lead", e.summary); root.appendChild(n); head.push(n); }
  stagger(head, 70, 40);

  const revealNodes = [];

  /* 대표 이미지 */
  if (e.hero && e.hero.src) {
    const shot = el("div", "hero-shot shot");
    const im = document.createElement("img");
    im.src = e.hero.src;
    im.alt = e.title;
    im.decoding = "async";
    shot.appendChild(im);
    root.appendChild(shot);
    revealNodes.push(shot);
  }

  (e.sections || []).forEach((s) => {
    const sec = el("section", "sec");
    sec.appendChild(el("h2", "sec-h", s.h));
    const body = el("div");
    body.innerHTML = s.body;
    sec.appendChild(body);
    root.appendChild(sec);
    revealNodes.push(sec);
  });

  /* 성과 */
  if (e.outcomes && e.outcomes.length) {
    const sec = el("section", "sec");
    sec.appendChild(el("h2", "sec-h", "Outcomes"));
    const ul = el("ul", "outcomes");
    e.outcomes.forEach((o) => {
      const li = el("li", "outcome");
      li.appendChild(el("span", "outcome-date", o.date));
      const right = el("div");
      right.appendChild(el("span", "outcome-label", o.label));
      if (o.org) right.appendChild(el("span", "outcome-org", o.org));
      if (o.url) {
        const a = el("a", "outcome-link", "원문 보기 ↗");
        a.href = o.url;
        a.target = "_blank";
        a.rel = "noopener";
        right.appendChild(a);
      }
      li.appendChild(right);
      ul.appendChild(li);
    });
    sec.appendChild(ul);
    root.appendChild(sec);
    revealNodes.push(sec);
  }

  /* 주관적 견해 */
  if (e.take) {
    const box = el("section", "take");
    box.appendChild(el("h2", "take-h", "돌아보며"));
    const body = el("div", "take-body");
    body.innerHTML = e.take;
    box.appendChild(body);
    root.appendChild(box);
    revealNodes.push(box);
  }

  if (e.links && e.links.length) {
    const box = el("div", "detail-links");
    e.links.forEach((l) => {
      const a = el("a", null, l.label + " ↗");
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener";
      box.appendChild(a);
    });
    root.appendChild(box);
    revealNodes.push(box);
  }

  /* 같은 레인 안에서 앞뒤 이동 — 출발지 정보를 그대로 물려줍니다 */
  const siblings = sorted.filter((x) => x.lane === e.lane && hasDetail(x));
  const i = siblings.findIndex((x) => x.id === e.id);
  const nav = el("div", "detail-nav");

  const mk = (item, label, align) => {
    const a = el("a");
    a.href = entryHref(item.id, fromKey);
    a.appendChild(el("span", null, label));
    a.appendChild(document.createTextNode(item.title));
    if (align) a.style.textAlign = align;
    return a;
  };

  nav.appendChild(i > 0 ? mk(siblings[i - 1], "Next", null) : el("span"));
  if (i > -1 && i < siblings.length - 1) nav.appendChild(mk(siblings[i + 1], "Previous", "right"));

  root.appendChild(nav);
  revealNodes.push(nav);

  revealOnScroll(revealNodes);
  markInvert(root);
  initLightbox(root);
})();
