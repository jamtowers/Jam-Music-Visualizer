import { userSettings } from "./user-settings.js";

// https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize
// possible values (that we care about): 2048, 4096, 8192, 16384, and 32768
// The lower this is the more performant the visualizer is but the less detail we get out of it
// High fftUni values also have the effect of "smoothing" frequency data on bars but will make line visualizers busier
const fftUni = 16384;

// Audio context can be reused between sources, so we create one global one here
const audioCtx = new AudioContext();

// const audioElements = document.getElementsByTagName('audio'); // Youtube music and Youtube itself only uses video media elements, even if it's only audio
const videoElements = document.getElementsByTagName('video');

if (videoElements.length < 1) {
  // I believe the extention should only initalize after the page has fully loaded, so the media elements should exist by this point
  // So in theory we should never hit this

  // This is here to emulate the timeout functionality of the origonal code, basically we wait here for 5 seconds and if we still don't have a media element then we give up
  // I have no idea when or if this will happen, really here as a "just in case"
  await new Promise(r => setTimeout(r, 5000));

  // getElementsByTagName returns a collection that stays in sync with the page, so we don't need to call it again here
  if (videoElements.length < 1) {
    throw new Error("No media sources found!");
  }
}

// Youtube Music has a single media element and Youtube itself has 2, I'm assuming the first element will always be the correct one, but this might not always be the case
export const mediaElement = videoElements[0];

const source = audioCtx.createMediaElementSource(mediaElement);

// Analysers can only handle one source at once, but in our case we only deal with one at a time so we only need the one
export const analyser = audioCtx.createAnalyser();
analyser.smoothingTimeConstant = userSettings.smoothingTimeConstant;
analyser.fftSize = fftUni; // Todo: set this from some kind of user setting
analyser.maxDecibels = -20; // Default value is -30 which is a bit high for maximum volume (it causes the bass on some songs to max out the visualizer)

// Here we're piping the audio source into the analyser
source.connect(analyser);
// Since we're piping the audio into the analyser we need to pipe that into the output explicitly here
// techically we aren't modifying the auido at all so we could pipe the audio directly from the source to the destination,
// but I'm keeping it from the analyser in case it adds any delay in the audio, this way the visualizer will stay synced with the audio
analyser.connect(audioCtx.destination);

export const frequencyBinCount = analyser.frequencyBinCount;
export const dataArray = new Uint8Array(frequencyBinCount);
// We don't care about the full buffer length because the last ~35% of it doesn't contain any useful data (it only contains noise at low fftUni values and is otherwise empty)
// This might be something to add an option for the users who don't want to see the higher frequencies at all
export const bufferLength = Math.ceil(0.65 * frequencyBinCount);
export const frequencyData = new Uint8Array(bufferLength);
