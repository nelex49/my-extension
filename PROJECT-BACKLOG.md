# YouTube Subscription Manager - Project Backlog

Updated: 15 October 2026

This is the running record of deferred work and future ideas. Update statuses and decisions as work progresses. An idea appearing here is not approval to build it or a promise that it will be premium.

## Current checkpoint

- Working branch: `ui-redesign`.
- Authoritative source: `extension-latest(3).zip`. Do not use older ZIPs.
- User confirms the current checkpoint is committed and pushed.
- Dark Manage interface, modular components, shared dialogs, custom colours and sidebar refinements are accepted.
- Moves use one complete save. Failed moves/removals preserve previous assignments and show an error. Overlapping saves within one tab are guarded.
- One verified YouTube channel owns the folder setup. Other authorised channels are blocked. Sign-out preserves folders and ownership.
- Repeat sign-in and popup timing were manually confirmed by the user. The supplied HANDOVER.md still says confirmation is needed; that statement is superseded by the current checkpoint.
- All four regression suites passed after backup/restore implementation, plus the new backup tests. Live Chrome checks for this addition are pending.
- Backup/restore is now implemented in this replacement ZIP; it has not been committed or pushed.

## Agreed next steps

| Order | Work | Status / decision needed |
| --- | --- | --- |
| 1 | Backup and restore | Implemented: manual versioned JSON backup, full replacement restore for the same verified owner, explicit confirmation and completed safety-copy download before restore. User confirmed backup/deletion/restore recovery in Chrome. Header feedback refinement implemented; visual check pending. No merge or selective recovery. |
| 2 | Small friends beta | Run for 1-2 weeks after backup/restore work is agreed and completed. |
| 3 | Beta feedback | Fix reported problems and review usability before adding premium scope. |
| 4 | Premium planning | Decide the paid feature set after feedback. No final free/premium split is agreed. |

## Deferred reliability work

| Item | Current position | When to revisit |
| --- | --- | --- |
| Protection against saves from separate YouTube tabs | Deferred in this discussion. Each tab can still save an older complete copy over a newer change. Storage notifications normally update the other tabs, but do not guarantee conflict prevention. No such failure has been observed in this thread; frequency is unconfirmed. | Consider before wider release, or sooner if testing reveals lost changes. |

The reviewed proposal is a shared background save coordinator with a stored version check. A stale save would be rejected, the tab would receive the latest folders, and the user would retry. A queue alone would not prevent stale copies overwriting changes. This proposal has not been approved for implementation. Automatic merging is also not agreed.

## Possible premium features

| Idea | Status | Open question |
| --- | --- | --- |
| Separate folder setups for multiple YouTube accounts/channels | Explicit premium candidate; deferred. Current behaviour remains one owner with other channels blocked. | How should switching, ownership and separate setups work? |
| Selective restore | Possible premium feature; deferred. | Recover individual folders without replacing the whole setup; duplicate names and assignments need rules. |
| Scheduled automatic backups | Possible premium feature; deferred. | Scheduling, destination and retention are undecided. Manual weekly backups are currently the user's choice. |
| Backup history | Possible premium feature; deferred. | Storage, retention and recovery experience are undecided. |
| Cross-device sync | Deferred; possible premium candidate, not an agreed paid feature. Current folders use local Chrome storage. | Which sync approach, data format and conflict rules are appropriate? |

Source note: the supplied handover records that a possible Chrome sync design would use compact account/folder/channel-ID records instead of the current full subscription objects. This is a design note to evaluate, not a completed sync plan. No hosted database is currently planned.

## Other deferred features and ideas

| Item | Status / scope |
| --- | --- |
| Unsubscribe | Deferred. Behaviour, permissions and safeguards require discussion before building. Free/premium placement undecided. |
| Remember sidebar state | Deferred. Remembering sidebar open state, expanded folders/subfolders and scroll position was recorded as optional later work. |
| Light theme toggle | Earlier design idea: dark remains the default, with an optional light theme. Not approved for implementation in the current scope. |
| Drag-and-drop | Earlier future idea: move channels into folders and rearrange folders while keeping the existing click-based Move controls. Deferred; free/premium placement undecided. |
| Final branding and custom toolbar icon | Deferred. Earlier discussion included convenient toolbar access to the sign-in/sign-out popup. Final name, icon and presentation remain to be decided. |

## Working rules

- Preserve accepted appearance and behaviour.
- Keep code modular and reuse existing services and dialogs.
- Discuss new features before implementing them.
- Do not touch `main`, commit or push without explicit instructions.
- Run dialogs, manage, retrieval and startup regression suites after application changes.
- Deliver one complete replacement ZIP after implementation work.
- Keep this backlog with the project and include its current version in the next replacement ZIP.

## Record basis

Compiled from the user's current checkpoint and this thread, the supplied latest source's HANDOVER.md, and earlier project ideas visible in the conversation context. Older source archives were not used. Items from earlier discussions are identified as ideas rather than confirmed commitments.

## Backup/restore decisions - 15 October 2026

- Basic manual backup and full restore are the agreed initial scope. No automatic weekly schedule.
- Backup contains folders, subfolders, colours, assigned channel records and owner identity; excludes login tokens and Google permissions.
- Restore replaces the complete setup, so changes since the selected backup are removed. It does not alter actual YouTube subscriptions.
- Confirm before downloading a safety copy and replacing the setup. Cancelled/failed safety download stops restore.
- Require the same signed-in, verified owner. After a reinstall, sign in and link the empty installation to that same channel before restoring.
- Downloads permission is used to confirm completion. Files have dated backup/before-restore names.
- Invalid format/version, account mismatch or failed storage write does not replace existing folders.
- A detected account/folder change during the safety download aborts restore. General cross-tab concurrency remains deferred.

- Backup feedback refinement: short success notices inside Manage, five-second display and 300ms fade; persistent dismissible errors. Automated suites pass; final message placement awaits user review.

Latest feedback adjustment: backup/restore notices are now centred below the Manage header and above folder navigation, rather than beside the menu. Success displays for four seconds then fades over 300ms. Errors remain dismissible. User confirmed the previous build worked; this placement awaits visual review.

- Portable beta: user confirmed sign-in, fresh setup, folder/subfolder creation and a channel move on the second computer. Restart/persistence and backup/restore checks remain.
- Popup fix now included in original project: single in-popup account confirmation, fresh/existing folder wording, no native confirm dialog. Original development identity/configuration preserved.
