/** @type { HTMLVideoElement | HTMLAudioElement | undefined } */
let mediaElement = undefined;

export function setMediaElement(newMediaElement) {
  mediaElement = newMediaElement;
}

/** 
 * Returns if the current media element is paused, defaults to true if media element is undefined
 * @returns {boolean}
 */
export function isPaused() {
  return mediaElement ? mediaElement.paused : false;
}
