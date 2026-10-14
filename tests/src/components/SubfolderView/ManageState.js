// One explicit state record per Manage window; never persisted as folder data.
function createManageState() {
  return {
    parent: null, child: null, query: '', folderQuery: '', sort: 'az',
    moveChannel: null, moveParent: null, moveQuery: '', movePosition: null,
    parentListScroll: 0, optionsChannel: null, descriptionChannels: new Set(),
    arrowHold: { timer: null, interval: null, started: false, suppressClick: false }
  };
}
