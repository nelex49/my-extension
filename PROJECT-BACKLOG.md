# YouTube Subscription Manager - Project Backlog

Updated: 17 October 2026

This is the current decision record. Proposals are not approval to implement them. The working checkpoint is account storage and migration, before the unsuccessful account-switching implementation. Current authorised work is documentation; the first Pro release needs agreement before further feature implementation.

## Checkpoint and working rules

- Tested interface checkpoint: `ui-redesign`, user-confirmed pushed to commit `6c35020`.
- Folder work target: `premium-folders`, based on that checkpoint. User creates/switches the branch in the original local repository. This replacement archive has no Git metadata; no branch operation, commit, push or merge was performed by the assistant.
- Authoritative source: attached `extension-current.tar(1).gz`. The separately supplied `extension-source.zip` is not the baseline. The supplied archive has no Git metadata, so the local checkout branch cannot be verified here; verify `premium-folders` before applying it.
- Original development extension identity, OAuth client, permissions and account protection are retained. Never substitute the separate portable beta configuration.
- Keep code modular, preserve accepted appearance and behaviour, work one section at a time, and test before moving to the next section.
- Do not touch `main` or `ui-redesign`, create branches, commit or push without explicit instructions.
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
| Separate local setups for multiple YouTube accounts | Shelved for a future release. Retain storage/migration and current single-account protection. Do not build an account switcher or backend now; authentication and hosting need further work. Earlier multi-account entitlement/expiry proposals are not launch commitments. |
| Multi-channel moves | Deferred. Checkbox and Ctrl/Shift selection proposals are not launch commitments. |
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

## Current working checkpoint and validation

- Folder-plan behaviour and existing single-account behaviour were manually tested successfully by the user. The portable beta previously passed second-computer testing; that separate configuration must not replace development identity/OAuth.
- Account storage/migration is retained: `src/accounts/AccountSetupStore.js` and `AccountSetupMigration.js` preserve linked legacy data in versioned records keyed by verified channel ID. Folder saves, linking and restore update working data and its account record together. Inactive records remain preserved; invalid/conflicting state fails without overwrite.
- Tokens, live subscription cache and development plan state stay outside account records and backup exports. Existing owner checks, safety copies and single-account blocking remain.
- The supplied checkpoint was previously compared with the original storage-stage delivery: all baseline files matched; nine inactive switching files were identified for removal. That comparison is historical user-provided context, not a new byte comparison performed here. No switching implementation should be reintroduced.
- The tests tree is already cleaned. Keep nine suite entry points plus `popup-auth.cjs`, used by retrieval; do not restore copied application trees or nested tests.
- Nine regression suites: dialogs, manage, retrieval, startup, backup, backup-notice, folder-plans, plan-testing and account-setups. These simulate Chrome/DOM APIs and do not replace real Chrome testing.
- Manual storage checklist: `development/account-storage-testing.md`. Folder-plan checklist: `development/README.md`.
- Storage duplication increases usage; quota failures must retain original data. Cross-tab save protection remains deferred.

## Next work: agree the smallest useful first Pro release

- Unlimited parent folders and subfolders are implemented. Discuss whether these alone make a useful first paid release before adding candidates. No additional launch feature is agreed by this documentation update.
- Keep sidebar-state persistence and light theme Free. Icon packs/custom uploads, scheduled backups and bulk unsubscribe remain candidates only.
- Multiple accounts, multi-channel moves, seven-day trial, cross-device sync, selective restore, backup history and cross-tab save protection are deferred.
- GBP 9.99 annually is provisional. Final pricing, payment/licensing provider, upgrade placement and lifetime pricing remain undecided.
- Before selling: implement verified licensing and entitlement handling; replace development plan controls; finish branding, privacy and store materials; complete regression and real Chrome testing of install, OAuth, persistence, downloads, restore and plan behaviour.
- No backend, switcher, licensing integration or other new feature is authorised by this document. Agree scope first, then implement and test one section at a time.
