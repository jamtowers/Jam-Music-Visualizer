/**
 * @typedef UserSettings
 * @property {boolean} colorCycle
 * @property {boolean} autoConnect
 * @property {boolean} showBanner
 * @property {string} primaryColor
 * @property {number} maxHeight
 * @property {number} smoothingTimeConstant
 * @property {boolean} allowYoutube
 * @property {boolean} allowYoutubeMusic
 * @property {boolean} allowOther
 * @property {null | number} defaultVisualizer
 */

/** @type {UserSettings} */
export const defaultUserSettings = {
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

/**
 * Current User settings
 * @type {UserSettings}
 */
export const userSettings = await chrome.storage.sync.get().then((items) => {
  // Here we use the default settings as a base and assign any saved settings over that
  let settings = defaultUserSettings;
  Object.assign(settings, items);
  return settings;
}).catch(() => {
  console.error('Unable to load preferences:', error);
});
