# YouTube Subscription Manager - Project Backlog

Updated: 15 October 2026

This is the current decision record. Proposals are not approval to implement them. The folder section below is the only premium implementation currently authorised.

## Checkpoint and working rules

- Tested interface checkpoint: `ui-redesign`, user-confirmed pushed to commit `6c35020`.
- Folder work target: `premium-folders`, based on that checkpoint. User creates/switches the branch in the original local repository. This replacement archive has no Git metadata; no branch operation, commit, push or merge was performed by the assistant.
- Current source derives from `extension-current(1).zip` plus the accepted move-feedback/tools changes and tested Refresh correction. The older separately supplied `extension-source.zip` is not the baseline.
- Original development extension identity, OAuth client, permissions and account protection are retained. Never substitute the separate portable beta configuration.
- Keep code modular, preserve accepted appearance and behaviour, work one section at a time, and test before moving to the next section.
- Do not touch `main` or `ui-redesign`, commit or push without explicit instructions.
- Run dialogs, manage, retrieval and startup suites after application changes, plus relevant additional suites. Deliver one complete replacement ZIP.

## Accepted interface and reliability work

- Parent/subfolder creation/editing uses shared themed dialogs and accepted colours, custom colours and anchored sidebar editing.
- Channel three-dot menu and its current contents are preserved.
- Successful moves display `Moved to Parent / Subfolder` for two seconds, then fade over 300ms. They appear in the fixed navigation-row slot between Uncategorised and All Folders without pushing the interface down. Stay in the source subfolder; show success only after saving succeeds.
- Tools menu has Refresh subscriptions, Backup folders, Restore backup and About, each with a line icon and short description. Backup is a download arrow; restore is an upload arrow. About shows the installed version and local-storage/backup information in the shared dark style.
- Backup/restore notices use the same fixed slot with a four-second success duration. Errors remain dismissible. Narrow layouts reserve a notification row permanently.
- Refresh keeps Manage/sidebar mounted during verification of the same session, displays Updating, and refreshes Uncategorised. Saving remains blocked until account verification completes. Sign-out, changed-session verification, mismatch or verification errors retain access protection. Fetch errors retain the complete cached list and appear in Manage.
- User confirmed all current interface changes, backup/restore, safety copies and account linking work. Portable beta passed second-computer testing.
- Folder mutations use one complete save; failed saves retain previous assignments. Per-tab overlapping writes are guarded. Cross-tab save conflict protection remains deferred.

## Folder plans - current authorised section

| Decision | Current position |
| --- | --- |
| Free allowance | Provisionally four parent folders and three subfolders per parent. Defined centrally so feedback can change the numbers. |
| Subscription counts | Unlimited subscriptions under both plans; no new channel limit. |
| Pro allowance | Unlimited parent folders and subfolders. |
| Reaching a limit | Check when creating, explain the applicable limit and offer Pro. Declining preserves the complete setup. |
| Expiry | Return to Free creation rules. Preserve access to all existing folders and assignments. Allow renaming, colours, deletion and channel moves/removal. |
| Existing oversized setup | Block all new folder creation while any count exceeds the Free allowance. No automatic deletion or locked-away content. |
| Reduced setup | Once all counts fit Free, creation is available wherever there is room within the limits. It never grants a fresh allocation on top of existing folders. At four parents, a fifth is blocked; a parent with two children can receive a third. |
| Oversized backup | Allow full restore, including all ten parents in the discussed example, then use the same Free/expiry creation rules. Existing owner validation and completed safety-copy download still apply. |
| Restore trade-off | Full recovery is prioritised; a user could manually edit a backup to introduce extra folders. No signature or anti-tamper restrictions introduced. |
| Current upgrade action | Themed prompt and Pro details only. It clearly says purchases are unavailable in this development build. No checkout or charge. |
| Testing states | Separate development Extension options page simulates Free, Pro and expired states. State persists locally and updates open tabs; it is excluded from backups. Disable/remove these controls before public release. |

The earlier proposal to disable all creation forever after expiry was explicitly superseded: former subscribers can use the same Free allowance once their setup fits it.

Current modules: `src/plans/FolderPlan.js`, `src/plans/FolderCreationGate.js`, `src/components/PlanDialogs/FolderLimitDialog.js`, and separate `development/plan-testing.*` controls. Shared forms check before opening and saving; FolderService checks again before creating. No count checks are added to editing, moving, deletion or restore.

## Premium work after the folder section

Build and test one section at a time. Do not implement the following yet.

