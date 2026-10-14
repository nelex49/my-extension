// One owner for folder-dialog focus, dragging and listener cleanup.
function openFolderDialog(kind, html) {
  const previousFocus = document.activeElement;
  const modal = document.createElement('div');
  modal.className = `ytsm-folder-dialog ytsm-${kind}-dialog`;
  modal.innerHTML = html;
  const panel = modal.firstElementChild;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'ytsm-folder-dialog-title');
  document.body.appendChild(modal);
  const header = modal.querySelector('.ytsm-dialog-header');
  let drag = null, closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('mousemove', mousemove);
    document.removeEventListener('mouseup', mouseup);
    document.removeEventListener('keydown', keydown);
    modal.remove();
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }
  function mousedown(event) {
    if (event.button !== 0 || event.target.closest('button, input, select')) return;
    const rect = panel.getBoundingClientRect();
    drag = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    panel.style.position = 'absolute';
    panel.style.left = `${rect.left}px`; panel.style.top = `${rect.top}px`;
    header.classList.add('is-dragging');
    event.preventDefault();
  }
  function mousemove(event) {
    if (!drag) return;
    event.preventDefault();
    panel.style.left = `${drag.left + event.clientX - drag.x}px`;
    panel.style.top = `${drag.top + event.clientY - drag.y}px`;
  }
  function mouseup() { drag = null; header.classList.remove('is-dragging'); }
  function keydown(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); return; }
    if (event.key !== 'Tab') return;
    const controls = Array.from(panel.querySelectorAll('button:not([disabled]), input, select'))
      .filter(element => element.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  header.addEventListener('mousedown', mousedown);
  document.addEventListener('mousemove', mousemove);
  document.addEventListener('mouseup', mouseup);
  document.addEventListener('keydown', keydown);
  modal.addEventListener('click', event => {
    if (event.target === modal || event.target.closest('[data-dialog-close]')) close();
  });
  modal.querySelector('input')?.focus();
  return { modal, close };
}
