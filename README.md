# YouTube Subscription Manager

A Chrome Manifest V3 extension for organising YouTube subscriptions into parent folders and subfolders.

## Branch status

- `main` retains the original interface during development.
- `ui-redesign` contains the incremental interface redesign.
- The new sidebar is implemented. The Manage Subscriptions redesign is the next stage.
- Keep changes on `ui-redesign` until the complete redesign has been tested.

## Current sidebar

- Compact dark panel with muted folder colours.
- Expandable parent folders and smaller, indented subfolders.
- Independently scrollable channel lists and links that open channels in new tabs.
- Subscription counts based on stored folder entries.
- A launcher labelled **Subscription Folders**, sized from a neighbouring YouTube navigation row.
- A signed-out launcher labelled **Sign in to Organise Subs** that opens the existing login popup.
- **Manage Subscriptions** opens the existing management interface.
- **Create Folder** opens the shared existing creation dialog directly.
- New parent folders are suggested the first unused muted palette colour, then the least-used colour when all are represented. Users can select another colour.
- Saved palette colours display directly. Older colours are mapped to muted display colours without migrating stored records.
- Subfolders display darker shades of their parent colour.

Expansion is temporary browsing state and resets on a full page refresh. Multiple folders can remain expanded. Refreshes preserve the panel's open/closed state and scroll positions for channel lists that remain rendered.

The outer panel and channel lists reserve scrollbar space to prevent horizontal layout shifts. Custom Chrome scrollbars use rounded thumbs without arrow buttons.

## Existing foundation

The redesign retains the existing Google authentication, YouTube API integration, Chrome storage keys and folder records. Folder operations and the current Manage interface remain in use during the transition.

Backup/restore is not implemented yet. Premium upgrade controls and entitlement handling are also future work; existing folder limits remain in place.

## Architecture

| Path | Responsibility |
| --- | --- |
| `manifest.json` | MV3 configuration, permissions, OAuth settings and content-script load order |
| `background.js` | Background authentication/subscription integration and tab communication |
| `popup.html`, `popup.js` | Existing extension login/logout interface |
| `src/main.js` | Single startup entry point |
| `src/core/App.js` | Initial state, storage changes and subscription messages |
| `src/components/SidebarButton.js` | Logged-in/logged-out launcher and guide mounting |
| `src/components/FolderDropdown.js` | Sidebar rendering, expansion, channel links and palette helpers |
| `src/components/FolderModals.js` | Existing shared folder creation/editing dialogs |
| `src/components/SubscriptionManager.js` | Existing folder/subscription operations |
| `src/components/SubfolderView/` | Current Manage Subscriptions interface |
| `src/components/SubscriptionDisplay.js` | Legacy subscription views retained pending further cleanup |
| `src/components/ModalManager.js` | Existing modal helpers |
| `src/services/` | Authentication, YouTube API and storage helpers |
| `src/utils/` | Configuration and shared utilities |
| `src/styles/sidebar.css` | Scoped sidebar styles |
| `src/styles/subfolder-view.css` | Existing Manage styles, scoped to its modal |

Scripts load in manifest order and currently share functions/state through content-script globals and `window` properties. This coupling is reduced as relevant components are replaced; no framework has been added.

### CSS exception

One scoped `scrollbar-color: auto !important` declaration applies only to the extension sidebar and channel lists. During Chrome testing, the computed colour was transparent instead of `auto`, suppressing custom scrollbar pseudo-element styling. This override restored the intended rendering. Avoid additional `!important` declarations without a demonstrated host-page conflict.

## Load and test locally

1. Open `chrome://extensions` and enable Developer mode.
2. For first installation, choose **Load unpacked** and select the project root containing `manifest.json`.
3. For updates, reload the existing extension rather than removing and reinstalling it.
4. Refresh YouTube and open its full left navigation.
5. Sign in through the existing extension popup if needed.

The existing OAuth configuration must be valid for the installed extension ID. This README does not establish a separate production OAuth setup.

## Validation

The incremental patches passed JavaScript parsing and simulated DOM/storage checks for startup, launcher mounting, login state, expansion, channel links, palette selection and scroll preservation.

Manual Chrome testing during sidebar development confirmed login/logout, folder navigation, muted styling and scrollbar-arrow removal. Recheck the following after each change:

- Login/logout and launcher state.
- Parent/subfolder expansion and empty states.
- Channel links, independent scrolling and stable row widths.
- Folder creation, selected colours and persistence after refresh.
- Existing Manage search, move/remove operations and sidebar count updates.
- YouTube page navigation and guide close/reopen.
- Extension and DevTools Console errors.

These checks do not constitute full end-to-end coverage of the entire extension.

## Next stages

1. Match the agreed Manage Subscriptions reference: dark layout, parent tabs, subfolder navigation and subscription list.
2. Reconnect existing management operations gradually and replace large dialogs with compact dark dialogs.
3. Remove superseded code only after checking its remaining callers.
4. Implement backup/restore once the folder model is stable.
5. Address premium UI and entitlement rules separately.

Keep the sidebar design consistent while developing Manage. Test and commit each working stage on `ui-redesign`; merge to `main` after the complete redesign passes regression testing.
