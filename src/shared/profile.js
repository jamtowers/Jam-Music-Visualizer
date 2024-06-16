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

let profile = profiles.default;
if (window.location.href.startsWith('https://music.youtube.com')) profile = profiles.music;
else if (window.location.href.startsWith('https://www.youtube.com')) profile = profiles.youtube;

export const currentProfile = profile;
