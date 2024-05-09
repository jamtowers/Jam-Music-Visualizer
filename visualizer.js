/* eslint linebreak-style: ["error", "windows"] */
// Greyson Flippo
// Ac130veterans@gmail.com
// GreysonFlippo@gmail.com
// created 6-6-2016 :)
// updated 4-25-2021
// https://chrome.google.com/webstore/detail/music-visualizer-for-goog/ofhohcappnjhojpboeamfijglinngdnb

/**
 * enum for all of the visualizers
 * @readonly
 * @enum {number}
 */
const visualizers = Object.freeze({
  bars: 0,
  waves: 1,
  circle: 2,
  ambient: 3,
});

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
if(window.location.href.startsWith('https://music.youtube.com')) profile = profiles.music;
else if(window.location.href.startsWith('https://youtube.com')) profile = profiles.youtube;
Object.freeze(profile);

// https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize
const fftUni = 8192;

let userPreferences = {
  colorCycle: true,
  auto_connect: true,
  show_banner: true,
  primary_color: 'white',
  max_height: 100,
  smoothingTimeConstant: 0,
  allow_youtube: true,
  allow_youtube_music: true,
  allow_other: false,
  defaultVisualizer: null,
};

const mediaElements = [];
//                         bar    wav    cir    amb
const visualizerToggles = [false, false, false, false];
const visualizerToggleFunctions = [toggleBarVis, toggleWaveViz, toggleCircleViz, toggleAmbienceViz];
let visualizerToggleButtons = [];

const barWidth = 12;
let barAmnt = 0;
const barSpacing = 2;
// let vizReady = 0;
// array of x coords for each bars x origin
let barCoords = [];

let runBarVisualizer;
let drawBarsUpdate;

retireveSettings();

// Element creation start

const notificationsBanner = document.body.appendChild(document.createElement('div'));
notificationsBanner.id = 'Notifications_Banner';

const settingsModalBackground = document.body.appendChild(document.createElement('div'));
settingsModalBackground.id = 'settings_modal_background';
const settingsModal = settingsModalBackground.appendChild(document.createElement('div'));
settingsModal.id = 'settings_modal';
const settingsTitle = settingsModal.appendChild(document.createElement('div'));
settingsTitle.id = 'settings_title';

settingsModalBackground.addEventListener('click', (e) => {
  if (e.target.id === 'settings_modal_background') {
    hideSettings();
  }
});

settingsTitle.innerHTML = '<div id="back_button">&#215;</div>Visualizer Settings';
document.getElementById('back_button').addEventListener('click', () => { hideSettings() });

const vizualizerButtonContainer = settingsModal.appendChild(document.createElement('div'));
vizualizerButtonContainer.id = 'vizualizer_button_container';

visualizerToggleButtons[visualizers.bars] = vizualizerButtonContainer.appendChild(document.createElement('button'));
visualizerToggleButtons[visualizers.waves] = vizualizerButtonContainer.appendChild(document.createElement('button'));
visualizerToggleButtons[visualizers.circle] = vizualizerButtonContainer.appendChild(document.createElement('button'));
visualizerToggleButtons[visualizers.ambient] = vizualizerButtonContainer.appendChild(document.createElement('button'));

visualizerToggleButtons.forEach((button, vis) => {
  button.classList.add('Button');
  button.addEventListener('click', () => { setActiveVisualizer(vis); });
  switch(vis) {
    case visualizers.bars:
      button.innerText = 'Bars';
      break;
    case visualizers.waves:
      button.innerText = 'Waves';
      break;
    case visualizers.circle:
      button.innerText = 'Circle';
      break;
    case visualizers.ambient:
      button.innerText = 'Ambience';
      break;
  }
});

const canvas = document.body.appendChild(document.createElement('canvas'));
canvas.id = 'canvas1';
// let playerCanvas = document.getElementById("player").appendChild(document.createElement('canvas')); // might be a youtube music exclusive thing?
// playerCanvas.id = 'canvas2';
switch(profile) {
  case profiles.music:
    canvas.classList.add('music');
    break;
  case profiles.youtube:
    canvas.classList.add('youtube');
    // 'ytd-player'
    break;
  case profiles.default:
  default:
    // ¯\_(ツ)_/¯
    break;
}

const canvasCtx = canvas.getContext('2d');
// const playerCanvasCtx = playerCanvas.getContext('2d');

