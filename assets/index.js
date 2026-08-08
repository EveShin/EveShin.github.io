(async function () {
  let data;
  try {
    data = await loadData();
  } catch (err) {
    document.getElementById("timeline").textContent =
      "데이터를 불러오지 못했습니다. 로컬에서 열었다면 간단한 서버가 필요합니다: python3 -m http.server";
    return;
  }

  const { profile, lanes, entries } = data;

  applyProfileLinks(profile);
  document.getElementById("hero-tagline").textContent = profile.tagline;
  document.getElementById("hero-intro").textContent = profile.intro;

  const sorted = sortEntries(entries);
  const laneKeys = Object.keys(lanes);

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

  /* ---------- 롤아웃 스트립 ---------- */

  const allYears = [];
  let minY = Infinity;
  let maxY = -Infinity;
  sorted.forEach((e) => {
    minY = Math.min(minY, yearOf(e.start));
    maxY = Math.max(maxY, yearOf(e.end));
  });
  for (let y = minY; y <= maxY; y++) allYears.push(y);

  const strip = document.getElementById("rollout-strip");
  const frames = new Map();

  allYears.forEach((y, i) => {
    if (i > 0) strip.appendChild(el("span", "rollout-arrow", "▸"));

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
          bar.style.background = lanes[key].color;
          bar.title = e.title;
          row.appendChild(bar);
        });
      box.appendChild(row);
    });

    btn.appendChild(box);
    btn.appendChild(el("div", "rf-year", String(y)));
    btn.addEventListener("click", () => {
      const target = document.getElementById("y-" + y);
      if (target) target.scrollIntoView({ block: "start" });
    });

    strip.appendChild(btn);
    frames.set(y, btn);
  });

  /* 범례 */
  const legend = document.getElementById("rollout-legend");
  laneKeys.forEach((key) => {
    const item = el("span", "lg");
    const sw = el("span", "lg-swatch");
    sw.style.background = lanes[key].color;
    item.appendChild(sw);
    item.appendChild(el("span", null, lanes[key].labelKo));
    legend.appendChild(item);
  });

  /* ---------- 세로 타임라인 ---------- */

  const tl = document.getElementById("timeline");

  years.forEach((y) => {
    const block = el("section", "yr");
    block.id = "y-" + y;
    block.dataset.year = String(y);

    block.appendChild(el("h2", "yr-label", String(y)));

    const list = el("div", "yr-items");

    byYear.get(y).forEach((e) => {
      const lane = lanes[e.lane] || { labelKo: "", color: "#999" };
      const art = el("article", "ent");

      const dot = el("span", "ent-dot");
      dot.style.background = lane.color;
      art.appendChild(dot);

      const meta = el("div", "ent-meta");
      meta.appendChild(el("span", null, e.dateLabel || e.start));
      const laneTag = el("span", "ent-lane", lane.labelKo);
      laneTag.style.color = lane.color;
      meta.appendChild(laneTag);
      art.appendChild(meta);

      const h3 = el("h3", "ent-title");
      const hasDetail = Array.isArray(e.sections) && e.sections.length > 0;
      if (hasDetail) {
        const a = el("a", null, e.title);
        a.href = "entry.html?id=" + encodeURIComponent(e.id);
        h3.appendChild(a);
      } else {
        h3.appendChild(document.createTextNode(e.title));
      }
      if (e.titleSub) h3.appendChild(el("span", "ent-sub", e.titleSub));
      art.appendChild(h3);

      if (e.org) art.appendChild(el("p", "ent-org", e.org));
      if (e.summary) art.appendChild(el("p", "ent-sum", e.summary));

      const foot = el("div", "ent-foot");
      (e.tags || []).forEach((t) => foot.appendChild(el("span", "tag", t)));
      if (hasDetail) {
        const more = el("a", "more", "자세히 →");
        more.href = "entry.html?id=" + encodeURIComponent(e.id);
        more.style.color = lane.color;
        foot.appendChild(more);
      }
      if (foot.childNodes.length) art.appendChild(foot);

      list.appendChild(art);
    });

    block.appendChild(list);
    tl.appendChild(block);
  });

  /* ---------- 스크롤 위치를 스트립에 반영 ---------- */

  const setActive = (y) => {
    frames.forEach((btn, key) => btn.classList.toggle("rf-active", key === y));
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (items) => {
        const visible = items
          .filter((i) => i.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(parseInt(visible.target.dataset.year, 10));
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    document.querySelectorAll(".yr").forEach((n) => io.observe(n));
  }

  setActive(maxY);
})();
