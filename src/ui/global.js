// This loads the global elements and exports global elements used in other modules, as we await loading the global elements we only export those elements once they have been loaded into the DOM
// It could be possible to load the canvas, settings and notification banner seperately and only load them in when needed, but it more efficent to load them all in at once so we're rolling with this

// Inject global UI
await fetch(chrome.runtime.getURL('./ui/global-page-elements.html')).then(r => r.text()).then(html => {
  document.body.insertAdjacentHTML('beforeend', html);
});

/** @type {HTMLCanvasElement} */
export const canvas = document.getElementById("global-canvas");

/** @type {HTMLDivElement} */
export const settingsModalBackground = document.getElementById("settings-modal-background");

/** @type {HTMLDivElement} */
export const primaryColorSample = document.getElementById("primary-color-sample");

export const visualizerToggleButtons = document.getElementById("vizualizer-button-container").getElementsByTagName("button");

/** @type {HTMLButtonElement} */
export const globalOptionsButton = document.getElementById("global-options-button");

/** @type {Array<HTMLSelectElement | HTMLInputElement | HTMLButtonElement>} */
export const settingsInputs = [
  ...Array.from(document.getElementById("visualizer-settings").getElementsByTagName("input")),
  ...Array.from(document.getElementById("visualizer-settings").getElementsByTagName("select")),
  ...Array.from(document.getElementById("visualizer-settings").getElementsByTagName("button"))
];

/** @type {HTMLDivElement} */
export const notificationsBanner = document.getElementById("notifications-banner");