const ambience = document.body.appendChild(document.createElement('div'));
ambience.id = 'ambience1';
ambience.appendChild(document.createElement('div')).id = 'topGlow';
ambience.appendChild(document.createElement('div')).id = 'bottomGlow';
ambience.appendChild(document.createElement('div')).id = 'leftGlow';
ambience.appendChild(document.createElement('div')).id = 'rightGlow';

// Element creation end

updateGUI();

// used as part of a debouncing timeout
let updateGUITimeoutId = null;

// Event handling for window resizing, we debounce this to avoid spamming our GUI rescaling logic when resizing the window
window.addEventListener('resize', () => {
  // debounce(updateGUI, 250); // TODO: Seperate out some of this logic, not all of this logic needs to be run again on resize
  window.clearTimeout(updateGUITimeoutId);
  updateGUITimeoutId = window.setTimeout(updateGUI, 250); // we do this to make sure we only update the gui after 150ms between the last window resize
});

// const rightButtons = document.getElementById('right-controls').children[1];
// const buttonElement = rightButtons.appendChild(document.createElement('tp-yt-paper-icon-button')); // The youtube music app takes over from this and populate some more elements for us
// buttonElement.classList.add('volume', 'style-scope', 'ytmusic-player-bar'); // it doesn't add the classes however so we do that here, we're also using the "volume" class to nab the reactive styles from that
// buttonElement.children[0].innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z"></path></svg>'; // here we're injecting the icon itself

// // Bind the settings menu event
// buttonElement.addEventListener("click", (_event) => {
//   toggleSettings();
// });

const miniGuide = document.getElementById('mini-guide');

var observer = new MutationObserver(() => {
  if(miniGuide.style.display !== 'none'){
    canvas.style.left = '0';
  }
  if(miniGuide.style.display === 'none'){
    canvas.style.left = '240px';
  }
});
observer.observe(miniGuide, { attributes: true, childList: false });

// TODO: add buttons for the other sizes (tablet and mobile)

function retireveSettings() {
  try {
    // eslint-disable-next-line no-undef
    chrome.storage.local.get(Object.keys(userPreferences), function(result) {
      userPreferences = {...userPreferences, ...result};
      createSettings();
      findAudioSources();
      setInterval(findAudioSources, 5000);
      findActiveAudioSource();
      setInterval(findActiveAudioSource, 250);
    });
  } catch (error) {
    console.error('No Data To Retrieve: ', error);
  }
}

function updateSettings(settings) {
  userPreferences = {...userPreferences, ...settings};
  // eslint-disable-next-line no-undef
  chrome.storage.local.set({...userPreferences});
}

function updateGUI() {
  // TODO: update canvas height and width to update when relevant UI updates and consider youtube context
  canvas.style.height = window.innerHeight - 72 + 'px'; // TODO: updates these magic 72s with proper bottom offset value
  canvas.setAttribute('height', window.innerHeight - 72);
  canvas.setAttribute('width', window.innerWidth);
  calcBars();
}


// const profiles = Object.freeze({
// 	default: Symbol("default"),
// 	music: Symbol("music"),
// 	youtube: Symbol("youtube"),
// });

