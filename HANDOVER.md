# Working handover - account storage and migration

Updated: 17 October 2026

## Authoritative baseline and repository rules

Use the attached `extension-current.tar(1).gz`, before the unsuccessful account-switching implementation. Do not use the separately supplied `extension-source.zip` as the baseline.

Target branch: `premium-folders`. This archive has no Git metadata; its branch cannot be verified here. Verify the original checkout before applying changes. Do not touch `main` or `ui-redesign`, create branches, commit or push without explicit instructions. No Git operations were performed for this documentation update.

Preserve the original development extension identity, OAuth client and permissions. Never substitute the separate portable Beta configuration. Keep files modular, clearly named and reasonably small; preserve accepted appearance and behaviour.

## Working checkpoint

- Accepted redesigned interface and modular folder-management code.
- Move success appears without layout movement and leaves the user in the source subfolder. Channel three-dot menu preserved.
- Tools: Refresh Subscriptions, Backup, Restore and About. Normal same-account Refresh keeps Manage open during verification; owner protection remains.
- Backup/restore retains verified owner checks and completed safety-copy downloads before replacement. Restore replaces local organisation, not actual YouTube subscriptions.
- AccountSetupStore and AccountSetupMigration preserve existing linked data and create versioned account records keyed by verified channel ID. Saves, linking and restore update working data and the owner's record together. Invalid/conflicting state fails without overwrite; failed writes preserve original data.
- Tokens, live subscription cache and development plan state stay outside account records/backups. Active data is duplicated in its account record; quota failures must preserve it.
- Existing single-account behaviour was manually tested successfully. The portable beta previously passed second-computer testing.
- Historical baseline comparison and nine inactive switching-file removals are recorded in PROJECT-BACKLOG.md. Do not reintroduce switching files or controls.

## Free, Pro and expiry rules

Free provisionally allows four parent folders and three subfolders per parent. Subscriptions are unlimited. Pro allows unlimited parents and subfolders.

On expiry, preserve all folders and subscriptions, access, editing, deletion and channel moves. Block all new folder creation while any structure count exceeds Free limits. Once the complete structure fits, allow creation where capacity remains. Full oversized-backup restoration is allowed, followed by the same restrictions.

FolderPlan, FolderCreationGate and FolderLimitDialog centralise these rules. The separate development options page simulates Free/Pro/expired states; this is not verified production licensing. Purchases are unavailable. Before selling, replace test-state resolution with verified licensing, disable development plan testing and remove development options from the release.

## Shelved and deferred work

Multiple-account support is shelved for a future release because authentication and hosting need more work. Retain the working storage foundation and current single-account protection. Do not build a backend or account switcher now. Earlier multi-account plan/expiry proposals are not launch commitments.

Multi-channel moves, seven-day trial, cross-device sync, selective restore, backup history and cross-tab save protection remain deferred. Sidebar-state persistence and light theme should be Free. Icon packs/custom uploads, scheduled backups and bulk unsubscribe remain candidates.

## Next discussion and release requirements

Discuss the smallest useful first Pro release. Unlimited folders are already implemented, but the launch feature list is not agreed. GBP 9.99 annually is provisional; pricing, payment/licensing provider, upgrade placement and lifetime pricing remain undecided.

Before selling Pro: verified licensing, replacement of development plan controls, release branding/privacy/store materials, all regression suites and real Chrome testing. No new feature implementation is authorised by this documentation update. PROJECT-BACKLOG.md is the current decision record.

## Validation and delivery

Run dialogs, manage, retrieval and startup after changes, plus relevant suites. This documentation delivery runs all nine: dialogs, manage, retrieval, startup, backup, backup-notice, folder-plans, plan-testing and account-setups. Commands and coverage are in tests/README.md. Tests simulate Chrome/DOM APIs; real Chrome installation, OAuth, appearance, persistence and download checks remain necessary before release.

Manual checklists: development/account-storage-testing.md and development/README.md. Deliver one complete replacement ZIP without Git metadata. This update changes only PROJECT-BACKLOG.md and HANDOVER.md; application code and configuration remain identical to the authoritative archive.
