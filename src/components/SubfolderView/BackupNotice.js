// Shared notification area for backup and channel-move feedback.
// One notice per Manage instance. Timers are cancelled on replacement and close.
function createManageBackupNotice(modal) {
  const notice = modal.querySelector('.ysm-backup-notice');
  const text = notice.querySelector('.ysm-backup-notice-text');
  const dismiss = notice.querySelector('button');
  let timer = null, fadeTimer = null;
  function clearTimers() {
    clearTimeout(timer); clearTimeout(fadeTimer);
    timer = null; fadeTimer = null;
  }
  function hide() {
    clearTimers(); notice.hidden = true; notice.classList.remove('is-fading');
  }
  function show(message, type = 'info', duration = 4000) {
    clearTimers();
    notice.classList.remove('is-fading');
    notice.dataset.type = type;
    text.textContent = message;
    text.title = message;
    notice.hidden = false;
    if (type === 'success') timer = setTimeout(() => {
      notice.classList.add('is-fading');
      fadeTimer = setTimeout(hide, 300);
    }, duration);
  }
  dismiss.addEventListener('click', hide);
  return { show, destroy: hide };
}
// Backup services can finish after Manage has closed. Keep the existing fallback.
function showFolderBackupMessage(message, type = 'info') {
  if (typeof activeManageView !== 'undefined' && activeManageView?.backupNotice) activeManageView.backupNotice.show(message, type);
  else showUserNotification(message, type);
}
window.showFolderBackupMessage = showFolderBackupMessage;
