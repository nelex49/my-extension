# YouTube Subscription Manager

A Chrome Manifest V3 extension for organising YouTube subscriptions into parent folders and subfolders.

## Development status

The `ui-redesign` branch contains the new sidebar and the working dark Manage Subscriptions interface. Keep `main` unchanged until the complete redesign has passed regression testing.

The current checkpoint includes complete paginated subscription retrieval, channel images, two-step destination selection, and the first folder-code refactor. Unsubscribe, complete folder editing, compact dark dialogs and backup/restore are still pending.

## Sidebar

- Compact dark interface with muted parent-folder colours.
- Expandable parents and smaller indented subfolders.
- Independently scrollable channel lists; channel links open in new tabs.
- Logged-in launcher: **Subscription Folders**.
- Signed-out launcher: **Sign in to Organise Subs**.
- **Manage Subscriptions** opens the management window.
- **Create Folder** opens the shared creation dialog.
- Rounded scrollbars reserve space to prevent horizontal layout shifts.

Expansion is temporary browsing state and resets on a full page refresh. Existing folder records and saved colours are retained; older bright colours are mapped to muted colours for display.

## Manage Subscriptions

- Dark window with aligned outer panels and consistent padding.
- One row of parent tabs, with long names truncated and full names on hover.
- Visible tabs adapt to available width; the selected parent remains visible when space allows.
- **All Folders (N)** opens a searchable list of all parent folders and remembers its scroll position while Manage remains open. Folder order is unchanged. Visible parent tabs keep stable positions while you switch between them.
- **+ Parent Folder** sits in the parent-section heading row.
- A newly saved parent becomes active, ready for subfolder creation.
- The left panel shows parent-related subfolder colours, a fixed-height heading, centred **+ Subfolder**, and folder search.
- Channel search and A-Z/Z-A sorting work on the selected view.
- Channel profile images use existing thumbnail URLs, with initials as fallback.
- The info button expands the cached channel description. Channel names link to YouTube.
- **Move** opens a two-step picker: choose a parent, then a subfolder. Each list scrolls when needed. The search icon reveals optional search for the current step; search resets when switching steps. Back, outside click and Escape dismiss or navigate the picker.
- **Remove** removes a folder assignment, preserving the YouTube subscription.
- **Refresh subscriptions** is available in the top-right menu.
- Outside clicks and Escape dismiss menus. Closing Manage removes its listeners.

Creation dialogs retain their existing presentation. Rename/recolour/delete controls and their compact dark dialogs are not yet fully connected to the new Manage interface. Backup/restore controls are disabled.

## Account retrieval and counts

`background.js` fetches subscriptions directly from the extension worker. It requests up to 50 results per page and follows `nextPageToken` until the complete list is collected. The previous page-context injection and mock fallback have been removed.

- Concurrent refreshes for the same session share a request.
- Chrome identity supplies a non-interactive access token; a 401 triggers one token-renewal retry.
- Only a complete successful result replaces the account cache.
- A failed refresh retains the previous cache and shows a visible error.
- Logout clears the account cache and rejects late refresh results, while preserving folder records.
- Matching cached channel metadata supplies current names, descriptions and images without extra per-channel API calls.

The header total includes both categorised and uncategorised fetched channels. Uncategorised contains fetched channels whose IDs are not assigned to stored folders. Moving a channel changes its assignment, not the account total. Historical folder records may still exist for channels no longer present in the fetched account list; they are not deleted automatically.

OAuth remains **read-only**. Working unsubscribe requires a separate write-permission and confirmation implementation. Existing unsubscribe service code is not exposed as a working action in the new Manage interface.

## Architecture

The manifest loads classic content scripts in dependency order. There is no bundler or framework requirement.

