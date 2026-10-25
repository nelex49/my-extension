# YouTube Subscription Manager - Project Backlog

Updated: 24 October 2026

This is the current decision record. Proposals are not approval to implement them. The working checkpoint is account storage and migration, before the unsuccessful account-switching implementation. Current authorised work is the documentation/unused-helper cleanup. Next: Free interface-state persistence, then light/dark theme switching. Additional Pro launch features still need agreement.

## Checkpoint and working rules

- Tested interface checkpoint: `ui-redesign`, user-confirmed pushed to commit `6c35020`.
- Folder work target: `premium-folders`, based on that checkpoint. User creates/switches the branch in the original local repository. This replacement archive has no Git metadata; no branch operation, commit, push or merge was performed by the assistant.
- Authoritative source: attached `extension-latest-current.tar.gz`. The separately supplied `extension-source.zip` is not the baseline. The supplied archive has no Git metadata, so the local checkout branch cannot be verified here; verify `premium-folders` before applying it.
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
| Free allowance | Unlimited parent folders; three subfolders per parent. Defined centrally. |
| Subscription counts | Unlimited subscriptions under both plans; no new channel limit. |
| Pro allowance | Unlimited subfolders per parent, multi-channel moves and built-in folder icon choices. Parent folders are unlimited in Free too. |
| Reaching a limit | Check when creating, explain the applicable limit and offer Pro. Declining preserves the complete setup. |
| Expiry | Return to Free creation rules. Preserve access to all existing folders and assignments. Allow renaming, colours, deletion and channel moves/removal. |
| Existing oversized setup | Keep all existing content. Block additional subfolders only in a parent already at/above three. Other parents retain their own allowance; parent creation stays unlimited. |
| Reduced setup | Each parent is evaluated independently. A parent with two subfolders can receive a third. There is no parent-folder count limit. |
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
| Sidebar-state persistence and light theme | Agreed Free. Next implementation stages, after this cleanup; scope below. |
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

## Ordered next work and release preparation

- Current Pro features: unlimited subfolders, multi-channel moves and built-in icon choices. Free includes unlimited parent folders.
- Keep sidebar-state persistence and light theme Free. Ten built-in icons are implemented. Custom uploads, scheduled backups and bulk unsubscribe remain deferred candidates.
- Multiple accounts, seven-day trial, cross-device sync, selective restore, backup history and cross-tab save protection are deferred. Multi-channel moves are implemented.
- GBP 9.99 annually is provisional. Final pricing, payment/licensing provider, upgrade placement and lifetime pricing remain undecided.
- Before selling: implement verified licensing and entitlement handling; replace development plan controls; finish branding, privacy and store materials; complete regression and real Chrome testing of install, OAuth, persistence, downloads, restore and plan behaviour.
- No backend, switcher or licensing integration is included in this cleanup. Implement and test one agreed section at a time.

## Current cleanup checkpoint - 24 October 2026

- Consolidated root documentation into README.md (overview/setup/architecture) and PROJECT-BACKLOG.md (current decisions and next work). Removed HANDOVER.md and historical REFACTOR-NOTES.md after carrying forward relevant guidance. Keep tests/development instructions beside their files.
- Removed unused src/services/StorageService.js and its manifest loading entry. Removed obsolete safeSaveFolderData test stubs. No active callers existed. Active FolderService persistence, account migration, account records and backup services remain unchanged.
- Preserve classic-script manifest dependency order, scoped CSS and shared globals/window bridges. This remains an explicit dependency model, not isolated ES modules. Keep storage, policy, rendering and lifecycle responsibilities separate; avoid arbitrary file splitting for line counts alone.
- Nine regression suites passed after cleanup. They simulate Chrome/DOM APIs; no new live Chrome verification was performed for this cleanup.
- Apply on the user's clean premium-folders checkout. Archive has no Git metadata, so the assistant cannot independently verify its branch. No branch operations, commits or pushes were performed.
- IMPORTANT: delete HANDOVER.md, REFACTOR-NOTES.md and src/services/StorageService.js from the original project when applying this replacement. Overlaying a ZIP will not remove omitted files. Preserve the project's .git folder and existing development identity/OAuth.

## Next implementation scope and testing findings

