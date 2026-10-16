// Shared storage format. Active folderData remains the working copy in this stage.
const AccountSetupStore = (() => {
  const key = 'accountSetupData', version = 1;
  const clone = value => JSON.parse(JSON.stringify(value));
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const validId = id => typeof id === 'string' && /^[A-Za-z0-9_-]+$/.test(id) &&
    !['__proto__', 'constructor', 'prototype'].includes(id);
  function validate(state) {
    if (!object(state) || state.schemaVersion !== version || !object(state.setups) ||
        !validId(state.activeAccountId) || !Object.hasOwn(state.setups, state.activeAccountId))
      throw new Error('Saved account setups have an unsupported or invalid format. Existing data was kept.');
    for (const [id, setup] of Object.entries(state.setups)) {
      if (!validId(id) || !object(setup) || setup.owner?.id !== id || !object(setup.folderData))
        throw new Error('A saved account setup is invalid. Existing data was kept.');
    }
    for (const field of ['lastActiveAccountId', 'preferredFreeAccountId']) {
      if (state[field] != null && (!validId(state[field]) || !Object.hasOwn(state.setups, state[field])))
        throw new Error('A saved account selection is invalid. Existing data was kept.');
    }
  }
  function withFolders(data, folders) {
    const owner = data.folderOwner;
    if (!owner) return {}; // An unlinked installation stays untouched until linking.
    if (!validId(owner.id) || !object(folders)) throw new Error('The current account setup is invalid. Existing data was kept.');
    let state = data[key];
    if (state !== undefined) {
      validate(state);
      if (state.activeAccountId !== owner.id) throw new Error('The active account setup changed. Reload YouTube before saving.');
      state = clone(state);
    } else state = { schemaVersion: version, activeAccountId: owner.id,
      lastActiveAccountId: owner.id, preferredFreeAccountId: null, setups: {} };
    state.setups[owner.id] = { owner: { id: owner.id, title: typeof owner.title === 'string' ? owner.title : owner.id }, folderData: clone(folders) };
    state.lastActiveAccountId = owner.id;
    return { [key]: state };
  }
  return Object.freeze({ key, version, validate, withFolders });
})();
globalThis.AccountSetupStore = AccountSetupStore;
