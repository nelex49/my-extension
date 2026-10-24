// Shared lifecycle for compact folder forms. Edit forms may be anchored beside a Manage three-dot button.
function openFolderDialog(kind, html, anchor = null, placement = 'beside', canClose = () => true, onClosed = () => {}) {
  const previousFocus = document.activeElement;
  const modal = document.createElement('div');
  modal.className = `ytsm-folder-dialog ytsm-${kind}-dialog${anchor ? ' is-anchored' : ''}`;
  modal.innerHTML = html;
  const panel = modal.firstElementChild;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'ytsm-folder-dialog-title');
  document.body.appendChild(modal);
  let closed = false;
  function position() {
    if (!anchor?.isConnected) return;
    const rect = anchor.getBoundingClientRect(), bounds = panel.getBoundingClientRect();
    if (placement === 'origin') {
      panel.style.left = `${Math.max(12, Math.min(rect.left + 2, window.innerWidth - bounds.width - 12))}px`;
      panel.style.top = `${Math.max(12, Math.min(rect.top + 2, window.innerHeight - bounds.height - 12))}px`;
      return;
    }
    const left = Math.max(12, Math.min(rect.right + 8, window.innerWidth - bounds.width - 12));
    const fallbackLeft = Math.max(12, rect.left - bounds.width - 8);
    panel.style.left = `${left + bounds.width > window.innerWidth - 12 ? fallbackLeft : left}px`;
    panel.style.top = `${Math.max(12, Math.min(rect.top, window.innerHeight - bounds.height - 12))}px`;
  }
  function close() {
    if (closed || !canClose()) return; closed = true;
    document.removeEventListener('keydown', keydown); window.removeEventListener?.('resize', position);
    modal.remove(); onClosed(); if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }
  function keydown(event) { if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); } }
  document.addEventListener('keydown', keydown); window.addEventListener?.('resize', position);
  modal.addEventListener('pointerdown', event => { if (event.target === modal) close(); });
  modal.addEventListener('click', event => { if (event.target.closest('[data-dialog-close]')) close(); });
  position(); modal.querySelector('#ytsm-folder-name')?.focus();
  return { modal, close, position };
}
