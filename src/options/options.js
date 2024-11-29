import { bindInput, toggleHandling, toggleCast } from "../shared/bind-input.js";

export const optionInputs = [
  // ...Array.from(document.getElementById("visualizer-settings").getElementsByTagName("input")),
  // ...Array.from(document.getElementById("visualizer-settings").getElementsByTagName("select")),
  ...Array.from(document.getElementById("visualizer-settings").getElementsByTagName("button"))
];

const optionsInputMap = {
  "auto-connect": {
    propertyName: "autoConnect",
    inputCast: toggleCast,
    inputProp: "ariaPressed",
    onChangeHandling: toggleHandling
  },
  "allow-youtube-music": {
    propertyName: "allowYoutubeMusic",
    inputCast: toggleCast,
    inputProp: "ariaPressed",
    onChangeHandling: toggleHandling
  },
  "allow-youtube": {
    propertyName: "allowYoutube",
    inputCast: toggleCast,
    inputProp: "ariaPressed",
    onChangeHandling: toggleHandling
  },
  "show-banner": {
    propertyName: "showBanner",
    inputCast: toggleCast,
    inputProp: "ariaPressed",
    onChangeHandling: toggleHandling
  },
}

// Bind setting handling
optionInputs.forEach((element) => { bindInput(element, optionsInputMap); });
