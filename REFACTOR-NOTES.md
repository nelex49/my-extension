# Refactor review

The review covered every script loaded by the current manifest and callers in the retired files. The baseline is the last confirmed cumulative patch set, not the older source ZIP attached repeatedly.

| Area | Before | Result |
| --- | --- | --- |
| Folder dialogs | One 810-line file with duplicated dragging and inline presentation | Separate parent/subfolder controllers, shared controls and lifecycle, scoped CSS |
| Sidebar | 216 lines mixing rendering, row builders and shared colours | 111-line sidebar controller, 49-line row builders, shared colour utility |
| Folder operations | Mixed into the subscription assignment component and dialog | FolderService owns mutations; SubscriptionManager owns channel assignments |
| Manage | 420-line controller including selectors and tab policy | 364-line controller plus 55-line read-only helper file |
| Legacy interfaces | Two retired modal modules and seven unloaded SubfolderView scripts | Removed after caller review; manifest loads only active files |
| Limits | Three-parent legacy path and two-subfolder restriction | No folder count restriction during development |

The parent and subfolder controllers are 83 and 63 lines respectively. Line counts are descriptive, not a size target. The Manage controller remains larger because it coordinates one view; splitting every handler into a file would add indirection without clear benefit in this pass.

Correctness changes accompanying extraction: duplicated document drag listeners now have one cleanup path; interpolated folder names are escaped; existing duplicate subfolder names cannot overwrite their channel records; parent Save cannot write twice while pending. The existing parent-create storage failure rollback is retained. Both dialogs support Escape and focus return.

No new deletion or unsubscribe controls are introduced. Existing service implementations for future folder edits remain, but still require deliberate integration, failure-path review and validation in the next stage. The existing global state bridge remains an explicit dependency; moving code into files does not by itself eliminate that dependency.

Automated checks use a simulated DOM and Chrome API. They do not validate real Chrome layout or an authenticated Google session. Live verification remains required. Background retrieval, authentication, popup files, OAuth and permissions are unchanged from the confirmed baseline.
