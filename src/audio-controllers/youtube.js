import { audioCtx, analyser } from "./audio-context.js";
import { onPlay, onPause } from "../visualizer.js";
import { setMediaElement } from "./media-element.js";

// YouTube is a bit annoying as unlike youtube music it's media element isn't always loaded and we need to swap between the media elements
// for a normal YouTube video and YouTube shorts

// # Summary of noteworthy video elements
// - Main video player
//   - Selector: ytd-player#ytd-player video
//   - Exists on first load on /watch, lazy loads in on most other pages (exceptions listed below)
// - Shorts Video player
//   - Selector: ytd-reel-video-renderer ytd-player#player video
//   - Exists on first load on /shorts/*, only loads in if in /shorts route
//   - Once loaded stays loaded even outside of /shorts routes
// - Inline player
//   - Selector: ytd-player#inline-player video
//   - Loads in on hover of video thumbnails on / and /feed/subscriptions routes specifically (other thumbnails use a .webp rather than this player)
//   - Video defaults as muted but can be unmuted and play audio, although we are not going to visualize this as the added complexity isn't worth it
// - Promo panel player
//   - Selector: ytd-default-promo-panel-renderer-inline-playback-renderer > ytd-player#player video
//   - Loads on the YouTube Music and Youtube Sports Channels (/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ and /channel/UCEgdi0XIXXZ-qJOFPf4JSKw)
//   - These don't play any audio so we don't need to worry about them for the visualizer outside of making sure we don't accidentally select them
//   - These panels unload when navigated away from the relevant channel
// 
// There are also pages under the www.youtube.com domain that are outside of the YouTube web app (and thus never load videos we care about)
// The visualizer is prevented from loading on these pages as there is nothing we want to attach to on those pages

/**
 * Main YouTube video player, undefined until loaded
 * @type {HTMLVideoElement | undefined}
 */
let mainPlayerElement = undefined;
/**
 * YouTube shorts player, undefined until loaded
 * @type {HTMLVideoElement | undefined}
 */
let shortsPlayerElement = undefined;

/**
 * Tries to find and assign main player element, if found returns true.
 * @returns {boolean}
 */
function findMainPlayer() {
  if(mainPlayerElement) return true; // Fail safe "We already found it"
  mainPlayerElement = document.querySelector("ytd-player#ytd-player video");
  console.log("mainPlayerElement", mainPlayerElement);
  return !!mainPlayerElement;
}

/**
 * Tries to find and assign shorts player element, if found returns true.
 * @returns {boolean}
 */
function findShortsPlayer() {
  if(shortsPlayerElement) return true; // Fail safe "We already found it"
  shortsPlayerElement = document.querySelector("ytd-reel-video-renderer ytd-player#player video");
  console.log("shortsPlayerElement", shortsPlayerElement);
  return !!shortsPlayerElement;
}

// If we're on a page where the media element exists on first load we fetch the element
if(window.location.pathname.startsWith("/watch")) findMainPlayer();
else if(window.location.pathname.startsWith("/shorts")) findShortsPlayer();

// Timeout number for the main player timeout if one exists
let mainPlayerTimeout = undefined;

navigation.addEventListener('navigate', () => {
  console.log('page changed');
});

const findMainPlayerListener = () => {
  console.log("Main Listener");
  if(!window.location.pathname.startsWith("/watch")) return;
  console.log("Main Listener");

  if(findMainPlayer()) {
    clearTimeout(mainPlayerTimeout);
    mainPlayerTimeout = undefined;
    window.removeEventListener("onpopstate", findMainPlayerListener);
  }
}

function findMainPlayerCallback() {
  console.log("Main Callback");

  if(findMainPlayer()) {
    mainPlayerTimeout = undefined;
    window.removeEventListener("onpopstate", findMainPlayerListener);
  }
  else {
    mainPlayerTimeout = setTimeout(findMainPlayerCallback, 10000);
  }
}

if(!mainPlayerElement) {
  window.addEventListener("onpopstate", findMainPlayerListener);
  mainPlayerTimeout = setTimeout(findMainPlayerCallback, 10000);
}

const findShortsPlayerListener = () => {
  if(!window.location.pathname.startsWith("/shorts")) return;
  console.log("Shorts Listener");

  if(findShortsPlayer()) {
    removeEventListener("onpopstate", findShortsPlayerListener);
  }
}

if(!shortsPlayerElement) {
  addEventListener("onpopstate", findShortsPlayerListener);
}


// Youtube Music always has the video output element available so we can just fetch it
// This is always used even if used in audio only mode
// const videoElement = document.getElementsByTagName('video')[0];
// setMediaElement(videoElement);

// const source = audioCtx.createMediaElementSource(videoElement);

// source.connect(analyser);

// videoElement.addEventListener('play', () => {
//   onPlay();
// });

// videoElement.addEventListener('pause', () => {
//   onPause();
// });
