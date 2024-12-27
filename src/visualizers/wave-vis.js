import { canvas } from "../ui/global.js";
import { analyser, frequencyBinCount, dataArray } from "../audio-controllers/audio-context.js";
import { canvasCtx } from "../shared/canvas.js";
import { userSettings } from "../shared/user-settings.js";

// Constants used in the drawing calculation, get recalculated on canvas size change
let sliceWidth = 0;
let radius1 = 0;
let initalx = 0;
let initaly = 0;

function calcConstants() {
  canvasCtx.lineWidth = 3000 / canvas.height;
  sliceWidth = canvas.width / frequencyBinCount * 4;
  radius1 = canvas.height / 4;
  initalx = canvas.width / 2 + radius1;
  initaly = canvas.height / 2;
}

export function activate() {
  // This is a synthetic event, it fires on canvas size change, See ../shared/canvas.js for specifics
  window.addEventListener("recalc", calcConstants);
  // Once we bind the event handler we also want to run the function ourselves to initialize the constants
  calcConstants();
}

export function deactivate() {
  window.removeEventListener("recalc", calcConstants);
}

/**
 * @param {boolean} isCircle If line is getting rendered as a circle or not
 */
export function drawLineVis(isCircle) {
  analyser.getByteTimeDomainData(dataArray);

  if(isCircle) canvasCtx.lineWidth = 3;
  
  canvasCtx.beginPath();
  let x = 0;
  let lastx = initalx;
  let lasty = initaly;

  for (let i = frequencyBinCount / 2; i < frequencyBinCount; i++) {
    const v = (((dataArray[i] / 128.0) - 1) * (userSettings.maxHeight / 100)) + 1;
    const radius2 = radius1 + (v * v * 150) * (canvas.height / 1500);
    const y = v * canvas.height / 2;
    if (isCircle) {
      canvasCtx.lineTo((canvas.width / 2) + radius2 * Math.cos(i * (2 * Math.PI) / frequencyBinCount * 2), (canvas.height / 2) + radius2 * Math.sin(i * (2 * Math.PI) / frequencyBinCount * 2) * -1);
    } else {
      canvasCtx.lineTo(x, y);
    }
    lastx = (canvas.width / 2) + radius2 * Math.cos(i * (2 * Math.PI) / frequencyBinCount);
    lasty = (canvas.height / 2) + radius2 * Math.sin(i * (2 * Math.PI) / frequencyBinCount) * -1;
    x += sliceWidth;
  }
  if (isCircle) { canvasCtx.lineTo(lastx, lasty); }
  canvasCtx.stroke();
}
