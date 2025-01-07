import { userSettings } from '../shared/user-settings.js';
import { getCurrentProfile, profiles } from '../shared/profile.js';

document.getElementById('options-link').onclick = () => {
  chrome.runtime.openOptionsPage();
};

document.getElementById('visualizer-settings-button').onclick = async () => {
  const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  await chrome.tabs.sendMessage(tab.id, "openVisualizerSettings");
};

const irrelevantContent = document.getElementById("irrelevant");
const exceptionContent = document.getElementById("exception");
const disabledContent = document.getElementById("disabled");
const loadedContent = document.getElementById("loaded");

switch (await getCurrentProfile()) {
  case profiles.music:
    console.log("music");
    if (userSettings.allowYoutubeMusic) {
      loadedContent.classList.remove("hidden");
    }
    else {
      disabledContent.classList.remove("hidden");
    }
    break;
  case profiles.youtube:
    console.log("youtube");
    if (userSettings.allowYoutube) {
      loadedContent.classList.remove("hidden");
    }
    else {
      disabledContent.classList.remove("hidden");
    }
    break;
  case profiles.exception:
    exceptionContent.classList.remove("hidden");
    break;
  default:
  case profiles.default:
    console.log("default");
    irrelevantContent.classList.remove("hidden");
    break;
}