| Item | Position |
| --- | --- |
| Separate local setups for multiple YouTube accounts | Likely next section after folder limits are manually accepted. Current single-owner protection remains. Account switching/ownership and expiry details still need design. |
| Multi-channel moves | Proposed paid feature with checkboxes; Ctrl/Shift selection remains possible, not agreed. |
| Folder icons | Proposed small built-in selection free, with extra icon packs and custom uploads paid. No icon change implemented. Upload type/size limits and backup handling need design. Existing colours remain free. |
| Scheduled backups | Candidate; schedule, destination and retention undecided. |
| Bulk unsubscribe | Candidate. Permissions, confirmation and safeguards require discussion. |
| Cross-device sync | Later work; no hosted storage/sync implemented. A compact account/folder/channel-ID Chrome-sync design was only a previous idea. |
| Selective restore and backup history | Deferred. |
| Sidebar-state persistence and light theme | Should be free; implementation deferred. |
| Drag-and-drop | Future idea for channel moves/folder ordering; existing click-based controls remain. Paid/free placement undecided. |

## Commercial and branding decisions

- Currency: pounds sterling.
- Price: £9.99/year is provisional. £4.99/year was an earlier idea; price is not final and is not displayed or charged by this implementation.
- Yearly billing preferred. Payment service, entitlement validation, upgrade placement beyond creation prompts and renewal flow remain undecided.
- Lifetime purchase is an idea only; no price or promise agreed.
- Seven-day Pro trial is deferred for future consideration.
- Product name and final toolbar icon/branding remain undecided. Names mentioned were brainstorming suggestions without availability checks.
- No need to settle every future paid feature before testing the current folder section.

## Backup/restore rules retained

- Manual versioned JSON export and full replacement restore, not merging/selective recovery.
- Export folders, subfolders, colours, channel assignments and owner identity; exclude credentials, Google permissions, subscription cache and development plan state.
- Require the same signed-in verified owner. After reinstall, link the empty installation to the original channel before restoring.
- Explicit confirmation and completed dated safety-copy download precede replacement. Cancelled/failed downloads stop restore.
- Invalid format/version, account mismatch, failed writes, or a changed account/folder setup during the safety download do not replace existing data.
- Restoring changes the local organisation, not actual YouTube subscriptions.

## Current validation and next action

Automated coverage includes the four required suites, backup, backup-notice, folder-plans and plan-testing. New cases cover exact boundaries, Pro creation, expiry and reduction, stale open-form checks, unlimited channel moves, oversized restores with safety copies, release-disabled test states, and test controls without folder changes.

Next: user tests this complete replacement in Chrome on `premium-folders`, following `development/README.md`. Do not commit/push or start multi-account implementation until that section is accepted. Browser-rendered appearance was not verified in this environment because Chromium is not installed.

## Folder stage accepted and test-folder cleanup

- User confirmed Free, Pro and expired-state manual checks work in Chrome.
- Removed the old duplicate application tree (`tests/src`), nested old tests (`tests/tests`), and copied manifest, popup, background and project notes from `tests`.
- Keep the eight active suite entry points and `popup-auth.cjs`, which is called by retrieval. New `tests/README.md` documents the actual tests.
- No application code or plan behaviour changed during cleanup. Rerun all eight suites before delivery.
- When applying the cleanup ZIP, remove the existing local `tests` folder before copying the replacement. Extracting over it alone will not delete stale files. Preserve the real project `src` and Git directory.
- Next: accept cleanup and then commit/push on premium-folders when explicitly instructed. Multi-account implementation has not started.

## Multiple-account stage 1 - 16 October 2026

- User confirms the cleaned folder-plan checkpoint has been committed/pushed successfully on `premium-folders`. No new commit hash was supplied.
- Multiple saved local account setups are the intended Pro feature; Free retains one linked setup. Google sign-in itself is not a paid feature.
- Expiry direction agreed: honour a previously chosen Free account; otherwise default to the last active account. Preserve the other setups. The exact replacement rules after expiry remain undecided; do not introduce a replacement control yet.
- Build/test one section at a time. This first section implements storage and migration only, before the account-switching interface and multi-account plan policy.
- New small modules: AccountSetupStore.js and AccountSetupMigration.js in src/accounts. Use verified channel ID as the key, not email/display name.
- On startup/verification, preserve the linked legacy setup and create its versioned account record. Unlinked setups remain unlinked. Reject unsupported/invalid or conflicting registry state rather than replacing any copy.
- Folder saves and full restore update the active working folderData and that owner's registry record atomically. Initial linking also creates the account record. Preserve inactive records and existing owner/safety-download checks.
- No account-switch UI or multi-account entitlement implemented yet; existing different-account blocking remains in place during this stage. Other proposed modules will be added only when their responsibilities are needed.
- Tokens, live subscription cache and development plan state are not copied into setup records or backup exports. Backups retain their existing single-owner format.
- Temporary mirrored active storage increases storage usage. Quota failures retain original data. General cross-tab stale-save protection is still deferred.
- Run the existing eight suites plus account-setups. New tests cover idempotence, unlinked/empty setups, failed migration/retry, schema/owner conflicts, isolated inactive records, atomic saves/moves/restores, failure rollback and restart.
- Manual next action: follow development/account-storage-testing.md on the same existing development installation. Confirm the current setup survives reload, edits, restore and sign-out/return before building switching controls. No commit/push performed for this stage.
