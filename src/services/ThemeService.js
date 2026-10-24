// Browser-profile preference, independent of account data, plans and backups.
const ThemeService = (() => {
  const key = 'subscriptionTheme';
  let current = 'dark', saving = false, revision = 0;
  function normalize(value) { return value === 'light' ? 'light' : 'dark'; }
  function apply(value) {
    current = normalize(value);
    document.documentElement?.setAttribute('data-ytsm-theme', current);
  }
  async function initialize() {
    const started = revision;
    try {
      const data = await chrome.storage.local.get(key);
      if (started === revision) apply(data[key]);
    } catch (_) { if (started === revision) apply('dark'); }
  }
  async function select(value) {
    if (saving) return false;
    saving = true; revision++;
    try {
      const next = normalize(value);
      await chrome.storage.local.set({ [key]: next });
      apply(next);
      return true;
    } catch (_) { return false; }
    finally { saving = false; }
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[key]) { revision++; apply(changes[key].newValue); }
  });
  apply('dark');
  const ready = initialize();
  return Object.freeze({ key, ready, select, get current() { return current; } });
})();
globalThis.ThemeService = ThemeService;
