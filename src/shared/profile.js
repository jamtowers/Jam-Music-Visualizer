/**
 * enum for profiles
 * @readonly
 * @enum {symbol}
 */
export const profiles = Object.freeze({
  default: Symbol("default"),
  music: Symbol("music"),
  youtube: Symbol("youtube"),
});

export async function getCurrentProfile() {
  let location = "";

  // Check if we're in a extention instance or service worker as we need to fetch the location differently in those cases
  if(typeof window === "undefined" || window.location.protocol === "chrome-extension:") {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    location = tab.url;
  }
  else {
    location = window.location.href;
  }

  if (location.startsWith('https://music.youtube.com')) return profiles.music;
  else if (location.startsWith('https://www.youtube.com')) return profiles.youtube;
  else return profiles.default;
};
