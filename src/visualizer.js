import { drawBarVis } from './visualizers/bar-vis.js';
import { drawWaveVis, drawCircleVis } from './visualizers/wave-vis.js';
import { userSettings } from './shared/user-settings.js';
import { canvas, visualizerToggleButtons } from './ui/global.js';
import { canvasCtx } from './shared/canvas-context.js';
import { mediaElement } from './shared/audio.js';

/** @type {number | null} */
let activeVisualizer = null;

const visualizerDrawers = [drawBarVis, drawWaveVis, drawCircleVis];

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

mediaElement.addEventListener('play', () => {
  // If we have an active visualizer and there isn't an animation running we start it
  if(activeVisualizer !== null && animationFrame === null) {
    animationFrame = window.requestAnimationFrame(runVis);
  }
});

mediaElement.addEventListener('pause', () => {
  // If we have an animation running we stop it on pause to save on CPU useage
  if(animationFrame !== null) {
    stopVis();
  }
});

function runVis() {
  // Clear canvas
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  // Set fill/outline colour to relevant colour
  const colour = userSettings.colorCycle ? cycleColorHue(0.7) : userSettings.primaryColor // TODO: change the cycle colour to a time based thing, this is too fast
  canvasCtx.fillStyle = colour;
  canvasCtx.strokeStyle = colour;

  // Call the drawer function for the active visualizer
  visualizerDrawers[activeVisualizer]();

  animationFrame = window.requestAnimationFrame(runVis);
}

function stopVis() {
  window.cancelAnimationFrame(animationFrame); // stop the animation script
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
  animationFrame = null; // reset animation frame to null (as we use this to check if there is an animation running)
}

/**
 * Sets active visualizer, if null or same as active visualizer will disable visualizer
 * @param {number | null} vizNum Value to update active visualizer to
 */
export function setActiveVisualizer(vizNum) {
  if (activeVisualizer !== null) { // if we've changing from an existing visualiser we need to unselect it's button
    visualizerToggleButtons[activeVisualizer].classList.remove('selected');
  }

  if (activeVisualizer === vizNum || vizNum === null) {
    // If the visualiser is already active we want to toggle it off
    stopVis();
    activeVisualizer = null;
    return;
  }

  activeVisualizer = vizNum;
  visualizerToggleButtons[activeVisualizer].classList.add('selected');

  // animationFrame is the current animation request, if this is null it means that there is no current animation request, so we need to start it
  if (animationFrame === null && mediaElement.paused === false) {
    canvas.style.display = 'block';
    animationFrame = window.requestAnimationFrame(runVis);
  }
}
