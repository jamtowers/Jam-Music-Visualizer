// Greyson Flippo
// Ac130veterans@gmail.com
// GreysonFlippo@gmail.com
// created 6-6-2016 :)
// updated 4-25-2021
// https://chrome.google.com/webstore/detail/music-visualizer-for-goog/ofhohcappnjhojpboeamfijglinngdnb

import { calcBars, drawBarVis } from './bar-vis.js';
import { drawWaveVis, drawCircleVis } from './wave-vis.js';

/** @type {number | null} */
let activeVisualizer = null;

// TODO: type these params properly
/**
 * Visualizer callback
 * @callback drawVisualizerCallback
 * @param {CanvasRenderingContext2D} canvasCtx
 * @param {HTMLCanvasElement} canvas
 * @param {any} audioSource
 */ 

/**
 * Array of callbacks for each of the visualisers, array index should match with visualizers enum
 * @type {drawVisualizerCallback[]}
 */
const visualizerDrawers = [drawBarVis, drawWaveVis, drawCircleVis];

/**
 * enum for profiles
 * @readonly
 * @enum {symbol}
 */
const profiles = Object.freeze({
  default: Symbol("default"),
  music: Symbol("music"),
  youtube: Symbol("youtube"),
});

let profile = profiles.default;
if (window.location.href.startsWith('https://music.youtube.com')) profile = profiles.music;
else if (window.location.href.startsWith('https://youtube.com')) profile = profiles.youtube;
Object.freeze(profile);

// https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize
const fftUni = 8192;

const mediaElements = [];

let animationFrame = null;

// Audio context can be reused between sources, so we create one global one here
const audioCtx = new AudioContext();

let previousAudioSource = 0;

let userPreferences = {
  colorCycle: true,
  autoConnect: true,
  showBanner: true,
  primaryColor: 'white',
  maxHeight: 100,
  smoothingTimeConstant: 0,
  allowYoutube: true,
  allowYoutubeMusic: true,
  allowOther: false,
  defaultVisualizer: null,
};

// Load saved user preferences and copy them to object above
const initUserPreferences = chrome.storage.sync.get().then((items) => {
  // Copy the data retrieved from storage into userPreferences.
  Object.assign(userPreferences, items);
});

// Inject UI
await fetch(chrome.runtime.getURL('/global-page-elements.html')).then(r => r.text()).then(html => {
  document.body.insertAdjacentHTML('beforeend', html);
});

// Get references for elements we need later on

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas1");

/** @type {HTMLDivElement} */
const settingsModalBackground = document.getElementById("settings-modal-background");

/** @type {HTMLDivElement} */
const notificationsBanner = document.getElementById("notifications-banner");

/** @type {HTMLDivElement} */
const primaryColorSample = document.getElementById("primary-color-sample");

var settingsInputs = [];
settingsInputs = Array.prototype.concat.apply(settingsInputs, document.getElementById("visualizer-settings").getElementsByTagName("input"));
settingsInputs = Array.prototype.concat.apply(settingsInputs, document.getElementById("visualizer-settings").getElementsByTagName("select"));

const visualizerToggleButtons = document.getElementById("vizualizer-button-container").getElementsByTagName("button");

// Add click events

settingsModalBackground.onclick = (e) => { if (e.target.id === 'settings-modal-background') { hideSettings(); } } //TODO: work out if we need this target check
document.getElementById("back-button").onclick = hideSettings;
for (let i = 0; i < visualizerToggleButtons.length; i++) {
  visualizerToggleButtons[i].onclick = () => setActiveVisualizer(i);
}


// Inject Application specific UI and styles
switch (profile) {
  case profiles.music: {
    canvas.classList.add('music');

    const miniGuide = document.getElementById('mini-guide');

    // TODO: update this to reduce the width of the canvas by 240px as well (note to self, would this be better done through a class?)
    var observer = new MutationObserver(() => {
      if (miniGuide.style.display !== 'none') {
        canvas.style.left = '0';
      }
      if (miniGuide.style.display === 'none') {
        canvas.style.left = '240px';
      }
    });
    observer.observe(miniGuide, { attributes: true, childList: false });

    // const rightButtons = document.getElementById('right-controls').children[1];
    // const buttonElement = rightButtons.appendChild(document.createElement('tp-yt-paper-icon-button')); // The youtube music app takes over from this and populate some more elements for us
    // buttonElement.classList.add('volume', 'style-scope', 'ytmusic-player-bar'); // it doesn't add the classes however so we do that here, we're also using the "volume" class to nab the reactive styles from that
    // buttonElement.children[0].innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z"></path></svg>'; // here we're injecting the icon itself

    // // Bind the settings menu event
    // buttonElement.addEventListener("click", (_event) => {
    //   toggleSettings();
    // });


    // TODO: add buttons for the other sizes (tablet and mobile)
    break;
  }
  case profiles.youtube:
    canvas.classList.add('youtube');
    // 'ytd-player'
    break;
  case profiles.default:
  default:
    // ¯\_(ツ)_/¯
    break;
}

