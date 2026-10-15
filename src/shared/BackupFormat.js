// Versioned, portable folder backups. Never export credentials or subscription cache.
(() => {
  const MAX_BYTES = 8 * 1024 * 1024;
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  function check(value, message) { if (!value) throw new Error(message); }
  function cleanFolders(data) {
    check(object(data), 'The backup does not contain a valid folder setup.');
    const output = {};
    function record(value, parent) {
      check(object(value), 'A folder record is invalid.');
      const out = { subscriptions: [] };
      for (const field of ['color', 'textColor']) {
        if (value[field] !== undefined) {
          check(typeof value[field] === 'string' && /^#[0-9a-f]{6}$/i.test(value[field]), 'A folder colour is invalid.');
          out[field] = value[field];
        }
      }
      check(value.subscriptions === undefined || Array.isArray(value.subscriptions), 'A channel assignment list is invalid.');
      for (const sub of value.subscriptions || []) {
        const id = sub?.snippet?.resourceId?.channelId;
        check(typeof id === 'string' && /^[A-Za-z0-9_-]+$/.test(id), 'A channel assignment is invalid.');
        // Only fields used by the UI are retained; imported HTML is never executed.
        const snippet = { title: typeof sub.snippet.title === 'string' ? sub.snippet.title : id,
          description: typeof sub.snippet.description === 'string' ? sub.snippet.description : '', resourceId: { channelId: id } };
        const url = sub.snippet.thumbnails?.default?.url;
        if (typeof url === 'string' && /^https:\/\//i.test(url)) snippet.thumbnails = { default: { url } };
        out.subscriptions.push({ snippet });
      }
      if (parent) {
        out.subfolders = dictionary(value.subfolders || {}, false);
        out.expanded = value.expanded === true;
      } else check(!value.subfolders, 'Nested subfolders are not supported.');
      return out;
    }
    function dictionary(values, parent) {
      check(object(values), 'A folder list is invalid.');
      const result = {};
      for (const [name, value] of Object.entries(values)) {
        check(name.trim() && !['__proto__', 'constructor', 'prototype'].includes(name), 'A folder name is invalid.');
        result[name] = record(value, parent);
      }
      return result;
    }
    Object.assign(output, dictionary(data, true));
    return output;
  }
  function validate(value) {
    check(object(value) && value.application === 'youtube-subscription-manager' && value.formatVersion === 1,
      'This is not a supported YouTube Subscription Manager backup.');
    check(typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt)), 'The backup date is invalid.');
    check(object(value.owner) && typeof value.owner.id === 'string' && /^[A-Za-z0-9_-]+$/.test(value.owner.id), 'The backup account is invalid.');
    return { application: value.application, formatVersion: 1, createdAt: value.createdAt,
      owner: { id: value.owner.id, title: typeof value.owner.title === 'string' ? value.owner.title : value.owner.id },
      folderData: cleanFolders(value.folderData) };
  }
  function create(folderData, owner) {
    return validate({ application: 'youtube-subscription-manager', formatVersion: 1,
      createdAt: new Date().toISOString(), owner, folderData });
  }
  function parse(text) {
    check(typeof text === 'string' && new TextEncoder().encode(text).length <= MAX_BYTES, 'The backup is too large (maximum 8 MB).');
    let value;
    try { value = JSON.parse(text); } catch { throw new Error('The selected file is not valid JSON.'); }
    return validate(value);
  }
  globalThis.BackupFormat = { MAX_BYTES, create, parse, validate };
})();
