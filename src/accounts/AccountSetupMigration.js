// Idempotent migration: retain original working data and add the linked account record.
const AccountSetupMigration = (() => {
  function prepare(data) {
    const saved = data[AccountSetupStore.key];
    if (saved !== undefined) {
      AccountSetupStore.validate(saved);
      if (!data.folderOwner || saved.activeAccountId !== data.folderOwner.id)
        throw new Error('The saved setup does not match its linked owner. Existing data was kept.');
      if (JSON.stringify(saved.setups[data.folderOwner.id].folderData) !== JSON.stringify(data.folderData || {}))
        throw new Error('Saved account folders differ from the current setup. Existing copies were kept; do not reset storage.');
      return {};
    }
    return AccountSetupStore.withFolders(data, data.folderData || {});
  }
  async function ensure() {
    const data = await chrome.storage.local.get(['folderData', 'folderOwner', AccountSetupStore.key,
      'accessToken', 'accountStatus', 'userSubscriptions', 'subscriptionLoadStatus', 'developmentFolderPlan']);
    const patch = prepare(data);
    if (Object.keys(patch).length) await chrome.storage.local.set(patch);
    return { ...data, ...patch };
  }
  return Object.freeze({ prepare, ensure });
})();
globalThis.AccountSetupMigration = AccountSetupMigration;