1. Free interface-state persistence: remember sidebar open/closed state and expanded parent/subfolder rows; remember the selected Manage parent/subfolder for manual reopening; keep Manage closed after refresh/restart. Validate saved references and fall back safely after deletion. Keep transient menus/edit dialogs closed and preferences separate from folder data/backups. Restore protected UI only after verified sign-in; sign-out must not expose it. Use a dedicated preferences module with small integrations. Not implemented by this cleanup.
2. Free light/dark switching: dark remains default, remember the choice. Implement separately after persistence is accepted.
3. Continue tester feedback and fix onboarding/identity clarity: Beta 1.0.3 uses the working application checkpoint with separate portable identity/OAuth. The third-account test succeeded after creating a YouTube channel, showed linking confirmation and an empty setup. A Google account without an identifiable channel currently receives an unclear verification error; improve this without treating every verification failure as a missing channel. Clearly show the linked channel, since switching website Gmail/YouTube sessions does not switch extension authorisation. These improvements are pending.
4. Agree additional Pro launch scope, then implement chosen features one at a time. Unlimited subfolders, multi-channel moves and built-in icons are implemented Pro features. Multiple-account switching stays shelved; retain its working storage foundation.
5. Confirm pricing/provider and verified licensing; build customer upgrade/pricing/payment/activation and renewal/expiry flows. Replace developer plan controls before selling. Finish branding/privacy/store materials, regression and real Chrome release tests.

Development source stays on premium-folders; beta is a generated separate tester package, not a confirmed Git branch. Update beta code from accepted development checkpoints while retaining beta configuration only in that package. Eventually verify branch ancestry before an explicitly authorised merge into main.

## Free persistence checkpoint - 24 October 2026

- Implemented sidebar section visibility and expanded parent/subfolder restoration, plus remembered Manage parent/subfolder location for manual reopening. Manage does not reopen automatically after reload/restart. Explicitly closing either surface is remembered. Protected UI restores only for the verified linked owner; account-protection close does not erase the saved selection.
- New focused src/services/ViewPreferences.js owns schema validation, owner tagging and serialized preference writes. Small integrations in startup, sidebar and Manage retain existing responsibilities. No preference values are written into folderData/account records or backups. Existing backup format and entitlement rules unchanged.
- Missing parent falls back to Uncategorised; missing child uses existing Manage fallback. Sidebar invalid references are pruned. Transient menus, searches, dialogs and pixel scroll positions do not restore. Preferences are local to this Chrome profile; last saved location is used by newly loaded tabs, without forcing currently open tabs to navigate.
- Ten suites pass: existing nine plus view-preferences.cjs. Startup integration tests cover reloading saved sidebar expansion and Manage location, explicit close and missing references. New unit cases cover owner isolation, invalid schema, protected writes, rapid-write ordering and storage failure recovery. Live Chrome testing is pending.
- Next: user checks Art/subfolder refresh and Chrome restart, deliberately closed state, Manage location, deleted folders and sign-out/return. Then light/dark theme switching as a separate Free change. No branch operations, commits or pushes.

## Accepted persistence refinement

- Supersedes the earlier automatic Manage reopening: a refreshed/restarted page leaves Manage closed, even if the previous preference record contained manageOpen=true. This obsolete field is ignored and no longer saved.
- Reopening Manage manually restores the last selected parent/subfolder. Sidebar section visibility and expanded rows still persist.
- Subscription Folders launcher now has an aria-hidden CSS chevron: right when collapsed, down when expanded. The existing full button remains the toggle; no separate close control.
- All ten suites pass, including restore-without-auto-open, remembered manual selection, ignored legacy open state and launcher aria state. Real Chrome appearance/reload checks remain required. Development OAuth/permissions unchanged; no Git operations.

## Free theme checkpoint - 24 October 2026

- User confirmed persistence refinement working and committed/pushed it to premium-folders; no commit hash supplied. This delivery adds theme switching on top of that accepted code.
- Manage Tools now includes Theme alongside Refresh, Backup, Restore and About. Theme opens a shared dialog with explicit Dark/Light choices and Done; successful saves apply immediately. Saving failures retain the previous theme and report an error.
- Dark remains default. Theme is a browser-profile preference (subscriptionTheme), independent of linked accounts, Free/Pro plan states and folder backups. It survives refresh/restart, applies to other open tabs and the sign-in popup, and never changes YouTube's own theme or saved folder fills/text.
- Focused ThemeService owns persistence and cross-tab updates; ThemeDialog owns the shared dialog UI; theme.css defines the light palette. Existing style declarations use light tokens with their original dark colour as fallback, preserving dark panel styling and layout. New menu entry and theme dialog are the intended UI additions; sign-in popup now follows the chosen theme.
- Eleven suites pass, including theme unit tests and startup integration that opens the actual Theme control and selects both states. Checks cover defaults, persisted choice, failed saves, cross-tab changes, plan/folder isolation, initialization races and exact dark CSS fallback preservation.
- Chromium is not installed here; real rendered light-theme, native controls and contrast/layout checks remain pending in Chrome. User should test sidebar, Manage, overflow/move menus, create/edit/custom-colour dialogs, About, backup/restore/plan dialogs and sign-in popup in both themes, then refresh/restart. Confirm folder colours and assignments remain unchanged.
- Original development OAuth/client identity, permissions and account-storage logic remain unchanged. No Git operations performed. Generate beta separately after acceptance; public plan controls/licensing and further Pro launch scope remain unfinished.

