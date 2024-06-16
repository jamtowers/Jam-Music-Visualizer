import { canvas } from "../ui/global.js";
import { analyser, frequencyData } from "../shared/audio.js";
import { canvasCtx } from "../shared/canvas-context.js";

/** How wide each of the bars are in px */
const barWidth = 12;
/** How much space between each bar in px */
const barSpacing = 2;

/**
 * Array of x coords for each bars x origin
 * @type {number[]}
 */
let barCoords = [];

/**
 * Calculates the x coord for each bar, needs to be done every time the canvas size or the active canvas itself changes
 */
export function calcBars() {
  // Total space needed for each bar
  const barSpace = barSpacing + barWidth;

  let numberOfBars = Math.floor(canvas.width / barSpace);

  // Calulate offset required to ensure bars are centered
  let offset = (canvas.width % barSpace) / 2;

  // reset coords
  barCoords = [];

  // Calculate the x coord for each bar
  for (let i = 0; i < numberOfBars; i++) {
    barCoords[i] = (barSpace * i) + offset;
  }
}

export function drawBarVis() {
  // What does this do? I dunno, makes it work though
  analyser.getByteFrequencyData(frequencyData);

  for (let i = 0; i < barCoords.length; i++) {
    // no idea how this works, was in original code and what it does illudes me, takes the frequency data and turns it into an ampitude
    const formula = Math.ceil(Math.pow(i, 1.25));
    const normalisedFrequencyData = frequencyData[formula];
    const barHeight = ((normalisedFrequencyData * normalisedFrequencyData * normalisedFrequencyData) / (255 * 255 * 255)) * (canvas.height * 0.30); //TODO: Reintroduce height multiplyer

    if (barHeight === 0) continue; // if the bar is nothing we simply skip it;

    canvasCtx.fillRect(barCoords[i], canvas.height - barHeight, barWidth, barHeight);
  }
}