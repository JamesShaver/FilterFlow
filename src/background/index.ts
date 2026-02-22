import { handleMessage } from './message-router';
import { setupAlarms, handleAlarm } from './alarm-handler';

// Open side panel on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Message routing
chrome.runtime.onMessage.addListener(handleMessage);

// Alarm setup and handling
chrome.runtime.onInstalled.addListener(() => {
  setupAlarms();
});

chrome.alarms.onAlarm.addListener(handleAlarm);
