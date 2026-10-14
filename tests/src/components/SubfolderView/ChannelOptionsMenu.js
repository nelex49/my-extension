// Channel action popup; data mutations remain in services.
function createChannelOptionsMenu({ modal, state, closeMovePicker }) {
  function closeChannelMenu(restoreFocus = false) {
    const anchor = Array.from(modal.querySelectorAll('[data-action="channel-options"]')).find(button => button.closest('[data-channel]')?.dataset.channel === state.optionsChannel);
    state.optionsChannel = null;
    modal.querySelector('.ysm-channel-menu').hidden = true;
    anchor?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) anchor?.focus({ preventScroll: true });
  }
  function showChannelMenu(button) {
    const id = button.closest('[data-channel]')?.dataset.channel;
    if (!id) return;
    if (state.optionsChannel === id) { closeChannelMenu(true); return; }
    closeChannelMenu(); closeMovePicker();
    state.optionsChannel = id;
    const menu = modal.querySelector('.ysm-channel-menu');
    const channel = (window.userSubscriptions || []).find(sub => manageChannelId(sub) === id);
    const href = /^[A-Za-z0-9_-]+$/.test(id) ? `https://www.youtube.com/channel/${id}` : null;
    menu.innerHTML = `<button type="button" data-action="channel-open" ${href ? '' : 'disabled'}>↗ &nbsp; Open on YouTube</button><div class="ysm-channel-menu-divider"></div><button type="button" disabled title="Unsubscribe will be available in a future update">Unsubscribe <small>Coming soon</small></button>`;
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    const rect = button.getBoundingClientRect();
    const bounds = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(rect.right - bounds.width, window.innerWidth - bounds.width - 12))}px`;
    menu.style.top = `${Math.max(12, Math.min(rect.bottom + bounds.height + 6 <= window.innerHeight - 12 ? rect.bottom + 6 : rect.top - bounds.height - 6, window.innerHeight - bounds.height - 12))}px`;
  }

  return { closeChannelMenu, showChannelMenu };
}
