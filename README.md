# YouTube Subscription Manager

A Chrome Manifest V3 extension for organising YouTube subscriptions into parent folders and subfolders.

## Development status

The `ui-redesign` branch contains the new sidebar and the working dark Manage Subscriptions interface. Keep `main` unchanged until the complete redesign has passed regression testing.

The current checkpoint includes complete paginated subscription retrieval and channel images. Unsubscribe, complete folder editing, compact dark dialogs and backup/restore are still pending.

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
- **All Folders (N)** opens a searchable list of all parent folders.
- **+ Parent Folder** sits in the parent-section heading row.
- A newly saved parent becomes active, ready for subfolder creation.
- The left panel shows parent-related subfolder colours, a fixed-height heading, centred **+ Subfolder**, and folder search.
- Channel search and A-Z/Z-A sorting work on the selected view.
- Channel profile images use existing thumbnail URLs, with initials as fallback.
- The info button expands the cached channel description. Channel names link to YouTube.
- **Move** assigns a channel to a destination subfolder.
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

| Path | Responsibility |
| --- | --- |
| `manifest.json` | MV3 configuration, permissions, OAuth settings and content-script order |
| `background.js` | Paginated API retrieval, token renewal, refresh status and cache updates |
| `popup.html`, `popup.js` | Existing Google login/logout interface |
| `src/main.js` | Single startup entry point |
| `src/core/App.js` | Shared state and storage/message synchronization |
| `src/components/SidebarButton.js` | Launcher and guide mounting |
| `src/components/FolderDropdown.js` | Sidebar rendering and muted palette helpers |
| `src/components/SubfolderView/SubfolderViewPanel.js` | New Manage view, navigation and row actions |
| `src/components/SubscriptionManager.js` | Existing folder and assignment operations |
| `src/components/FolderModals.js` | Shared existing folder creation/editing dialogs |
| `src/components/SubscriptionDisplay.js` | Legacy views pending further caller review and cleanup |
| `src/components/ModalManager.js` | Existing modal helpers |
| `src/services/` | Authentication, cached-data loading, storage and legacy API helpers |
| `src/utils/` | Configuration and shared utilities |
| `src/styles/sidebar.css` | Scoped browsing-sidebar styles |
| `src/styles/subfolder-view.css` | Scoped Manage styles |

Only `SubfolderViewPanel.js` from the old SubfolderView module group is loaded by the manifest. Six superseded scripts remain on disk for now but do not run alongside the replacement.

Scripts currently share content-script globals and `window` properties. No framework has been added. Reduce coupling as relevant components are replaced; avoid unrelated refactors during staged testing.

Scoped `scrollbar-color: auto !important` resets are used where host-page styling suppresses Chrome custom scrollbar rules. Keep these exceptions limited to extension-owned scroll areas.

## Local installation and testing

1. Open `chrome://extensions` and enable Developer mode.
2. For first installation, use **Load unpacked** and select the project root containing `manifest.json`.
3. For updates, reload the existing extension, then refresh YouTube.
4. Sign in through the extension popup and open YouTube's full guide.
5. Open Manage and wait for subscription retrieval to finish.

The Google OAuth client must be valid for the installed extension ID, and the Google project must have the YouTube Data API enabled. If retrieval fails, inspect the visible error rather than deleting folder data. Check layout at 100% browser zoom.

## Verification

Local simulated DOM/Chrome/API checks covered navigation, search/sorting, menu dismissal, responsive tab selection, creation callback/cancellation, duplicate-name preservation, Move/Remove, image failure fallback and state synchronization.

Retrieval tests covered 150 mocked subscriptions across three pages, concurrent refreshes, cache preservation on partial failure, visible API errors, token renewal, repeated-page-token protection, empty accounts and logout cancellation.

During manual Chrome testing, the user reported 289 total fetched subscriptions and 277 uncategorised, consistent with 12 fetched channels already assigned to folders. A move out of Uncategorised reduced its count by one. These observations are a checkpoint, not complete end-to-end coverage.

Recheck login/logout, long names, scrolling, images, descriptions, creation, Move/Remove, API counts and Console/extension errors after subsequent changes.

## Remaining stages

1. Add **Unsubscribe from YouTube** inside a channel overflow menu, with appropriate OAuth write permission, renewed consent and a channel-specific confirmation.
2. Reconnect parent/subfolder rename, recolour and delete operations through small shared dark dialogs.
3. Implement and validate backup/restore.
4. Review premium limits, upgrade controls and entitlement handling separately.
5. Remove superseded files after verifying remaining callers and regression tests.

Keep working checkpoints on `ui-redesign`; merge into `main` after the complete redesign is ready.

## API references

- [YouTube subscriptions.list](https://developers.google.com/youtube/v3/docs/subscriptions/list)
- [YouTube subscription resource](https://developers.google.com/youtube/v3/docs/subscriptions)
- [Chrome identity API](https://developer.chrome.com/docs/extensions/reference/api/identity)
