
/**
 * 
 * @param {CanvasRenderingContext2D} canvasCtx 
 * @param {HTMLCanvasElement} canvas 
 * @param {any} audioSource 
 * @param {boolean} isCircle 
 */
function drawLineVis(canvasCtx, canvas, audioSource, isCircle) {
  audioSource.analyser.getByteFrequencyData(audioSource.frequencyData);

  canvasCtx.lineWidth = 3000 / window.innerHeight;

  if(isCircle) canvasCtx.lineWidth = 3;

  // canvasCtx.shadowColor = '#000';
  // canvasCtx.shadowBlur = 1;
  // canvasCtx.shadowOffsetX = 0;
  // canvasCtx.shadowOffsetY = 0;
  
  canvasCtx.beginPath();
  const sliceWidth = canvas.width / audioSource.bufferLength * 4;
  const radius1 = canvas.height / 4;
  let x = 0;
  let lastx = canvas.width / 2 + radius1;
  let lasty = canvas.height / 2;

  for (let i = audioSource.bufferLength / 2; i < audioSource.bufferLength; i++) {
    const v = (((audioSource.dataArray[i] / 128.0) - 1) * (/*userPreferences.max_height*/ 100 / 100)) + 1;
    const radius2 = radius1 + (v * v * 150) * (canvas.height / 1500);
    const y = v * canvas.height / 2;
    if (isCircle) {
      canvasCtx.lineTo((canvas.width / 2) + radius2 * Math.cos(i * (2 * Math.PI) / audioSource.bufferLength * 2), (canvas.height / 2) + radius2 * Math.sin(i * (2 * Math.PI) / audioSource.bufferLength * 2) * -1);
    } else {
      canvasCtx.lineTo(x, y);
    }
    lastx = (canvas.width / 2) + radius2 * Math.cos(i * (2 * Math.PI) / audioSource.bufferLength);
    lasty = (canvas.height / 2) + radius2 * Math.sin(i * (2 * Math.PI) / audioSource.bufferLength) * -1;
    x += sliceWidth;
  }
  if (isCircle) { canvasCtx.lineTo(lastx, lasty); }
  canvasCtx.stroke();
}


export function drawWaveVis(canvasCtx, canvas, audioSource) {
  return drawLineVis(canvasCtx, canvas, audioSource, false);
}

export function drawCircleVis(canvasCtx, canvas, audioSource) {
  return drawLineVis(canvasCtx, canvas, audioSource, true);
}