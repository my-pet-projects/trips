/// <reference types="chrome" />

const STORAGE_KEY = "tripsRawMapSelection";
const SIDE_PANEL_PATH = "src/sidepanel.html";

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({ path: SIDE_PANEL_PATH, enabled: true });
});

/** @param {chrome.runtime.MessageSender} sender */
function openSidePanelFromSender(sender) {
  const tab = sender.tab;
  if (!tab?.id) return;

  if (tab.windowId != null) {
    void chrome.sidePanel.open({ windowId: tab.windowId });
    return;
  }

  void chrome.sidePanel.open({ tabId: tab.id });
}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "TRIPS_ATTRACTION_SELECTED") return;

  const tabId = sender.tab?.id;
  if (tabId == null) return;

  openSidePanelFromSender(sender);

  void chrome.storage.session.set({ [STORAGE_KEY]: message.detail });
});
