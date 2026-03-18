import { handleMessage } from './message-router';
import { setupAlarms, handleAlarm } from './alarm-handler';
import { resumeRescue } from './vip-rescue';

// Open side panel on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Message routing
chrome.runtime.onMessage.addListener(handleMessage);

// Alarm setup and handling
chrome.runtime.onInstalled.addListener(() => {
  setupAlarms();
  resumeRescue().catch(console.warn);
});

// Resume any stale VIP rescue on service worker startup
resumeRescue().catch(console.warn);

chrome.alarms.onAlarm.addListener(handleAlarm);