| Path | Responsibility |
| --- | --- |
| `background.js` | Paginated retrieval, token renewal, refresh status and account cache |
| `src/main.js` | Single startup entry point |
| `src/core/App.js` | Shared state and storage/message synchronization |
| `src/components/SidebarButton.js` | Guide mounting and launcher |
| `src/components/FolderDropdown.js` | Sidebar browsing state and rendering |
| `src/components/SidebarRows.js` | Sidebar row and channel DOM builders |
| `src/components/SidebarFolderMenu.js` | Sidebar shortcut menus using existing dialogs |
| `src/components/FolderDialogs/ParentFolderDialog.js` | Parent form and preview controller |
| `src/components/FolderDialogs/SubfolderDialog.js` | Subfolder form and preview controller |
| `src/components/FolderDialogs/DialogControls.js` | Shared swatches, input counters and escaping |
| `src/components/FolderDialogs/DialogLifecycle.js` | Open/close, focus, dragging and listener cleanup |
| `src/services/FolderService.js` | Parent/subfolder mutations and persistence |
| `src/components/SubscriptionManager.js` | Channel assignment operations |
| `src/components/SubfolderView/ManageViewHelpers.js` | Read-only channel selectors, icons and stable tab ordering |
| `src/components/SubfolderView/SubfolderViewPanel.js` | Manage coordinator: lifecycle, storage updates, focus and component rendering |
| `src/components/SubfolderView/ManageState.js` | Explicit per-window view state |
| `src/components/SubfolderView/ManageLayout.js` | Static window markup |
| `src/components/SubfolderView/ParentFolderNavigation.js` | Parent tabs, overflow search, arrow scrolling, timers and observer cleanup |
| `src/components/SubfolderView/SubfolderNavigation.js` | Parent heading/count and filtered subfolder rows |
| `src/components/SubfolderView/ChannelList.js` | Channel rows, search/sort counts, descriptions and avatars |
| `src/components/SubfolderView/ChannelOptionsMenu.js` | Channel options popup |
| `src/components/SubfolderView/MovePicker.js` | Destination picker, search, folder icons and stable positioning |
| `src/components/SubfolderView/ManageActions.js` | Delegated control actions and calls to existing services |
| `src/utils/FolderColours.js` | Shared muted palette and colour calculations |
| `src/styles/folder-dialogs.css` | Folder form layout and presentation |
| `src/styles/sidebar.css` | Browsing sidebar styles |
| `src/styles/subfolder-view.css` | Manage styles |

Folder form CSS is separate from JS. Runtime colours and drag coordinates remain in JS. Parent creation and subfolder mutations live in the folder service rather than the form controllers. Both dialogs share one lifecycle helper that removes document listeners on every normal close path.

The retired `FolderModals.js`, `SubscriptionDisplay.js`, `ModalManager.js` and seven superseded SubfolderView scripts are removed from this source tree. Their active responsibilities have been moved or were no longer called. Folder limits are disabled during development; premium enforcement is deferred.

Shared application state still uses content-script globals and existing window bridges. This pass does not replace the state model with ES modules or promise that all coupling is eliminated. The extracted files have narrower responsibilities and retain existing callable entry points needed by active components.

Scoped `scrollbar-color: auto !important` resets are used where host-page styling suppresses Chrome custom scrollbar rules. Keep these exceptions limited to extension-owned scroll areas.

## Local installation and testing

1. Open `chrome://extensions` and enable Developer mode.
2. For first installation, use **Load unpacked** and select the project root containing `manifest.json`.
3. For updates, reload the existing extension, then refresh YouTube.
4. Sign in through the extension popup and open YouTube's full guide.
5. Open Manage and wait for subscription retrieval to finish.

The Google OAuth client must be valid for the installed extension ID, and the Google project must have the YouTube Data API enabled. If retrieval fails, inspect the visible error rather than deleting folder data. Check layout at 100% browser zoom.

## Verification

Node.js tests require no additional packages. Run from the project root:

```bash
node tests/startup.cjs
node tests/dialogs.cjs
node tests/manage.cjs
node tests/retrieval.cjs
```

These are simulated DOM/Chrome/API regressions, not a real Chrome rendering or OAuth session test. They cover full manifest startup, sidebar counts and expansion, creation callback focus, optional picker search, scroll memory, duplicate protection, parent save rollback, and listener cleanup across repeated dialog openings. Rendering and live login/logout need manual verification after reloading.


Local simulated DOM/Chrome/API checks covered navigation, search/sorting, menu dismissal, responsive tab selection, creation callback/cancellation, duplicate-name preservation, Move/Remove, image failure fallback and state synchronization.

