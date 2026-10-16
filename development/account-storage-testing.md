# Multiple-account storage: first stage

This stage prepares account-indexed storage and preserves the current single-account interface. It does not yet allow account switching, add another-account controls, or implement multi-account Pro entitlements. A different account is still blocked by the existing ownership checks.

## Manual check

1. Use the existing development installation on `premium-folders`. Export a folder backup before replacing files.
2. Copy this complete replacement into the project, then reload the extension and YouTube.
3. Confirm the current linked account, folder order, colours, subfolders and assignments remain correct. No new link confirmation is required for an already-linked setup.
4. Create/rename/delete a temporary folder and move a subscription. Reload YouTube and confirm the results remain.
5. Export a backup; restore it and confirm the safety download and restored setup still work. Backups remain for one verified owner and do not export other saved setups.
6. Sign out and sign in again to the same owner. Verify folders remain. Restart Chrome and check again.
7. Leave Free/Pro/expired testing controls as before; this stage does not change folder-plan rules.

No storage editing is required. If desired, inspect (do not edit) the extension's `accountSetupData` key in DevTools: it has schemaVersion 1, activeAccountId, lastActiveAccountId, preferredFreeAccountId (initially null) and a setups object keyed by the verified YouTube channel ID. That ID, rather than an email or display name, identifies the setup.

## Organisation

- `src/accounts/AccountSetupStore.js`: shared versioned format, validation and pure construction of account-record writes.
- `src/accounts/AccountSetupMigration.js`: idempotent conversion of the current linked setup; leaves original folderData/folderOwner in place.
- Existing FolderService saves folderData and its account record in a single Chrome storage write. Restore does the same after its safety download. Failed writes retain the previous local data/view.
- App initializes from the migrated data and receives registry updates through storage notifications.
- Verification and initial linking retain their existing identity checks. New linking creates the corresponding account record in the same write.

Only owner ID/title and folder data enter a setup record. Tokens, account verification state, the complete live subscription cache and development plan state remain outside the registry. Channel objects already assigned to folders remain part of those folders, as before.

Migration never silently replaces an unsupported registry version, an owner mismatch, or differing active copies. A storage/schema failure keeps the original stored data and reports an error. Do not reset or clear storage to work around an error; retain the backup and report it.

During this transition the active folderData working copy is also mirrored in its account record, increasing local storage use. A quota failure must not discard the original setup. General cross-tab stale-save protection remains deferred; this stage is not a general concurrency coordinator. Inactive account records are preserved by active saves/restores, but switching them into the active role is not exposed yet.

## Following stage

After manual acceptance, build the popup switching flow and multi-account plan rules. Agreed expiry direction: a previously chosen Free account remains available; if none was chosen, use the last active account. Other setups stay saved. Choosing/replacing that account and access after expiry need explicit UI and authorisation handling. Replacement rules after expiry remain undecided; no replacement control is added here.