function findAudioSources() {
  const connect = (userPreferences.auto_connect && ((profile === profiles.music && userPreferences.allow_youtube_music) || (profile === profiles.youtube && userPreferences.allow_youtube) || (profile === profiles.default && userPreferences.allow_other)))
  if (connect) {
    const prevMediaElementsLength = mediaElements.length;
    const audioElements = document.getElementsByTagName('audio');
    const videoElements = document.getElementsByTagName('video');
    const foundMediaElements = [...audioElements, ...videoElements];
    for (let i = 0; i < foundMediaElements.length; i++) {
      if (foundMediaElements[i].id == null || foundMediaElements[i].id == '') {
        foundMediaElements[i].id = 'mediaElement' + mediaElements.length;

        const audioCtx = new AudioContext();
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
      userPreferences.show_banner && showBanner(txt);
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
  setTimeout(() => {
    // Since this is now off screen we delete it since it won't be used again
    notificationsBanner.remove();
  }, 8000);
}

let previousAudioSource = 0;
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


// Calculates the x coord for each bar, needs to be done every time the canvas size changes
function calcBars() {
  // Total space needed for each bar
  const barSpace = barSpacing + barWidth;

  let numberOfBars = Math.floor(canvas.width / barSpace);

  // Calulate offset required to ensure bars are centered
  let offset = (canvas.width % barSpace) / 2;

  // reset coords
  barCoords = [];

  // Calculate the x coord for each bar
  for(let i = 0; i < numberOfBars; i++) {
    barCoords[i] = (barSpace * i) + offset;
  }
}

let red = 255;
let green = 0;
let blue = 0;

function cycleColor() {
  if (red == 255) {
    if (blue > 0) { blue--; } else { green++; }
  }

  if (green == 255) {
    if (red > 0) { red--; } else { blue++; }
  }

  if (blue == 255) {
    if (green > 0) { green--; } else { red++; }
  }
  return 'rgb(' + red + ',' + green + ',' + blue + ')';
}

let hue = 0;

function cycleColorHue(alpha = 1) {
  hue++;
  if(hue > 359) hue = 0;
  return `hsla(${hue}, 100%, 50%, ${alpha})`;
}

let count = 0;

function barVis() {
  // Clear canvas
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  // Set fill colour to relevant colour
  if(count > 4) {
    count = 0;
    canvasCtx.fillStyle = userPreferences.colorCycle ? cycleColorHue(0.7) : userPreferences.primary_color; // TODO: change the cycle colour to a time based thing, this is too fast
  }
  else {
    count++;
  }
  

  const activeSource = findActiveAudioSource();

  // What does this do? I dunno, makes it work though
  mediaElements[activeSource].analyser.getByteFrequencyData(mediaElements[activeSource].frequencyData);

  for(let i = 0; i < barCoords.length; i++) {
    // no idea how this works, was in original code and what it does illudes me, takes the frequency data and turns it into an ampitude
    const formula = Math.ceil(Math.pow(i, 1.25));
    const frequencyData = mediaElements[activeSource].frequencyData[formula];
    const barHeight = ((frequencyData * frequencyData * frequencyData) / (255 * 255 * 255)) * ((canvas.height - 72) * 0.30) * (userPreferences.max_height / 100); // TODO: remove magic 72 from here and update it with bottom offset

    if(barHeight == 0) continue; // if the bar is nothing we simply skip it;

    canvasCtx.fillRect(barCoords[i], canvas.height - barHeight, barWidth, barHeight);
  }
  if (visualizerToggles[0]) { window.requestAnimationFrame(barVis); }
}

function toggleBarVis() {
  if (visualizerToggles[0] == false) {
    canvas.style.display = 'block';
    visualizerToggles[0] = true;
    window.requestAnimationFrame(barVis);
  } else {
    canvas.style.display = 'none';
    visualizerToggles[0] = false;
  }
}

function toggleWaveViz() {
  if (visualizerToggles[1] == false) {
    canvas.style.display = 'block';
    visualizerToggles[1] = true;
    window.requestAnimationFrame(waveVis);
  } else {
    canvas.style.display = 'none';
    visualizerToggles[1] = false;
  }
}

function toggleCircleViz() {
  if (visualizerToggles[2] == false) {
    canvas.style.display = 'block';
    visualizerToggles[2] = true;
    window.requestAnimationFrame(waveVis);
  } else {
    canvas.style.display = 'none';
    visualizerToggles[2] = false;
  }
}

function waveVis() {
  // Clear canvas
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  const WIDTH = window.innerWidth;
  const HEIGHT = window.innerHeight - 72; // TODO: remove this magic 72 and replace it with bottom offset value
    const activeSource = findActiveAudioSource();
    mediaElements[activeSource].analyser.getByteTimeDomainData(mediaElements[activeSource].dataArray);
    canvasCtx.width = WIDTH;
    canvasCtx.height = HEIGHT;
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.strokeStyle = userPreferences.colorCycle ? cycleColor() : userPreferences.primary_color;
    canvasCtx.lineWidth = 3000 / window.innerHeight;
    canvasCtx.shadowColor = '#000';
    canvasCtx.shadowBlur = 1;
    canvasCtx.shadowOffsetX = 0;
    canvasCtx.shadowOffsetY = 0;
    if (visualizerToggles[2]) { canvasCtx.lineWidth = 3; }
    canvasCtx.beginPath();
    const sliceWidth = WIDTH / mediaElements[activeSource].bufferLength * 4;
    const radius1 = HEIGHT / 4;
    let x = 0;
    let lastx = WIDTH / 2 + radius1;
    let lasty = HEIGHT / 2;

    for (let i = mediaElements[activeSource].bufferLength / 2; i < mediaElements[activeSource].bufferLength; i++) {
      const v = (((mediaElements[activeSource].dataArray[i] / 128.0) - 1) * (userPreferences.max_height / 100)) + 1;
      const radius2 = radius1 + (v * v * 150) * (HEIGHT / 1500);
      const y = v * HEIGHT / 2;
      if (visualizerToggles[2]) {
          canvasCtx.lineTo((WIDTH / 2) + radius2 * Math.cos(i * (2 * Math.PI) / mediaElements[activeSource].bufferLength * 2), (HEIGHT / 2) + radius2 * Math.sin(i * (2 * Math.PI) / mediaElements[activeSource].bufferLength * 2) * -1);
      } else {
          canvasCtx.lineTo(x, y);
      }
      lastx = (WIDTH / 2) + radius2 * Math.cos(i * (2 * Math.PI) / mediaElements[activeSource].bufferLength);
      lasty = (HEIGHT / 2) + radius2 * Math.sin(i * (2 * Math.PI) / mediaElements[activeSource].bufferLength) * -1;
      x += sliceWidth;
    }
    if (visualizerToggles[2]) { canvasCtx.lineTo(lastx, lasty); }
    canvasCtx.stroke();
    if (visualizerToggles[2] || visualizerToggles[1]) { window.requestAnimationFrame(waveVis); }
}


function ambientVis() {
  const activeSource = findActiveAudioSource();
  mediaElements[activeSource].analyser.getByteFrequencyData(mediaElements[activeSource].frequencyData);

  ambience.style.display = 'block';
  ambience.style.height = window.innerHeight - 72 + 'px'; // TODO: Update this magic 72 to bottom offset value
  ambience.style.boxShadow = 'inset 0px 0px 500px rgba(255,255,255,' + mediaElements[activeSource].frequencyData[2] / 255 + ')';

  document.getElementById('topGlow').style.boxShadow = '0px 0px 500px 500px rgba(50,50,255,' + (mediaElements[activeSource].frequencyData[8] * mediaElements[activeSource].frequencyData[8]) / (255 * 255) + ')';
  document.getElementById('bottomGlow').style.boxShadow = '0px 0px 500px 500px rgba(255,50,50,' + (mediaElements[activeSource].frequencyData[40] * mediaElements[activeSource].frequencyData[40]) / (255 * 255) + ')';
  document.getElementById('leftGlow').style.boxShadow = '0px 0px 500px 500px rgba(50,255,50,' + (mediaElements[activeSource].frequencyData[160] * mediaElements[activeSource].frequencyData[160]) / (255 * 255) + ')';
  document.getElementById('rightGlow').style.boxShadow = '0px 0px 500px 500px rgba(255,255,50,' + (mediaElements[activeSource].frequencyData[500] * mediaElements[activeSource].frequencyData[500]) / (255 * 255) + ')';
}


let runAmbienceVisualizer;

function toggleAmbienceViz() {
  if (visualizerToggles[3] == false) {
    visualizerToggles[3] = true;
    runAmbienceVisualizer = setInterval(ambientVis, 1);
  } else {
    ambience.style.display = 'none';
    clearInterval(runAmbienceVisualizer);
    visualizerToggles[3] = false;
  }
}

function setActiveVisualizer(vizNum) {
  if (!visualizerToggles[vizNum]) {
    turnOffAllVisualizers();
  }
  if (mediaElements.length > 0) {
    visualizerToggleButtons[vizNum].classList.toggle('Button_Selected');
    visualizerToggleFunctions[vizNum]();
  };
}

function turnOffAllVisualizers() {
  for (let i = 0; i < visualizerToggles.length; i++) {
    if (visualizerToggles[i]) {
      visualizerToggleFunctions[i]();
      visualizerToggleButtons[i].classList.toggle('Button_Selected');
    }
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

function toggleSwitch(setting) {
  const newSetting = !userPreferences[setting.setting_value];
  newSetting ? document.getElementById(setting.name + '_switch').classList.remove('off') : document.getElementById(setting.name + '_switch').classList.add('off')
  updateSettings({[setting.setting_value]: newSetting});
}

function updateNumberSetting(setting_value, value) {
  updateSettings({[setting_value]: value});
}

function updatePrimaryColor(value) {
  const color = value === 'default' ? null : value;
  const colorSample = document.getElementById('primary_color_sample')
  colorSample.classList.add('color_sample');
  const getColor = (color) => {
    if (!color || color === 'default') {
      return '#ffffff'
    } else {
      return color
    }
  }
  colorSample.style.backgroundColor = getColor(color)
  updateSettings({primary_color: getColor(color)});
}

const settings = [
  {
    name: 'max_height',
    title: 'Height Multiplier',
    type: 'number',
    setting_value: 'max_height',
    multiplier: 100,
    event: updateNumberSetting,
  },
  {
    name: 'color_cycle',
    title: 'Color Cycling',
    type: 'toggle',
    setting_value: 'colorCycle',
  },
  {
    name: 'primary_color',
    title: 'Static Visualizer Color',
    type: 'text',
    setting_value: 'primary_color',
    custom_setting: primaryColor,
    event: updatePrimaryColor,
  },
  {
    name: 'auto_connect',
    title: 'Connect To Audio',
    type: 'toggle',
    setting_value: 'auto_connect',
  },
  {
    name: 'allow_youtube_music',
    title: 'Connect With YouTube Music',
    type: 'toggle',
    setting_value: 'allow_youtube_music',
  },
  {
    name: 'allow_youtube',
    title: 'Connect With YouTube Video',
    type: 'toggle',
    setting_value: 'allow_youtube',
  },
  // {
  //   name: 'allow_other',
  //   title: 'Try To Connect On Any Website',
  //   type: 'toggle',
  //   setting_value: 'allow_other',
  // },
  {
    name: 'show_banner',
    title: 'Show Audio Connection Banner',
    type: 'toggle',
    setting_value: 'show_banner',
  }
]

function createToggle(setting) {
  document.getElementById(setting.name).appendChild(document.createElement('div')).id = setting.name + '_switch';
  const switchButton = document.getElementById(setting.name + '_switch');
  switchButton.classList.add('switch');
  switchButton.appendChild(document.createElement('div')).classList.add('switch_handle');
  switchButton.addEventListener('click', () => { toggleSwitch(setting) })
  // eslint-disable-next-line no-unused-expressions
  userPreferences[setting.setting_value] == false ? switchButton.classList.add('off') : null;
}

function createNumberBox(setting) {
  document.getElementById(setting.name).appendChild(document.createElement('input')).id = setting.name + '_number';
  const numberBox = document.getElementById(setting.name + '_number')
  numberBox.classList.add('number_box');
  numberBox.type = 'number';
  numberBox.addEventListener('blur', () => { setting.event(setting.setting_value, numberBox.value * setting.multiplier) })
  numberBox.value = userPreferences[setting.setting_value] / setting.multiplier;
}

function createTextBox(setting) {
  document.getElementById(setting.name).appendChild(document.createElement('input')).id = setting.name + '_text';
  const textBox = document.getElementById(setting.name + '_text')
  textBox.classList.add('number_box');
  textBox.type = 'text';
  textBox.addEventListener('blur', () => { setting.event(textBox.value) })
  textBox.value = userPreferences[setting.setting_value] || 'default';
}

function primaryColor() {
  document.getElementById('primary_color').appendChild(document.createElement('div')).id = 'primary_color_sample';
  const colorSample = document.getElementById('primary_color_sample')
  colorSample.classList.add('color_sample');
  const getColor = (color) => {
    if (!color || color === 'default') {
      return '#ffffff'
    } else {
      return color
    }
  }
  colorSample.style.backgroundColor = getColor(userPreferences.primary_color)

  // document.getElementById('primary_color').appendChild(document.createElement('div')).id = 'primary_color_button';
  // const colorButton = document.getElementById('primary_color_button')
  // colorButton.classList.add('more_button')
  // colorButton.innerText = 'Change'

  document.getElementById('primary_color').appendChild(document.createElement('input')).id = 'primary_color' + '_text';
  const textBox = document.getElementById('primary_color' + '_text')
  textBox.classList.add('number_box');
  textBox.type = 'text';
  textBox.addEventListener('blur', () => { updatePrimaryColor(textBox.value) })
  textBox.value = userPreferences.primary_color || 'default';
  textBox.style.right = '142px';
}

function createSettings() {
  settings.map(setting => {
    settingsModal.appendChild(document.createElement('div')).id = setting.name;
    document.getElementById(setting.name).classList.add('setting');
    document.getElementById(setting.name).innerText = setting.title;
    if (setting.custom_setting) {
      setting.custom_setting()
    } else if (setting.type == 'toggle') {
      createToggle(setting)
    } else if (setting.type == 'number') {
      createNumberBox(setting)
    } else if (setting.type == 'text') {
      createTextBox(setting)
    }
  })
}


const keysPressed = [];

document.onkeydown = keyPressed;
document.onkeyup = keyReleased;

function keyPressed(e) {

  const secondaryKey = 17; // control
  // let openVisualizerKey = 86; // v
  const openVisualizerKey = 113; // f2
  const escapeKey = 27;
  // eslint-disable-next-line no-unused-vars
  const devKey = 192; // `

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
    turnOffAllVisualizers();
  }

}

function keyReleased(e) {
  keysPressed.pop();
}
