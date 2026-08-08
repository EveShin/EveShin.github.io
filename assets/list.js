/* Projects / Research 공용. 보여줄 레인은 main[data-lane]에서 읽습니다. */

async function renderList(currentHref, originKey) {
  initTheme();
  buildNav(currentHref);

  const root = document.getElementById("list");
  const laneKey = root.dataset.lane;

  let data;
  try {
    data = await loadData();
  } catch (e) {
    showError(root);
    return;
  }

  fillFooter(data.profile);

  const items = sortEntries(data.entries).filter((e) => e.lane === laneKey);

  root.innerHTML = "";

  const eyebrow = el("p", "eyebrow", root.dataset.eyebrow);
  const title = el("h1", "page-title", root.dataset.title);
  const lede = el("p", "page-lede", root.dataset.lede);
  root.appendChild(eyebrow);
  root.appendChild(title);
  root.appendChild(lede);
  stagger([eyebrow, title, lede], 80, 40);

  const cards = el("div", "cards");
  const nodes = [];

  items.forEach((e) => {
    const card = el(hasDetail(e) ? "a" : "div", "card");
    if (hasDetail(e)) card.href = entryHref(e.id, originKey);

    const meta = el("div", "card-meta");
    meta.appendChild(el("span", null, e.dateLabel || e.start));
    if (e.outcomes && e.outcomes.length) meta.appendChild(el("span", null, "Outcomes " + e.outcomes.length));
    card.appendChild(meta);

    const h2 = el("h2", "card-title");
    h2.appendChild(document.createTextNode(e.title));
    if (e.titleSub) h2.appendChild(el("span", "card-sub", e.titleSub));
    card.appendChild(h2);

    if (e.org) card.appendChild(el("p", "card-org", e.org));
    if (e.summary) card.appendChild(el("p", "card-sum", e.summary));
    if (e.papers && e.papers.length) card.appendChild(el("p", "papers", "PAPER — " + e.papers.join(" · ")));

    const foot = el("div", "card-foot");
    (e.outcomes || []).forEach((o) => foot.appendChild(el("span", "tag tag-out", o.label)));
    (e.tags || []).forEach((t) => foot.appendChild(el("span", "tag", t)));
    if (foot.childNodes.length) card.appendChild(foot);

    cards.appendChild(card);
    nodes.push(card);
  });

  if (!items.length) cards.appendChild(el("p", "msg", "아직 항목이 없습니다."));

  root.appendChild(cards);
  revealOnScroll(nodes);
}
