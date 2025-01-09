import { audioCtx, analyser, setIsPausedFunction } from "./audio-context.js";
import { onPlay, onPause } from "../visualizer.js";

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
 * Main YouTube video audio source, undefined until loaded
 * @type {MediaElementAudioSourceNode | undefined}
 */
let mainPlayerSource = undefined;
/**
 * YouTube shorts audio source, undefined until loaded
 * @type {MediaElementAudioSourceNode | undefined}
 */
let shortsPlayerSource = undefined;

/** Returns if the main player is paused, defaults to true when player is undefined */
function isMainPlayerPaused() {
  return !mainPlayerElement || mainPlayerElement.paused;
}

/** Returns if the main player is paused, defaults to true when player is undefined */
function isShortsPlayerPaused() {
  return !shortsPlayerElement || shortsPlayerElement.paused;
}

/**
 * Tries to find and assign main player element, if found returns true.
 * @returns {boolean}
 */
function findMainPlayer(selector = "ytd-player#ytd-player video") {
  if(mainPlayerElement) return true; // Fail safe "We already found it"
  mainPlayerElement = document.querySelector(selector);
  // If we find the element create the audio source and connect it to the analyser
  if(mainPlayerElement) {
    mainPlayerSource = audioCtx.createMediaElementSource(mainPlayerElement);
    mainPlayerSource.connect(analyser);
    // If the shorts player isn't playing and the main player is then we need to run the onPlay logic
    if(isShortsPlayerPaused() && !mainPlayerElement.paused) onPlay();

    mainPlayerElement.addEventListener('play', () => {
      // If shorts player isn't already playing we need to run the onPlay code
      if(isShortsPlayerPaused()) onPlay();
    });

    mainPlayerElement.addEventListener('pause', () => {
      // If shorts player is paused we need to run the onPause code
      if(isShortsPlayerPaused()) onPause();
    });
    return true;
  }
  return false
}

/**
 * Tries to find and assign shorts player element, if found returns true.
 * @returns {boolean}
 */
function findShortsPlayer(selector = "ytd-reel-video-renderer ytd-player#player video") {
  if(shortsPlayerElement) return true; // Fail safe "We already found it"
  shortsPlayerElement = document.querySelector(selector);
  // If we find the element create the audio source and connect it to the analyser
  if(shortsPlayerElement) {
    shortsPlayerSource = audioCtx.createMediaElementSource(shortsPlayerElement);
    shortsPlayerSource.connect(analyser);
    // If the main player isn't playing and the shorts player is then we need to run the onPlay logic
    if(isMainPlayerPaused() && !shortsPlayerElement.paused) onPlay();

    shortsPlayerElement.addEventListener('play', () => {
      // If main player isn't already playing we need to run the onPlay code
      if(isMainPlayerPaused()) onPlay();
    });

    shortsPlayerElement.addEventListener('pause', () => {
      // If main player is paused we need to run the onPause code
      if(isMainPlayerPaused()) onPause();
    });
    return true;
  }
  return false
}

// Timeout number for the main player timeout if one exists
let mainPlayerTimeout = undefined;

const findMainPlayerListener = (event) => {
  if(event.detail.pageType === "watch") {
    if(findMainPlayer()) {
      clearTimeout(mainPlayerTimeout);
      mainPlayerTimeout = undefined;
      window.removeEventListener("yt-navigate-finish", findMainPlayerListener);
    }
  }
}

function findMainPlayerCallback(timeout = 10000) {
  mainPlayerTimeout = setTimeout(() => {
    if(findMainPlayer()) {
      mainPlayerTimeout = undefined;
      window.removeEventListener("yt-navigate-finish", findMainPlayerListener);
    }
    else {
      findMainPlayerCallback();
    }
  }, timeout);
}

function findShortsPlayerCallback(timeout = 500) {
  setTimeout(() => {
    if(!findShortsPlayer()) {
      findShortsPlayerCallback();
    }
  }, timeout);
}

const findShortsPlayerListener = (event) => {
  if(event.detail.pageType === "shorts") {
    // Turns out that even on navigation "Finish" the shorts player isn't loaded yet, so we need to add a timeout to wait for it to load
    window.removeEventListener("yt-navigate-finish", findShortsPlayerListener);
    findShortsPlayerCallback();
  }
}

setIsPausedFunction(() => {
  // This function is intentionally written to default to true if neither of the elements are loaded
  if(mainPlayerElement && !mainPlayerElement.paused) return false
  if(shortsPlayerElement && !shortsPlayerElement.paused) return false
  return true;
});

// Here we use a Youtube specific event "yt-navigate-finish", This fires on navigation finish, Using built in browser navigation events is inconsistent

// If we aren't on a watch page or we don't find the main player first time (We override the selector for first load as the element tree is different from when the app fully starts up)
if(!window.location.pathname.startsWith("/watch") || !findMainPlayer("#player video")) {
  // Event listener for if we navigate to a watch page, or when it's fully loaded in the case of us starting there
  window.addEventListener('yt-navigate-finish', findMainPlayerListener);
  // Callback for finding the main player, gets cancelled if found sooner, this is to catch when the main player gets lazy loaded so we're ready before the user clicks on a video
  findMainPlayerCallback(5000);
}

// If we aren't on a shorts page or we don't find the shorts player first time (We override the selector for first load as the element tree is different from when the app fully starts up)
if(!window.location.pathname.startsWith("/shorts")) {
  // If we aren't on a shorts page we know it won't load until it is navigated to so we watch for that navigation
  window.addEventListener('yt-navigate-finish', findShortsPlayerListener);
}
// If we are already on a shorts page on first load we try to find the player immediately, if this fails  we fall back into the regular player callback loop
else if (!findShortsPlayer("#player video")) {
  findShortsPlayerCallback();
}