// Get canvas contexts
const canvasCtx = canvas.getContext('2d');

// TODO: impliment player canvas
// const playerCanvasCtx = playerCanvas.getContext('2d');

updateGUI();

try {
  await initUserPreferences;
}
catch (error) {
  console.error('Unable to load preferences:', error);
}

// TODO: Work out if we need these callbacks
// Initalise audio connection
findAudioSources();
setInterval(findAudioSources, 5000);
findActiveAudioSource();
setInterval(findActiveAudioSource, 250);

// These are casts that are used for a lot of settings so we define them here to reuse them
const defaultCast = input => { return input }
const numberCast = input => { return +input }

// Color handling is used both during init and update so we define the logic here to redude duplication
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
 * @property {string} propertyName Name of property for corresponding property in userPreferences
 * @property {(input) => any} inputCast Casting function for this setting input
 * @property {string} inputProp Name of property for corresponding value on input element
 * @property {(input) => void | undefined} additionalHandling Additional handling for this setting run on update, gets passed current input value
 * @property {(input) => void | undefined} additionalInitHandling Additional handling for this setting run on initalisation, gets passed current input value
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
    additionalHandling: primaryColorHandling,
    additionalInitHandling: primaryColorHandling
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
    inputProp: "checked"
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
    additionalInitHandling: (input) => {
      setActiveVisualizer(input);
    }
  }
}

for(let i = 0; i < settingsInputs.length; i++) {
  const settingProps = settingsInputMap[settingsInputs[i].id]

  if(settingProps === undefined) {
    console.error("Input has no setting entry!", settingsInputs[i].id);
    continue;
  }

  // Set inital value, if it's null populate it with an empty string
  if(userPreferences[settingProps.propertyName] !== null) {
    settingsInputs[i][settingProps.inputProp] = userPreferences[settingProps.propertyName];
  }
  else {
    settingsInputs[i][settingProps.inputProp] = "";
  }

  // Do any inital handling if it exists
  if(settingProps.additionalInitHandling) settingProps.additionalInitHandling(userPreferences[settingProps.propertyName]);

  // Bind on change event
  settingsInputs[i].onchange = () => {
    userPreferences[settingProps.propertyName] = settingProps.inputCast(settingsInputs[i][settingProps.inputProp]);
    chrome.storage.sync.set(userPreferences);
    // Do any additonal handling if it exists
    if(settingProps.additionalHandling) settingProps.additionalHandling(userPreferences[settingProps.propertyName]);
  }
}

// used as part of a debouncing timeout
let updateGUITimeoutId = null;

// Event handling for window resizing, we debounce this to avoid spamming our GUI rescaling logic when resizing the window
window.addEventListener('resize', () => {
  // debounce(updateGUI, 250); // TODO: Seperate out some of this logic, not all of this logic needs to be run again on resize
  window.clearTimeout(updateGUITimeoutId);
  updateGUITimeoutId = window.setTimeout(updateGUI, 250); // we do this to make sure we only update the gui after 150ms between the last window resize
});

function updateGUI() {
  // TODO: update canvas height and width to update when relevant UI updates and consider youtube context
  canvas.style.height = window.innerHeight - 72 + 'px'; // TODO: updates these magic 72s with proper bottom offset value
  canvas.setAttribute('height', window.innerHeight - 72);
  canvas.setAttribute('width', window.innerWidth);
  calcBars(canvas);
}

function findAudioSources() {
  const connect = (userPreferences.autoConnect && ((profile === profiles.music && userPreferences.allowYoutubeMusic) || (profile === profiles.youtube && userPreferences.allowYoutube) || (profile === profiles.default && userPreferences.allowOther)))
  if (connect) {
    const prevMediaElementsLength = mediaElements.length;
    const audioElements = document.getElementsByTagName('audio');
    const videoElements = document.getElementsByTagName('video');
    const foundMediaElements = [...audioElements, ...videoElements];
    for (let i = 0; i < foundMediaElements.length; i++) {
      if (foundMediaElements[i].id == null || foundMediaElements[i].id == '') {
        foundMediaElements[i].id = 'mediaElement' + mediaElements.length;

        const analyser = audioCtx.createAnalyser();
        analyser.smoothingTimeConstant = userPreferences.smoothingTimeConstant;
        const source = audioCtx.createMediaElementSource(foundMediaElements[i]);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = fftUni;
        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        mediaElements[mediaElements.length] = {
          node: foundMediaElements[i],
          attached: true,
          audioCtx,
          analyser,
          frequencyData,
          bufferLength,
          dataArray,
        };
      }
    }
    //new media elements hooked
    if (prevMediaElementsLength < mediaElements.length) {
      const txt = '' + mediaElements.length + ' Audio Sources Connected <br> Press \' f2 \' To Show The Visualizer Menu';
      userPreferences.showBanner && showBanner(txt);
    }
  }
}

