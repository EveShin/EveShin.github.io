(async function () {
  initTheme();
  buildNav("timeline.html");

  const root = document.getElementById("tlpage");

  let data;
  try {
    data = await loadData();
  } catch (e) {
    showError(root);
    return;
  }

  const { profile, lanes, entries } = data;
  fillFooter(profile);

  const sorted = sortEntries(entries).filter((e) => !e.hidden);
  const laneKeys = Object.keys(lanes);

  root.innerHTML = "";

  const eyebrow = el("p", "eyebrow", "2020 → now");
  const title = el("h1", "page-title", "Timeline");
  const lede = el("p", "page-lede", "주요 활동 타임라인");
  root.appendChild(eyebrow);
  root.appendChild(title);
  root.appendChild(lede);
  stagger([eyebrow, title, lede], 80, 40);

  /* ---------- 연도 그룹 ---------- */

  const years = [];
  const byYear = new Map();
  sorted.forEach((e) => {
    const y = yearOf(e.end);
    if (!byYear.has(y)) {
      byYear.set(y, []);
      years.push(y);
    }
    byYear.get(y).push(e);
  });

  let minY = Infinity;
  let maxY = -Infinity;
  sorted.forEach((e) => {
    minY = Math.min(minY, yearOf(e.start));
    maxY = Math.max(maxY, yearOf(e.end));
  });

  /* ---------- 롤아웃 스트립 ---------- */

  const rollout = el("section", "rollout");
  rollout.setAttribute("aria-label", "연도별 개요");

  const rhead = el("div", "rollout-head");
  rhead.appendChild(el("span", null, "start"));
  rhead.appendChild(el("span", null, "now"));
  rollout.appendChild(rhead);

  const strip = el("div", "rollout-strip");
  const frames = new Map();
  let barIndex = 0;

  for (let y = minY; y <= maxY; y++) {
    if (y > minY) strip.appendChild(el("span", "rollout-arrow", "▸"));

    const btn = el("button", "rf" + (y === maxY ? " rf-goal" : ""));
    btn.type = "button";
    btn.setAttribute("aria-label", y + "년으로 이동");

    const box = el("div", "rf-box");

    laneKeys.forEach((key) => {
      const row = el("div", "rf-lane");
      sorted
        .filter((e) => e.lane === key && yearOf(e.start) <= y && yearOf(e.end) >= y)
        .forEach((e) => {
          const s = yearOf(e.start) === y ? monthOf(e.start) : 1;
          const en = yearOf(e.end) === y ? monthOf(e.end) : 12;
          const bar = el("div", "rf-bar");
          bar.style.left = ((s - 1) / 12) * 100 + "%";
          bar.style.width = Math.max((en - s + 1) / 12, 1 / 12) * 100 + "%";
          bar.style.opacity = lanes[key].tone;
          bar.style.animationDelay = 200 + barIndex * 22 + "ms";
          barIndex++;
          bar.title = e.title;
          row.appendChild(bar);
        });
      box.appendChild(row);
    });

    btn.appendChild(box);
    btn.appendChild(el("div", "rf-year", String(y)));

    const targetYear = y;
    btn.addEventListener("click", () => {
      const node = document.getElementById("y-" + targetYear);
      if (node) node.scrollIntoView({ block: "start" });
    });

    strip.appendChild(btn);
    frames.set(y, btn);
  }

  rollout.appendChild(strip);

  const legend = el("div", "legend");
  laneKeys.forEach((key) => {
    const item = el("span", "lg");
    const sw = el("span", "lg-swatch");
    sw.style.opacity = lanes[key].tone;
    item.appendChild(sw);
    item.appendChild(el("span", null, lanes[key].label));
    legend.appendChild(item);
  });
  rollout.appendChild(legend);

  root.appendChild(rollout);

  /* ---------- 세로 타임라인 ---------- */

  const revealNodes = [];

  years.forEach((y) => {
    const block = el("section", "yr");
    block.id = "y-" + y;
    block.dataset.year = String(y);
    block.appendChild(el("h2", "yr-label", String(y)));

    const list = el("div", "yr-items");

    byYear.get(y).forEach((e) => {
      const lane = lanes[e.lane] || { label: "", tone: 0.5 };
      const art = el("article", "ent");

      const dot = el("span", "ent-dot");
      dot.style.opacity = lane.tone;
      art.appendChild(dot);

      const meta = el("div", "ent-meta");
      meta.appendChild(el("span", null, e.dateLabel || e.start));
      meta.appendChild(el("span", "ent-lane", lane.label));
      art.appendChild(meta);

      const h3 = el("h3", "ent-title");
      if (hasDetail(e)) {
        const a = el("a", null, e.title);
        a.href = entryHref(e.id, "timeline");
        h3.appendChild(a);
      } else {
        h3.appendChild(document.createTextNode(e.title));
      }
      if (e.titleSub) h3.appendChild(el("span", "ent-sub", e.titleSub));
      art.appendChild(h3);

      if (e.org) art.appendChild(el("p", "ent-org", e.org));
      if (e.summary) art.appendChild(el("p", "ent-sum", e.summary));

      const foot = el("div", "ent-foot");
      (e.outcomes || []).forEach((o) => foot.appendChild(el("span", "tag tag-out", o.label)));
      (e.tags || []).forEach((t) => foot.appendChild(el("span", "tag", t)));
      if (foot.childNodes.length) art.appendChild(foot);

      list.appendChild(art);
      revealNodes.push(art);
    });

    block.appendChild(list);
    root.appendChild(block);
  });

  revealOnScroll(revealNodes);

  /* ---------- 스크롤 위치를 스트립에 반영 ---------- */

  const setActive = (y) => {
    frames.forEach((btn, key) => btn.classList.toggle("rf-active", key === y));
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (items) => {
        const top = items
          .filter((i) => i.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (top) setActive(parseInt(top.target.dataset.year, 10));
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    root.querySelectorAll(".yr").forEach((n) => io.observe(n));
  }

  setActive(maxY);
})();
