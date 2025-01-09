import { userSettings } from './shared/user-settings.js';
import { canvas, visualizerToggleButtons } from './ui/global.js';
import { canvasCtx } from './shared/canvas.js';
import { isPaused } from './audio-controllers/audio-context.js';

/** @type {number | null} */
let activeVisualizer = null;
/** 
 * Callback to visualizer drawing logic for active visualizer
 * @type {() => void | undefined}
 */
let activeVisualizerDrawer = undefined;
/** 
 * Cleanup logic for the active visualizer, run when visualizer is changed or turned off
 * @type {() => void | undefined}
 */
let visualizerCleanup = undefined;

const visualizers = ["bar-vis", "line-vis", "circle-vis"];

// const visualizerDrawers = [drawBarVis, drawWaveVis, drawCircleVis];

/**
 * Id of current animation frame of the visualization
 * @type {number | null}
 */
let animationFrame = null;

let hue = 0;

function cycleColorHue(alpha = 1) {
  hue++;
  if (hue > 359) hue = 0;
  return `hsla(${hue}, 100%, 50%, ${alpha})`;
}

/**
 * Logic to run on play of media, called from relevant audio controller
 */
export function onPlay() {
  // If we have an active visualizer and there isn't an animation running we start it
  if(activeVisualizer !== null && animationFrame === null) {
    animationFrame = window.requestAnimationFrame(runVis);
  }
};

/**
 * Logic to run on pause of media, called from relevant audio controller
 */
export function onPause() {
  // If we have an animation running we stop it on pause to save on CPU usage
  if(animationFrame !== null) {
    stopVis();
  }
};

function runVis() {
  // Clear canvas
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  // Set fill/outline color to relevant color
  const colour = userSettings.colorCycle ? cycleColorHue(0.7) : userSettings.primaryColor // TODO: change the cycle color to a time based thing, this is too fast
  canvasCtx.fillStyle = colour;
  canvasCtx.strokeStyle = colour;

  // Call the drawer function for the active visualizer
  activeVisualizerDrawer();

  animationFrame = window.requestAnimationFrame(runVis);
}

function stopVis() {
  window.cancelAnimationFrame(animationFrame); // stop the animation script
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
  animationFrame = null; // reset animation frame to null (as we use this to check if there is an animation running)
}

/**
 * @typedef VisualizerModule
 * @property {() => void} activate Activates event listeners and runs initialization logic for this visualizer
 * @property {() => void} deactivate Removes any event listeners added for this visualizer
 * @property {() => void} drawVis Function that draws this visualizer
 */

/**
 * Sets active visualizer, if null or same as active visualizer will disable visualizer
 * @param {number | null} vizNum Value to update active visualizer to
 */
export function setActiveVisualizer(vizNum) {
  if (activeVisualizer !== null) { // if we've changing from an existing visualizer we need to deselect it's button
    visualizerToggleButtons[activeVisualizer].classList.remove('selected');
  }

  // If we have any cleanup to do from an existing visualizer we do so here
  if(visualizerCleanup) {
    visualizerCleanup();
    visualizerCleanup = undefined;
  }

  if (activeVisualizer === vizNum || vizNum === null) {
    // If the visualizer is already active we want to toggle it off
    stopVis();
    activeVisualizer = null;
    activeVisualizerDrawer = undefined
    return;
  }

  activeVisualizer = vizNum;
  visualizerToggleButtons[activeVisualizer].classList.add('selected');

  import(`./visualizers/${visualizers[activeVisualizer]}.js`).then(
    /** @param {VisualizerModule} visualizer */
    (visualizer) => {
      visualizer.activate();
      activeVisualizerDrawer = visualizer.drawVis;
      visualizerCleanup = visualizer.deactivate;

      // animationFrame is the current animation request, if this is null it means that there is no current animation request, so we need to start it
      if (animationFrame === null && !isPaused()) {
        canvas.style.display = 'block';
        animationFrame = window.requestAnimationFrame(runVis);
      }
  });
}
