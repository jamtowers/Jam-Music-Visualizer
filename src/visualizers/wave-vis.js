import { canvas } from "../ui/global.js";
import { analyser, frequencyBinCount, dataArray } from "../shared/audio.js";
import { canvasCtx } from "../shared/canvas.js";
import { userSettings } from "../shared/user-settings.js";

/**
 * 
 * @param {CanvasRenderingContext2D} canvasCtx 
 * @param {boolean} isCircle 
 */
function drawLineVis(isCircle) {
  analyser.getByteTimeDomainData(dataArray);

  canvasCtx.lineWidth = 3000 / window.innerHeight;

  if(isCircle) canvasCtx.lineWidth = 3;

  // canvasCtx.shadowColor = '#000';
  // canvasCtx.shadowBlur = 1;
  // canvasCtx.shadowOffsetX = 0;
  // canvasCtx.shadowOffsetY = 0;
  
  canvasCtx.beginPath();
  const sliceWidth = canvas.width / frequencyBinCount * 4;
  const radius1 = canvas.height / 4;
  let x = 0;
  let lastx = canvas.width / 2 + radius1;
  let lasty = canvas.height / 2;

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


export function drawWaveVis() {
  return drawLineVis(false);
}

export function drawCircleVis() {
  return drawLineVis(true);
}