## Light navigation contrast correction

- User confirmed themes working. Fixed white text on light-theme Uncategorised (including count/icon and hover) and All Folders. Selected Uncategorised uses a light blue fill and inset outline to retain a visible selected state with dark text.
- Dark theme, saved folder colours and Add Folder unchanged. Theme remains in Tools with explicit Dark/Light and Done; a header pill was discussed but not implemented.
- Eleven suites pass, including numeric contrast checks for these light navigation states. Real Chrome appearance remains for user confirmation. No Git operations.

## Channel guidance and removal confirmation - 24 October 2026

- User confirmed the theme/contrast checkpoint and reported it pushed to GitHub. Build these changes on that accepted development source; no commit hash supplied.
- Uncategorised explanation now contains a miniature static Move/dropdown illustration in the sentence. It is a span, not an interactive button, with no tab stop or action. Both themes match the existing Move fill/text treatment.
- Channel Remove now opens a compact centred shared-lifecycle dialog over the dimmed Manage window. Display escaped channel/folder names; explain that YouTube subscription remains. Cancel has initial focus; Escape/outside click cancel. During saving, prevent duplicate confirmation and premature close. Successful save closes and retains Manage selection; failure keeps the assignment and shows an inline retry error. Changed target records require reopening; account loss closes the dialog.
- Added focused RemoveChannelDialog module and one optional shared lifecycle cleanup callback. Existing removal service, account-aware persistence, folder-plan rules and YouTube permissions unchanged.
- Retain current channel ellipsis menus, Open on YouTube and disabled Unsubscribe placeholder: user explicitly chose to leave them and their row alignment untouched. No unsubscribe permission or premium feature implemented.
- All eleven suites pass. Startup tests exercise real confirmation routing, Cancel/Escape, safe focus, storage failure and retry, duplicate clicks, same-folder result, stale records, listener cleanup and unchanged YouTube subscriptions. Static Move illustration verified non-interactive. Real Chrome dialog appearance in both themes remains pending user review.
- No branch operations, commits or pushes performed. Current development source stays on premium-folders; beta remains separate.

## Subfolder-search and confirmation refinement

- Clarified removal reassurance: You will remain subscribed to this channel on YouTube. Cancel still receives focus first; its focus outline is now visible for mouse-opened dialogs as well as keyboard use.
- Replaced the always-visible subfolder search row with a magnifying-glass toggle beside Add Subfolder. Starts closed, appears only in parent views, exposes aria-expanded/aria-controls and descriptive label, focuses the field when opened, and clears filters/restores the complete list when closed. Escape in the field closes search without dismissing Manage. Changing parent resets it. Search visibility is transient, excluded from saved view preferences.
- Explicitly supersedes the earlier always-visible subfolder-search decision. Channel contains matching and sort behaviour remain unchanged; no starts-with prioritisation added. Ellipsis menus unchanged.
- Eleven regression suites pass, including toggle/open focus, filtering/clear/close, Escape and removal wording/initial Cancel focus. Real Chrome layout and focus appearance remain for user confirmation. OAuth/permissions/account persistence unchanged; no Git operations.

## Folder allowance and Pro wording checkpoint - 25 October 2026

- Free: unlimited parent folders, three subfolders per parent, unlimited subscriptions, individual moves, colours/themes and backup/restore.
- Pro: unlimited subfolders per parent, multi-channel moves and ten built-in icon choices (including the default folder).
- Free/Expired capacity is local to each parent. Existing excess subfolders and saved icons remain usable; there is no global creation lock.
- Feature prompts lead with the clicked benefit, then list the other benefits under Also included with Pro. Unlimited parent folders are explicitly Free. Purchases are still unavailable.
- Development only; beta 1.0.4 and its separate OAuth/identity settings are untouched. No Git actions performed for this checkpoint.
