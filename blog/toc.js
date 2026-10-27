/* Table of contents for the blog posts. Builds the list from the h2 and h3
   headings in .post-body, marks the section being read as the page scrolls,
   and on narrow screens (where the list sits above the text) keeps it
   collapsed until tapped. The breakpoint must match blog.css. */
(() => {
  const toc = document.querySelector('details.toc');
  const body = document.querySelector('.post-body');
  if (!toc || !body) return;
  const list = toc.querySelector('.toc-list');
  const headings = Array.from(body.querySelectorAll('h2, h3'))
    .filter((h) => !h.closest('.footnotes'));
  if (!list || headings.length === 0) return;

  // Label: a data-toc attribute if present, else the heading text, with the
  // section number (span.secno) separated from the title by a space.
  const label = (h) => {
    if (h.dataset.toc) return h.dataset.toc;
    const clone = h.cloneNode(true);
    const no = clone.querySelector('.secno');
    if (no) no.remove();
    const text = clone.textContent.replace(/\s+/g, ' ').trim();
    return no ? `${no.textContent.trim()} ${text}` : text;
  };
  const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const entries = [];
  let lastTop = null;
  headings.forEach((h) => {
    if (!h.id) h.id = slugify(h.textContent);
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${h.id}`;
    a.textContent = label(h);
    li.appendChild(a);
    if (h.tagName === 'H2' || !lastTop) {
      list.appendChild(li);
      lastTop = li;
    } else {
      let sub = lastTop.querySelector('ul');
      if (!sub) {
        sub = document.createElement('ul');
        lastTop.appendChild(sub);
      }
      sub.appendChild(li);
    }
    entries.push({ h, a });
  });

  // The section being read is the last heading at or above the line where
  // anchor navigation places headings (scroll-padding plus scroll-margin),
  // so that clicking an entry always makes that entry the active one.
  const px = (v) => parseFloat(v) || 0;
  const line = () => px(getComputedStyle(document.documentElement).scrollPaddingTop)
    + px(getComputedStyle(entries[0].h).scrollMarginTop) + 4;
  let active = null;
  const update = () => {
    const y = line();
    let current = null;
    for (const e of entries) {
      if (e.h.getBoundingClientRect().top <= y) current = e;
      else break;
    }
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) current = entries[entries.length - 1];
    if (current === active) return;
    if (active) {
      active.a.classList.remove('is-active');
      active.a.removeAttribute('aria-current');
    }
    active = current;
    if (!active) return;
    active.a.classList.add('is-active');
    active.a.setAttribute('aria-current', 'location');
    // Keep the active entry visible when the list itself has to scroll.
    const box = toc.getBoundingClientRect();
    const link = active.a.getBoundingClientRect();
    if (link.top < box.top) toc.scrollTop -= box.top - link.top;
    else if (link.bottom > box.bottom) toc.scrollTop += link.bottom - box.bottom;
  };
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('load', schedule);

  // Wide screens: always open, as a sidebar. Narrow screens: a collapsible
  // box under the post header, closed by default and closed again after a tap.
  const wide = matchMedia('(min-width: 1000px)');
  const sync = () => { toc.open = wide.matches; };
  wide.addEventListener('change', sync);
  toc.addEventListener('toggle', () => { if (wide.matches && !toc.open) toc.open = true; });
  list.addEventListener('click', (e) => { if (!wide.matches && e.target.closest('a')) toc.open = false; });
  sync();
  update();
  toc.classList.add('is-ready');
})();
