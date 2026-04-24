const ext = globalThis.browser ?? globalThis.chrome;

ext.runtime.onInstalled.addListener(() => {
  console.log('TOL Scribe EMR Filler installed');
});

function queryActiveTab() {
  return new Promise((resolve) => {
    ext.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs || []));
  });
}

function sendMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    ext.tabs.sendMessage(tabId, message, (response) => {
      const runtimeError = ext.runtime?.lastError;
      if (runtimeError) {
        reject(runtimeError);
        return;
      }
      resolve(response);
    });
  });
}

ext.commands?.onCommand?.addListener(async (command) => {
  if (command !== 'toggle-inline-panel') return;
  const [tab] = await queryActiveTab();
  if (!tab?.id) return;
  try {
    await sendMessage(tab.id, { action: 'toggleInlinePanel' });
  } catch (error) {
    console.warn('TOL could not toggle the inline panel on the active tab.', error);
  }
});
