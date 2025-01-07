/**
 * enum for profiles
 * @readonly
 * @enum {symbol}
 */
export const profiles = Object.freeze({
  default: Symbol("default"),
  music: Symbol("music"),
  youtube: Symbol("youtube"),
  exception: Symbol("exception"),
});

export async function getCurrentProfile() {
  let location = "";

  // Check if we're in a extension instance or service worker as we need to fetch the location differently in those cases
  if(typeof window === "undefined" || window.location.protocol === "chrome-extension:") {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    location = tab.url;
  }
  else {
    location = window.location.href;
  }

  if (location.startsWith('https://music.youtube.com')) return profiles.music;
  else if (location.startsWith('https://www.youtube.com')) {
    // There are sites outside of the regular YouTube web app on the www.youtube.com domain, we need to weed them out here
    // as the visualizer doesn't need to load on these pages, as they are separate apps the extension loads again if they navigate back
    const pathRegex = new RegExp('\/howyoutubeworks\/|\/creators\/|\/ads\/|^\/jobs\/|^\/t\/');
    if(pathRegex.test(location.substring(23))) {
      return profiles.exception;
    }
    return profiles.youtube;
  }
  return profiles.default;
};
