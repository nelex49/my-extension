// Original, bundled outline drawings. Persist only stable IDs, never uploaded markup.
(() => {
  const entries = [
    ['folder', 'Default folder', '<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>'],
    ['music', 'Music', '<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="17" cy="16" rx="3" ry="3"/>'],
    ['gaming', 'Gaming', '<path d="M7 7h10c3 0 4 3 4 6l-1 5c-1 2-3 1-5-2H9c-2 3-4 4-5 2l-1-5c0-3 1-6 4-6Z"/><path d="M6 11h4m-2-2v4M16 11h.01M18 13h.01"/>'],
    ['coding', 'Coding', '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>'],
    ['learning', 'Learning', '<path d="m2 8 10-5 10 5-10 5L2 8Zm4 2v7c4 3 8 3 12 0v-7M22 8v8"/>'],
    ['news', 'News', '<path d="M4 3h16v18H4V3Z"/><path d="M7 6h10M7 10h4v4H7v-4Zm7 0h3m-3 4h3M7 18h10"/>'],
    ['film', 'Film', '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4m-4 8h4m10-8h4m-4 8h4M7 12h10"/>'],
    ['cooking', 'Cooking', '<path d="M7 15a5 5 0 0 1-2-9 4 4 0 0 1 7-2 4 4 0 0 1 7 2 5 5 0 0 1-2 9v6H7v-6Zm0 2h10"/>'],
    ['fitness', 'Fitness', '<path d="M6 7v10M3 9v6m15-8v10m3-8v6M6 12h12M3 12h3m12 0h3"/>'],
    ['travel', 'Travel', '<rect x="5" y="7" width="14" height="14" rx="2"/><path d="M9 7V3h6v4M9 7v14M15 7v14"/>']
  ].map(([id, label, paths]) => Object.freeze({id, label, paths}));
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const normalise = id => byId.has(id) ? id : 'folder';
  function svg(id, className = '') {
    const entry = byId.get(normalise(id));
    const safeClass = String(className).replace(/[^a-zA-Z0-9_ -]/g, '');
    return `<svg class="${safeClass}" data-folder-icon="${entry.id}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${entry.paths}</svg>`;
  }
  globalThis.FolderIcons = Object.freeze({ entries: Object.freeze(entries), normalise, has: id => byId.has(id),
    label: id => byId.get(normalise(id)).label, paths: id => byId.get(normalise(id)).paths, svg });
})();