Retrieval tests covered 150 mocked subscriptions across three pages, concurrent refreshes, cache preservation on partial failure, visible API errors, token renewal, repeated-page-token protection, empty accounts and logout cancellation.

During manual Chrome testing, the user reported 289 total fetched subscriptions and 277 uncategorised, consistent with 12 fetched channels already assigned to folders. A move out of Uncategorised reduced its count by one. These observations are a checkpoint, not complete end-to-end coverage.

Recheck login/logout, long names, scrolling, images, descriptions, creation, Move/Remove, API counts and Console/extension errors after subsequent changes.

## Remaining stages

1. Reconnect parent/subfolder rename, recolour and delete operations through small shared dark dialogs. Review deletion effects and persistence failures before exposing these actions.
2. Add **Unsubscribe from YouTube** inside a channel overflow menu, with appropriate OAuth write permission, renewed consent and a channel-specific confirmation.
3. Implement and validate backup/restore.
4. Review premium limits, upgrade controls and entitlement handling separately.
5. Verify account isolation, stale channel handling, storage failure paths and accessibility before beta release.

Use `folder-refactor` for this reviewable refactor checkpoint if desired. Merge it into `ui-redesign` only after live testing; keep `main` unchanged until the redesign is ready.

## API references

- [YouTube subscriptions.list](https://developers.google.com/youtube/v3/docs/subscriptions/list)
- [YouTube subscription resource](https://developers.google.com/youtube/v3/docs/subscriptions)
- [Chrome identity API](https://developer.chrome.com/docs/extensions/reference/api/identity)

## Manage component refactor

Components receive an explicit `modal` and `state` plus the callbacks they need.
The coordinator creates one state record per window and renders the components in the existing order.
The parent navigation component owns its timers and ResizeObserver; the coordinator calls its cleanup on close.
Folder records and persistence stay in the existing services. No ES-module loader or build step is required:
`manifest.json` loads the component factories before `SubfolderViewPanel.js`.

Superseded CSS declarations and empty override rules were removed without moving active rules.
The effective value for each selector/property/media context was checked against the working source.
Browser visual verification is still required; the regression harness checks behaviour rather than rendering.

## Sidebar scrolling and custom colour checkpoint

The folder area scrolls independently of the heading and action footer. Height limits target roughly six collapsed parent rows, five collapsed subfolder rows and five channel rows, with smaller viewport limits. Expanded content shares the containing list height; six parents are not guaranteed visible while children are expanded. Scroll positions are preserved during sidebar refreshes.

Create Folder uses a stronger blue fill and larger plus. Custom colour reveals a native colour input and requests the browser picker. Parent/subfolder Create and Edit use the same control. Valid saved colours remain exact; text contrast is calculated for custom colours. No folder count caps are introduced.

All four regression suites pass, including custom picker activation and bright parent/subfolder colour persistence with assignments preserved. Real Chrome scrolling, picker appearance and small-screen layout still require manual verification. Unsubscribe is deferred as a possible future premium feature.

## Single-scroll sidebar refinement

Supersedes the nested scrolling trial above: only the main folder browsing area scrolls. Expanded subfolders and channel lists flow normally within it; the heading and action footer stay outside. Custom Colour toggles an inline panel containing the native colour control, editable six-digit hex value and Done button. Opening the panel does not automatically launch the browser popup. Invalid hex input does not overwrite the selected colour. Done closes the inline panel; the browser owns its native popup dismissal.

Sidebar alignment refinement: the browsing area reserves an 8px gap before its 6px scrollbar and 14px on the left to balance that combined right-side space. Existing nested indentation and the single scrolling area are retained. Scrollbar thumb is subdued; hover remains brighter.

Sidebar hierarchy refinement: parent folder icons are filled using the row text colour; subfolders retain the smaller outlined icon. Manage and Move picker icons are unchanged.

Sidebar icon revision: supersedes the filled-icon trial. Both levels use outlines. Outline colour is derived from the folder fill, lighter on dark backgrounds and darker on light backgrounds. Subfolders retain their smaller size.

Expanded sidebar subfolders no longer have an inset outline. Expansion arrows, ellipsis hover styling and keyboard focus outlines remain.
