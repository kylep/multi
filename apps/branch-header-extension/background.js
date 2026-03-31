importScripts("config.js");

const RULE_ID = 1;

const ALL_RESOURCE_TYPES = [
  "main_frame", "sub_frame", "stylesheet", "script", "image", "font",
  "object", "xmlhttprequest", "ping", "media", "websocket", "webtransport",
  "webbundle", "other"
];

function applyRule(slug) {
  return chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
    addRules: [{
      id: RULE_ID,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [{
          header: "X-Branch",
          operation: "set",
          value: slug
        }]
      },
      condition: {
        requestDomains: ALLOWED_DOMAINS,
        resourceTypes: ALL_RESOURCE_TYPES
      }
    }]
  });
}

function removeRule() {
  return chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID]
  });
}

async function restoreFromStorage() {
  const { branchSlug } = await chrome.storage.local.get("branchSlug");
  if (branchSlug) {
    await applyRule(branchSlug);
  } else {
    await removeRule();
  }
}

chrome.runtime.onInstalled.addListener(restoreFromStorage);
chrome.runtime.onStartup.addListener(restoreFromStorage);

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.action === "setBranch" && msg.slug) {
      await chrome.storage.local.set({ branchSlug: msg.slug });
      await applyRule(msg.slug);
    } else {
      await chrome.storage.local.remove("branchSlug");
      await removeRule();
    }
    sendResponse({ ok: true });
  })();
  return true; // keep message channel open for async response
});
