import { toggleSettings, areSettingsShown } from "./ui/settings.js";
import { setActiveVisualizer } from "./visualizer.js";

const keys = [];

const secondaryKey = "Control";
const toggleVisualizerKey = "F2";
const escapeKey = "Escape";

const viz1Key = "1";
const viz2Key = "2";
const viz3Key = "3";
// const viz4Key = "4";

function areKeysPressed(...keyNames) {
  return keyNames.every(key => keys.includes(key));
}

document.onkeydown = (event) => {
  if (!keys.includes(event.key)) {
    keys.push(event.key);
  }

  if (areKeysPressed(toggleVisualizerKey)) {
    toggleSettings();
  }

  if (areKeysPressed(secondaryKey, viz1Key)) {
    setActiveVisualizer(0);
  }

  if (areKeysPressed(secondaryKey, viz2Key)) {
    setActiveVisualizer(1);
  }

  if (areKeysPressed(secondaryKey, viz3Key)) {
    setActiveVisualizer(2);
  }

  // if (areKeysPressed(secondaryKey, viz4Key)) {
  //   setActiveVisualizer(3);
  // }

  if (areKeysPressed(escapeKey) && areSettingsShown()) {
    hideSettings();
  }
  else if (areKeysPressed(escapeKey) && !areSettingsShown()) {
    setActiveVisualizer(null);
  }
}

document.onkeyup = (event) => {
  const index = keys.indexOf(event.key);
  if (index !== -1) {
    keys.splice(index, 1);
  }
}