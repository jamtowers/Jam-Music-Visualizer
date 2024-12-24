import { canvas } from "../ui/global.js"

export const canvasCtx = canvas.getContext('2d');

// Why does this exist? eventually I want the ability to change which canvas is being used (so you can switch between the player canvas and the global canvas)
// So that logic will be held here once it is implemented

// TODO: implement player canvas
// const playerCanvasCtx = playerCanvas.getContext('2d');

const recalcEvent = new Event("recalc");

export function updateCanvasSize() {
  // Get the actual calculated size of the canvas (dictated by css) and set the height and width attributes accordingly
  // This corrects the coordinate space of the canvas to match it's size
  let updated = false;
  const canvasRect = canvas.getBoundingClientRect();
  if(canvas.height !== canvasRect.height) {
    canvas.setAttribute('height', canvasRect.height);
    updated = true;
  }
  if(canvas.width !== canvasRect.width) {
    canvas.setAttribute('width', canvasRect.width);
    updated = true;
  }
  // If the canvas size has indeed changed we fire our custom recalc event for anything that needs to recalculate based on the canvas size
  if(updated) {
    window.dispatchEvent(recalcEvent);
  }
}

// used as part of a debouncing timeout
let updateGUITimeoutId = undefined;

// Screen resize handling
window.addEventListener('resize', () => {
  window.clearTimeout(updateGUITimeoutId);
  updateGUITimeoutId = window.setTimeout(updateCanvasSize, 250);
});

// To initialize canvas values
updateCanvasSize();
