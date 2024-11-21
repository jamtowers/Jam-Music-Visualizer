import { settingsModalBackground, primaryColorSample, settingsInputs, visualizerToggleButtons } from "./global.js"
import { userSettings } from '../shared/user-settings.js';
import { setActiveVisualizer } from "../visualizer.js";
import { showBanner } from "./banner.js";

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

export function areSettingsShown () {
  return settingsModalBackground.classList.contains("visible");
}

settingsModalBackground.onclick = (e) => { if (e.target.id === 'settings-modal-background') { hideSettings(); } }
document.getElementById("back-button").onclick = () => { hideSettings() };
for (let i = 0; i < visualizerToggleButtons.length; i++) {
  visualizerToggleButtons[i].onclick = () => setActiveVisualizer(i);
}

// These are casts that are used for a lot of settings so we define them here to reuse them
const defaultCast = input => { return input }
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

/**
 * @typedef settingsInput
 * @type object
 * 
 * @property {string} propertyName Name of property for corresponding property in userSettings
 * @property {(input) => any} inputCast Casting function for this setting input
 * @property {string} inputProp Name of property for corresponding value on input element
 * @property {((input) => void) | undefined} onChangeHandling Additional handling for this setting run on update, gets passed current input value
 * @property {((input) => void) | undefined} initHandling Additional handling for this setting run on initalisation, gets passed current input value
 */


/**
 * Keys are the input IDs for the particular setting
 * @type {Object.<string, settingsInput>}
 */
const settingsInputMap = {
  "max-height": {
    propertyName: "maxHeight",
    inputCast: numberCast,
    inputProp: "value"
  },
  "color-cycle": {
    propertyName: "colorCycle",
    inputCast: defaultCast,
    inputProp: "checked"
  },
  "primary-color": {
    propertyName: "primaryColor",
    inputCast: defaultCast,
    inputProp: "value",
    onChangeHandling: primaryColorHandling,
    initHandling: primaryColorHandling
  },
  "auto-connect": {
    propertyName: "autoConnect",
    inputCast: defaultCast,
    inputProp: "checked"
  },
  "allow-youtube-music": {
    propertyName: "allowYoutubeMusic",
    inputCast: defaultCast,
    inputProp: "checked"
  },
  "allow-youtube": {
    propertyName: "allowYoutube",
    inputCast: defaultCast,
    inputProp: "checked"
  },
  "show-banner": {
    propertyName: "showBanner",
    inputCast: defaultCast,
    inputProp: "checked",
    initHandling: (input) => {
      if(input) {
        showBanner("Visualizer started; Press F2 to show settings.");
      }
    }
  },
  "default-visualizer" : {
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
settingsInputs.forEach((element) => {
  const { propertyName, inputCast, inputProp, onChangeHandling: additionalHandling, initHandling: additionalInitHandling } = settingsInputMap[element.id];

  // Set inital value, if it's null populate it with an empty string
  if(userSettings[propertyName] !== null) {
    element[inputProp] = userSettings[propertyName];
  }
  else {
    element[inputProp] = "";
  }

  // Do any inital handling if it exists
  if(additionalInitHandling) additionalInitHandling(userSettings[propertyName]);

  // Bind change event
  element.onchange = () => {
    userSettings[propertyName] = inputCast(element[inputProp]);
    chrome.storage.sync.set(userSettings);
    // Do any additonal handling if it exists
    if(additionalHandling) additionalHandling(userSettings[propertyName]);
  }
});