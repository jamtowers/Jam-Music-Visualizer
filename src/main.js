import { userSettings } from './shared/user-settings.js';
import { getCurrentProfile, profiles } from './shared/profile.js';

/**
 * Initializes UI for visualizer
 * @param  {...Promise} profileSpecificInitialization Extra promises for initializing, this is used for profile specific initializations
 */
async function initalize (...profileSpecificInitialization) {
  return await Promise.all([
    // Technically most of these gets imported indirectly through the UI initialization, but we import them here for explicitness
    import("./ui/global.js"), // Load global UI elements
    import("./visualizer.js"), // Load visualizer logic
    import("./shortcuts.js"), // Load keyboard shortcuts
    ...profileSpecificInitialization
  ]).then(() => {
    // If banner is enabled load it in and show startup message
    if(userSettings.showBanner) {
      import("./ui/banner.js").then(({ showBanner }) => {
        showBanner("Visualizer started; Press F2 to show settings.");
      });
    }
  });
}

switch (await getCurrentProfile()) {
  case profiles.music:
    if (userSettings.allowYoutubeMusic) {
      await initalize(import("./ui/ytmusic.js"));
    }
    else {
      console.log("Visualizer is disabled for youtube music");
    }
    break;
  case profiles.youtube:
    if (userSettings.allowYoutube) {
      await initalize(import("./ui/youtube.js"));
    }
    else {
      console.log("Visualizer is disabled for youtube");
    }
    break;
  default:
    // we should never hit the default case, but if we do we log an error and continue like it's a default profile
    console.error("Invalid profile");
    // eslint-disable-next-line no-fallthrough
  case profiles.default:
    if (userSettings.allowOther) {
      await initalize(import("./ui/other.js"));
    }
    else {
      console.log("Visualizer is disabled for other");
    }
    break;
}
