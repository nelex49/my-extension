# Folder-plan development testing

Use this complete source on `premium-folders`, starting from the tested `ui-redesign` checkpoint. No Git metadata is included; replacing these files does not switch branches. Do not commit or push until manual testing is accepted.

## Open the controls

1. Replace the source in your existing development extension folder. Keep its original installation and identity.
2. In Chrome, open `chrome://extensions` and reload that extension. Reload YouTube too.
3. Open the extension's **Details**, then **Extension options**. This opens the separate folder-plan test page. Alternatively right-click its toolbar icon and choose **Options**.
4. Choose **Test Free**, **Test Pro**, or **Test expired Pro**. Open YouTube tabs apply the choice without reloading. The choice persists across restarts in this Chrome profile.

These are development simulations, not subscription verification or payment controls. The build defaults to Free when no valid test state is saved. Switching states never deletes folders. Test controls do not need a signed-in account, but normal creation and restore still require the existing verified linked account.

## Manual checks

Back up your real setup first. Use a temporary folder setup if you want to delete folders during testing. A pre-existing setup above the Free limits will be preserved and will already trigger the creation restriction.

- **Free:** create four parent folders; the fifth should show the Pro prompt. Within a parent create three subfolders; the fourth should show the prompt. Other parents can still use their three subfolders when the whole setup is within the limits. Channels have no plan count limit.
- **Prompt:** Not now, Escape and outside-click should close it without changes. Upgrade/Renew shows Pro information and states that purchases are not available yet; no payment is attempted.
- **Pro:** create more than four parents and more than three children in one parent. Export a backup of this larger setup.
- **Expired:** switch from Pro to expired. Everything remains accessible. Rename, change colours, delete folders, and move/remove channels. Creation should be blocked while any parent or child count exceeds the Free limits.
- **Reduce:** delete down to at most four parents and at most three subfolders per parent. Creation becomes available where there is room: at four parents a fifth is still blocked; a parent with two children can receive a third.
- **Restore:** while Free or expired, restore the larger backup. Confirm its complete structure returns after the safety-copy download. New creation stays restricted; editing, moving and deletion work. Restore does not change the current test plan.
- **Live change:** open a create form under Pro, then change to expired in the test page before saving. Saving must recheck the limit and must not add an excess folder.
- **Regression:** verify sidebar creation/editing, Manage navigation, centred move feedback, Refresh, backup, restore, About, sign-out and return sign-in.
- Reload YouTube/restart Chrome and confirm both folder persistence and the selected test state.

## Layout and modules

- `src/plans/FolderPlan.js`: the only definition of the provisional 4/3 limits and creation policy. Also resolves the explicitly development-only test state.
- `src/plans/FolderCreationGate.js`: bridges the policy to the limit dialog. Forms and creation services both use it.
- `src/components/PlanDialogs/FolderLimitDialog.js`: themed limit/renewal prompt and Pro details; no checkout integration.
- `development/plan-testing.*`: test state controls, exposed through development Extension options.

No real payment/entitlement system is implemented in this section. Before public release, replace simulated plan resolution with the agreed licensing flow, set `CONFIG.DEVELOPMENT_PLAN_TESTING` to `false`, and remove the development `options_ui` entry/page from the release package. Disabling the flag makes any stored test Pro state ineffective. Test plan state is excluded from exported backups.

Cross-tab folder save conflict protection remains deferred. This addition retains the existing per-tab save guard and account verification rules.

## Automated checks

Run from the extension folder in Bash:

```bash
node tests/dialogs.cjs
node tests/manage.cjs
node tests/retrieval.cjs
node tests/startup.cjs
node tests/backup.cjs
node tests/backup-notice.cjs
node tests/folder-plans.cjs
node tests/plan-testing.cjs
node tests/account-setups.cjs
```

The tests simulate DOM and Chrome APIs. Chrome appearance and real installation behaviour require the manual checks above.
