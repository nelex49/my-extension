// Single source for provisional limits. No billing or production licensing yet.
const FolderPlan = (() => {
  const limits = Object.freeze({ parents: 4, subfolders: 3 });
  const developmentKey = 'developmentFolderPlan';
  let state = 'free';
  function applyStorage(data) {
    const value = data?.[developmentKey];
    state = window.CONFIG?.DEVELOPMENT_PLAN_TESTING === true && ['free', 'pro', 'expired'].includes(value) ? value : 'free';
  }
  function evaluate(data, kind, parentName = null) {
    if (state === 'pro') return { allowed: true };
    const parents = Object.values(data || {});
    const oversized = parents.length > limits.parents || parents.some(parent =>
      Object.keys(parent.subfolders || {}).length > limits.subfolders);
    const atLimit = kind === 'parent' ? parents.length >= limits.parents :
      Object.keys(data?.[parentName]?.subfolders || {}).length >= limits.subfolders;
    return { allowed: !oversized && !atLimit, kind, oversized, expired: state === 'expired' };
  }
  return Object.freeze({ limits, developmentKey, applyStorage, evaluate, get state() { return state; } });
})();
window.FolderPlan = FolderPlan;
