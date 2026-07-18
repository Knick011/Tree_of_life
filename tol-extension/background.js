const ext = globalThis.browser ?? globalThis.chrome;

ext.runtime.onInstalled.addListener(() => {
  console.log('TOL Scribe EMR Filler installed');
});

ext.runtime.onMessageExternal?.addListener((message, sender, sendResponse) => {
  if (message?.source !== 'tol-scribe-web') {
    return false;
  }

  if (message.action === 'ping') {
    sendResponse({
      installed: true,
      name: 'TOL Scribe EMR Filler',
      version: ext.runtime.getManifest?.().version ?? null,
    });
    return false;
  }

  // Direct payload push from the web app ("Send to EMR"): store it so the
  // popup and the inline page panel are pre-loaded without clipboard hops.
  if (message.action === 'payload' && message.payload?._tol === true) {
    ext.storage.local.set(
      {
        tolPushedPayload: message.payload,
        tolPushedAt: Date.now(),
      },
      () => {
        sendResponse({ ok: true });
      },
    );
    return true; // keep the message channel open for the async response
  }

  return false;
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
