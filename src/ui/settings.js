import { settingsModalBackground, primaryColorSample, settingsInputs, visualizerToggleButtons, globalOptionsButton } from "./global.js"
import { setActiveVisualizer } from "../visualizer.js";
import { bindInput, toggleHandling, toggleCast } from "../shared/bind-input.js";
import "../types/input-map.js";

function showSettings() {
  settingsModalBackground.classList.add("visible");
}

function hideSettings() {
  settingsModalBackground.classList.remove("visible");
}

export function toggleSettings() {
  if (areSettingsShown()) {
    hideSettings();
  } else {
    showSettings();
  }
}

globalOptionsButton.onclick = () => {
  // We can't open the options page from here so we send a message to the service worker to do it for us.
  chrome.runtime.sendMessage("openGlobalOptions");
}

export function areSettingsShown () {
  return settingsModalBackground.classList.contains("visible");
}

settingsModalBackground.onclick = (e) => { if (e.target.id === 'settings-modal-background') { hideSettings(); } }
document.getElementById("back-button").onclick = () => { hideSettings() };
for (let i = 0; i < visualizerToggleButtons.length; i++) {
  visualizerToggleButtons[i].onclick = () => setActiveVisualizer(i);
}

// These are casts that are used for a lot of settings so we define them here to reuse them
const numberCast = input => { return +input }

// Color handling is used both during init and update so we define the logic here to reduce duplication
const primaryColorHandling = (input) => {
  // CSS keywords that are valid but we don't want to support in input
  const unwantedKeywords = ["unset", "initial", "inherit", "transparent", "currentColor"];
  if(CSS.supports('color', input) && !unwantedKeywords.includes(input)) {
    primaryColorSample.style.backgroundColor = input; // set background color to match
    if (primaryColorSample.innerText) primaryColorSample.innerText = ''; // Set innerText to nothing if something was set inside of it
  }
  else {
    console.error("invalid color selected:", input);
    // Because this color isn't something that's supported we want to let the user know something is wrong with a ? in the color example
    primaryColorSample.style.backgroundColor = "transparent";
    primaryColorSample.innerText = '?';
  }
}

/** @type { inputHandlingMap } */
const settingsInputMap = {
  "max-height": {
    propertyName: "maxHeight",
    inputCast: numberCast,
    inputProp: "value"
  },
  "color-cycle": {
    propertyName: "colorCycle",
    inputCast: toggleCast,
    inputProp: "ariaPressed",
    onChangeHandling: toggleHandling
  },
  "primary-color": {
    propertyName: "primaryColor",
    inputProp: "value",
    onChangeHandling: primaryColorHandling,
    initHandling: primaryColorHandling
  },
  "default-visualizer": {
    propertyName: "defaultVisualizer",
    inputCast: (input) => {
      if(input === "") {
        return null;
      }
      return numberCast(input);
    },
    inputProp: "value",
    initHandling: (input) => {
      setActiveVisualizer(input);
    }
  }
}

// Bind setting handling
settingsInputs.forEach((element) => { bindInput(element, settingsInputMap); });
