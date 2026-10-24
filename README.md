# YouTube Subscription Manager

Chrome Manifest V3 extension for organising YouTube subscriptions into parent folders and subfolders. Current development checkpoint: account storage/migration, Free interface-state persistence and light/dark themes, on `premium-folders`.

`PROJECT-BACKLOG.md` is the current record of decisions, limitations, testing findings and ordered next work. Root documentation is limited to this overview and that decision record.

## Working features

- Compact dark sidebar with expandable parents/subfolders and one browsing scrollbar.
- Manage panel with parent navigation, subfolder/channel search, sorting and channel details.
- Shared themed create/edit dialogs, muted and custom colours, rename and deletion.
- Channel Move/Remove preserves actual YouTube subscriptions. Move success stays in a fixed slot without layout movement and leaves the source subfolder selected. The three-dot channel menu remains.
- Tools: Refresh Subscriptions, Backup, Restore and About. Same-account Refresh keeps Manage open while verification protects writes.
- Complete paginated subscription retrieval; failed refresh retains the complete previous cache.
- Verified single-channel ownership and explicit initial linking. Sign-out preserves folders and owner metadata, while ending the local session and clearing subscription cache. Google consent/token cache is retained. Changing accounts on the YouTube/Gmail website does not switch extension authorisation.
- Account storage/migration preserves legacy linked data. Folder saves and restore update working folders and their account record together; invalid/conflicting data and failed writes do not silently overwrite the setup.
- JSON backup/full restore with owner validation, confirmation and a completed safety-copy download before replacement. Backups exclude credentials, subscription cache and development plan state.
- Free: provisionally four parents and three subfolders per parent. Pro: unlimited folders. Both allow unlimited subscriptions. Expiry preserves access/editing/moves/deletion; creation is blocked while any counts exceed Free, then resumes within available capacity. Full oversized restore is allowed.

Free interface-state persistence is implemented: sidebar section visibility, expanded parents/subfolders, restore after reload once account verification succeeds. Manage stays closed after reload; opening it manually restores the last selected parent/subfolder. Explicit close stays closed. The Subscription Folders launcher has a right-facing chevron when collapsed and a downward chevron when expanded. Menus, searches, edit dialogs and exact pixel scroll positions are not restored. Preferences are local to this browser profile, owner-tagged and excluded from backups. Free light/dark switching is available under Manage > Tools (three dots) > Theme. Dark is the default; the browser-profile preference persists across refresh/restart and updates other open tabs. It covers the sidebar, Manage, menus, shared dialogs and sign-in popup, without changing YouTube itself or saved folder colours. Theme choice is excluded from folder backups. Multiple-account switching, cloud sync and production licensing are not implemented. Cross-tab save conflict protection remains deferred; the existing write guard is per content script.

## Development installation

1. Work from the original development checkout on `premium-folders`. Preserve its identity/OAuth settings and Git directory. Do not substitute the separately configured beta package.
2. Open `chrome://extensions` and enable Developer mode.
3. Use **Load unpacked** and choose the project root containing `manifest.json`, or Reload the existing installation after updates.
4. Refresh YouTube, sign in through the extension popup, check the displayed channel name and confirm initial linking.
5. Open the full YouTube guide and Manage Subscriptions.

The OAuth client must match the installed extension ID, the Google project must have YouTube Data API enabled, and private testers must be configured in the applicable project's Google Auth Platform Audience list. An identifiable YouTube channel is required by this build. Missing/ambiguous channel identification blocks access; do not delete existing folders to troubleshoot sign-in.

Use separate Chrome profiles for isolated account testing. An existing linked installation cannot silently be reassigned to another account. Beta packages use a separate fixed identity/OAuth configuration and are generated from accepted development code, not maintained as a second application source.

## Development plan controls

**Extension Details > Extension options** provides Free/Pro/expired simulations. State persists locally and open tabs update. This is private testing, not paid entitlement verification. Before public sale, replace simulated plan resolution with verified licensing and remove development controls/options. See `development/README.md` for plan checks and `development/account-storage-testing.md` for migration checks.

## Architecture and modularity

Classic scripts load in explicit dependency order in `manifest.json`; no bundler is needed. Shared globals/window bridges remain an explicit dependency. Keep new responsibilities in focused modules with small integrations rather than expanding controllers indiscriminately.

| Area | Responsibility |
| --- | --- |
| `background.js`, `src/background/` | Retrieval orchestration, verified ownership and backup worker operations |
| `src/accounts/` | Versioned account records and legacy migration |
| `src/core/App.js`, `src/main.js` | Startup and shared state/message/storage synchronisation |
| `src/services/ThemeService.js`, `src/styles/theme.css` | Profile theme preference, live updates and shared light palette; existing dark colours remain exact fallbacks |
| `src/services/ViewPreferences.js` | Local view preference validation, serialized persistence and verified restoration |
| `src/services/FolderService.js` | Folder mutations, guarded account-aware persistence and rollback |
| `src/components/SubscriptionManager.js` | Channel assignments through the folder persistence path |
| `src/services/BackupService.js`, `src/shared/BackupFormat.js` | Backup UI and shared format validation; worker handles storage replacement |
| `src/plans/`, `src/components/PlanDialogs/` | Central creation policy, UI gate and limit/details dialogs |
| `src/components/SidebarButton.js`, `FolderDropdown.js`, `SidebarRows.js`, `SidebarFolderMenu.js` | Guide lifecycle, sidebar rendering, row builders and shortcut menus |
| `src/components/FolderDialogs/` | Parent/subfolder entry points, shared controls and dialog lifecycle |
| `src/components/SubfolderView/` | Manage coordinator/state/layout, navigation, channel rendering, menus, moves, notices and delegated actions |
| `src/styles/`, `src/utils/FolderColours.js` | Scoped presentation and shared colour calculations |

Keep CSS separate from behaviour; calculated colours and drag coordinates may remain in JavaScript. Each component owns cleanup for listeners, timers and observers. Preserve escaping, duplicate-name checks, save failure rollback, focus/Escape handling and accepted single-scroll sidebar behaviour. Folder preferences must not bypass account-aware folder writes.

## Verification

Run from the project root in Bash; Node.js built-ins suffice:

```bash
for suite in dialogs manage retrieval startup backup backup-notice folder-plans plan-testing account-setups view-preferences theme; do
  node "tests/$suite.cjs" || break
done
```

All eleven suites passed after theme implementation. See `tests/README.md` for coverage. They simulate DOM/Chrome/API behaviour and do not replace real Chrome OAuth, layout, installation, downloads or persistence testing. Check browser/extension errors and the relevant manual checklist after applying updates.

## Applying this cleanup

This ZIP is a complete replacement source tree without Git metadata. When copying it into the existing checkout, also remove these obsolete files, since extraction over an existing folder does not delete omitted files:

- `HANDOVER.md`
- `REFACTOR-NOTES.md`
- `src/services/StorageService.js`

The removed storage helpers had no active callers. Their manifest entry and obsolete test stubs were removed. Active account migration, FolderService persistence and backup services are retained. Preserve `.git`; no branch operations, commit or push were performed here.
