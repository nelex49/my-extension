// Parent tabs, overflow search and press/hold scrolling.
function createParentFolderNavigation({ modal, state }) {
  function renderParentOverflow() {
    const search = modal.querySelector('.ysm-parent-search');
    const list = modal.querySelector('.ysm-parent-results');
    if (!search || !list) return;
    const needle = search.value.trim().toLowerCase();
    const data = window.folderData || {};
    list.innerHTML = Object.keys(data).filter(name => name.toLowerCase().includes(needle)).map((name, index) =>
      `<div class="ysm-parent-item ysm-parent-overflow-item"><button type="button" data-parent="${manageEscape(name)}" class="ysm-tab ${name === state.parent ? 'is-active' : ''}" title="${manageEscape(name)}" style="--tab-colour:${sidebarFolderColour(data[name].color, index)};color:${folderTextColour(data[name].color)}">${manageParentLabel(name, data[name])}</button><button type="button" class="ysm-folder-more" data-action="edit-parent" data-edit-parent="${manageEscape(name)}" aria-label="Edit ${manageEscape(name)}">•••</button></div>`).join('') ||
      '<p class="ysm-empty">No matching parent folders.</p>';
  }

  function updateParentArrows() {
    const strip = modal.querySelector('.ysm-visible-parents');
    if (!strip) return;
    const max = Math.max(0, strip.scrollWidth - strip.clientWidth);
    modal.querySelector('[data-action="parent-prev"]').disabled = strip.scrollLeft <= 1;
    modal.querySelector('[data-action="parent-next"]').disabled = strip.scrollLeft >= max - 1;
  }
  function stepParent(direction) {
    if (state.arrowHold.suppressClick) return;
    const strip = modal.querySelector('.ysm-visible-parents');
    const items = Array.from(strip.querySelectorAll('.ysm-parent-item'));
    const current = strip.scrollLeft;
    const max = Math.max(0, strip.scrollWidth - strip.clientWidth);
    // Use strip-relative coordinates. offsetLeft is relative to an offsetParent,
    // which can be the outer modal rather than the scrolling strip.
    const stripRect = strip.getBoundingClientRect();
    const bounds = items.map(item => {
      const rect = item.getBoundingClientRect();
      const left = rect.left - stripRect.left + current;
      return { left, right: left + rect.width };
    });
    let destination;
    if (direction > 0) {
      const next = bounds.find(item => item.right > current + strip.clientWidth + 1);
      destination = next ? next.right - strip.clientWidth : max;
    } else {
      const previous = bounds.slice().reverse().find(item => item.left < current - 1);
      destination = previous ? previous.left : 0;
    }
    strip.scrollTo({ left: Math.max(0, Math.min(max, destination)), behavior: 'smooth' });
  }
  // A short press advances one folder. Holding an arrow starts continuous
  // scrolling, accelerates gently, and stops on release or at either end.
  function stopArrowHold() {
    if (state.arrowHold.timer !== null) clearTimeout(state.arrowHold.timer);
    if (state.arrowHold.interval !== null) clearInterval(state.arrowHold.interval);
    state.arrowHold.timer = null; state.arrowHold.interval = null;
  }
  function startArrowHold(event) {
    const direction = event.currentTarget.dataset.action === 'parent-prev' ? -1 : 1;
    stopArrowHold(); state.arrowHold.started = false; state.arrowHold.suppressClick = false;
    state.arrowHold.timer = setTimeout(() => {
      state.arrowHold.started = true; state.arrowHold.suppressClick = true;
      const strip = modal.querySelector('.ysm-visible-parents');
      const startedAt = Date.now();
      state.arrowHold.interval = setInterval(() => {
        const max = Math.max(0, strip.scrollWidth - strip.clientWidth);
        const amount = Math.min(28, 7 + (Date.now() - startedAt) / 120);
        strip.scrollLeft = Math.max(0, Math.min(max, strip.scrollLeft + direction * amount));
        updateParentArrows();
        if ((direction < 0 && strip.scrollLeft <= 1) || (direction > 0 && strip.scrollLeft >= max - 1)) stopArrowHold();
      }, 25);
    }, 350);
  }
  for (const arrow of modal.querySelectorAll('.ysm-parent-arrow')) {
    arrow.addEventListener('pointerdown', startArrowHold);
    arrow.addEventListener('pointerup', stopArrowHold);
    arrow.addEventListener('pointercancel', stopArrowHold);
    arrow.addEventListener('lostpointercapture', stopArrowHold);
    arrow.addEventListener('click', event => {
      if (state.arrowHold.suppressClick) { event.stopPropagation(); state.arrowHold.suppressClick = false; }
    }, true);
  }
  document.addEventListener('pointerup', stopArrowHold);
  function fitParentTabs() {
    // Every parent stays in the strip. Horizontal scrolling replaces hidden-tab eviction.
    const strip = modal.querySelector('.ysm-visible-parents');
    if (!strip) return;
    strip.querySelectorAll('.ysm-parent-item').forEach(item => { item.hidden = false; });
    updateParentArrows();
  }
  const parentTabsResize = new ResizeObserver(fitParentTabs);
  modal.querySelector('.ysm-visible-parents').addEventListener('scroll', updateParentArrows);
  function render() {
    const data = window.folderData || {}, names = Object.keys(data);
    const tab = name => `<div class="ysm-parent-item" data-parent-item="${manageEscape(name)}"><button type="button" data-parent="${manageEscape(name)}" class="ysm-tab ${name === state.parent ? 'is-active' : ''}" aria-pressed="${name === state.parent}" title="${manageEscape(name)}" style="--tab-colour:${sidebarFolderColour(data[name].color, names.indexOf(name))};color:${folderTextColour(data[name].color)}">${manageParentLabel(name, data[name])}</button><button type="button" class="ysm-folder-more" data-action="edit-parent" data-edit-parent="${manageEscape(name)}" aria-label="Edit ${manageEscape(name)}">•••</button></div>`;
    const uncategorisedButton = modal.querySelector(".ysm-uncategorised");
    uncategorisedButton.classList.toggle("is-active", state.parent === null);
    uncategorisedButton.setAttribute("aria-pressed", String(state.parent === null));
    uncategorisedButton.querySelector("span").textContent = manageUncategorised().length;
    const previousStripScroll = modal.querySelector(".ysm-visible-parents")?.scrollLeft || 0;
    modal.querySelector(".ysm-visible-parents").innerHTML = names.map(tab).join('');
    modal.querySelector(".ysm-all-folders-slot").innerHTML = `<details class="ysm-more-parents"><summary title="Search all parent folders">All Folders (${names.length}) ▾</summary><div class="ysm-menu"><input type="search" class="ysm-parent-search" aria-label="Find parent folder" placeholder="Find parent folder..."><div class="ysm-parent-results"></div></div></details>`;
    modal.querySelector(".ysm-visible-parents").scrollLeft = previousStripScroll;
    updateParentArrows();
    const parentSearch = modal.querySelector('.ysm-parent-search');
    if (parentSearch) {
      parentSearch.addEventListener('input', () => { state.parentListScroll = 0; renderParentOverflow(); });
      const parentResults = modal.querySelector('.ysm-parent-results');
      parentResults.addEventListener('scroll', () => { state.parentListScroll = parentResults.scrollTop; });
      const overflow = modal.querySelector('.ysm-more-parents');
      overflow.addEventListener('toggle', () => {
        if (overflow.open) parentResults.scrollTop = state.parentListScroll;
      });
      renderParentOverflow();
    }
  }
  function afterRender() {
    fitParentTabs(); stopArrowHold();
    document.removeEventListener('pointerup', stopArrowHold);
    parentTabsResize.disconnect();
    parentTabsResize.observe(modal.querySelector('.ysm-visible-parents'));
  }
  function destroy() {
    stopArrowHold(); document.removeEventListener('pointerup', stopArrowHold);
    parentTabsResize.disconnect();
  }
  return { render, afterRender, destroy, stepParent };
}