function showBanner(txt) {
  setTimeout(() => {
    notificationsBanner.style.bottom = '150px';
    notificationsBanner.innerHTML = txt;
  }, 2000);
  setTimeout(() => {
    notificationsBanner.style.bottom = '-100px';
  }, 7000);
}

function findActiveAudioSource() {
  let bestSource = previousAudioSource;
  for (let i = 0; i < mediaElements.length; i++) {
    mediaElements[i].analyser.getByteTimeDomainData(mediaElements[i].dataArray);
    if (mediaElements[i].dataArray[1] - 128 != 0 || mediaElements[i].dataArray[mediaElements[i].dataArray.length - 1] - 128 != 0 || mediaElements[i].dataArray[Math.floor(mediaElements[i].dataArray.length / 2)] - 128 != 0) {
      bestSource = i;
    }
  }
  previousAudioSource = bestSource;
  return bestSource;
}

let hue = 0;

function cycleColorHue(alpha = 1) {
  hue++;
  if (hue > 359) hue = 0;
  return `hsla(${hue}, 100%, 50%, ${alpha})`;
}

function runVis() {
  // Clear canvas
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  // Set fill/outline colour to relevant colour
  const colour = userPreferences.colorCycle ? cycleColorHue(0.7) : userPreferences.primaryColor // TODO: change the cycle colour to a time based thing, this is too fast
  canvasCtx.fillStyle = colour;
  canvasCtx.strokeStyle = colour;

  // TODO: Work out if you need to do this every frame or not
  const activeSource = findActiveAudioSource();

  // TODO: Check if this can be global
  const audioSource = mediaElements[activeSource];

  // Call the drawer function for the active visualizer
  visualizerDrawers[activeVisualizer](canvasCtx, canvas, audioSource);

  animationFrame = window.requestAnimationFrame(runVis);
}

/**
 * Sets active visualizer, if null or same as active visualizer will disable visualizer
 * @param {number | null} vizNum Value to update active visualizer to
 */
function setActiveVisualizer(vizNum) {
  //TODO: don't do this if visualizer is already active
  if (activeVisualizer !== null) { // if we've changing from an existing visualiser we need to unselect it's button
    visualizerToggleButtons[activeVisualizer].classList.remove('button-selected');
  }

  if (activeVisualizer === vizNum || vizNum === null) {
    // If the visualiser is already active we want to toggle it off
    window.cancelAnimationFrame(animationFrame); // stop the animation script
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
    animationFrame = null; // reset animation frame to null (as we use this to check if there is an animation running)
    activeVisualizer = null;
    return;
  }

  activeVisualizer = vizNum;
  visualizerToggleButtons[activeVisualizer].classList.add('button-selected');

  // animationFrame is the current animation request, if this is null it means that there is no current animation request, so we need to start it
  if (animationFrame === null) {
    canvas.style.display = 'block';
    animationFrame = window.requestAnimationFrame(runVis);
  }
}

function toggleSettings() {
  if (settingsModalBackground.style.display == 'flex') {
    hideSettings()
  } else {
    showSettings()
  }
}

function showSettings() {
  settingsModalBackground.style.display = 'flex';
  setTimeout(() => {
    settingsModalBackground.style.opacity = 1;
  }, 1)
}

function hideSettings() {
  settingsModalBackground.style.opacity = 0;
  setTimeout(() => {
    settingsModalBackground.style.display = 'none';
  }, 500)
}

const keysPressed = [];

document.onkeydown = keyPressed;
document.onkeyup = keyReleased;

function keyPressed(e) {

  const secondaryKey = 17; // control
  // let openVisualizerKey = 86; // v
  const openVisualizerKey = 113; // f2
  const escapeKey = 27;
  // const devKey = 192; // `

  const viz1Key = 49; // 1
  const viz2Key = 50; // 2
  const viz3Key = 51; // 3
  const viz4Key = 52; // 4


  if (keysPressed.length == 0 || keysPressed[keysPressed.length - 1] != e.keyCode) {
    keysPressed.push(e.keyCode);
  }

  if (keysPressed.includes(openVisualizerKey)) {
    toggleSettings();
  }

  if (keysPressed.includes(secondaryKey) && keysPressed.includes(viz1Key)) {
    setActiveVisualizer(0);
  }

  if (keysPressed.includes(secondaryKey) && keysPressed.includes(viz2Key)) {
    setActiveVisualizer(1);
  }

  if (keysPressed.includes(secondaryKey) && keysPressed.includes(viz3Key)) {
    setActiveVisualizer(2);
  }

  if (keysPressed.includes(secondaryKey) && keysPressed.includes(viz4Key)) {
    setActiveVisualizer(3);
  }

  if (keysPressed.includes(escapeKey) && settingsModalBackground.style.display == 'flex') {
    hideSettings();
  } else if (keysPressed.includes(escapeKey) && settingsModalBackground.style.display == 'none') {
    setActiveVisualizer(null);
  }

}

function keyReleased() {
  keysPressed.pop();
}
