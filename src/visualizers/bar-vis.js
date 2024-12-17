import { canvas } from "../ui/global.js";
import { analyser, frequencyData, bufferLength } from "../shared/audio.js";
import { canvasCtx } from "../shared/canvas-context.js";
import { userSettings } from "../shared/user-settings.js";

/** How wide each of the bars are in px */
const barWidth = 12;
/** How much space between each bar in px */
const barSpacing = 2;
/** Changes how the frequency distribution is spread across the canvas, 1 = linear distribution, 1+ makes the higher frequencies more compressed, 40 is default */
const normalisationMagnitude = 40;

/**
 * @typedef frequencyRange
 * Numbers used to get the average of a particular range of frequencies
 * @property {number} rangeStart The frequency range we start at
 * @property {number} rangeEnd The frequency range we end at
 * @property {number} rangeDelta The absolute size of the frequency range we're using
 * @property {number} startFrequencyPercentage How much of the first frequency value we should use in average
 * @property {number} endFrequencyPercentage How much of the last frequency value we should use in average
 * @property {number} frequencyRangeSize Size of the frequency range we're averaging
 */

/**
 * @typedef bar
 * @property {number} xCoord x origin for this bar
 * @property {frequencyRange} frequencyRange numbers for the frequencies this bar represents
 */

/**
 * Array of properties for each bar
 * @type {bar[]}
 */
let bars = [];

/**
 * Calculates the x coord for each bar, needs to be done every time the canvas size or the active canvas itself changes
 */
export function calcBars() {
  // Total space needed for each bar
  const barSpace = barSpacing + barWidth;

  let numberOfBars = Math.floor(canvas.width / barSpace);

  // Calculate offset required to ensure bars are centered
  let offset = (canvas.width % barSpace) / 2;

  // reset bars
  bars = new Array(numberOfBars);

  // This next section is a lot of math that is difficult to explain how it works with inline comments, so I'm going to write out the theory here so it isn't just magic math terms to the uninitiated
  // Hopefully this will explain what we're trying to do even if the how isn't clear what is happening on any particular step
  // The problem: The frequency data is a lot less interesting at the high frequency range so we want to compress the higher frequencies so the lower frequencies are more spread out
  // The way I am solving this is by breaking the frequency data into a geometric series, this in effect makes the higher frequency bars represent a much larger range than the lower frequencies bars
  // The hard part of this solution is we want the geometric series to divvy up the frequencies consistently between different amount of bars and buffer sizes
  // This is to ensure the frequency data across the screen is consistent even when the screen size changes or the fftUni is increased/decreased
  // To do this we need calculate a first value that is based on the ratio between the buffer length and the number of bars, we then use this to inform what the geometric series ratio should be
  // Unfortunately due to the fact the geometric series equation is polynomial there isn't a straight forward algebraic way to calculate this value
  // To solve this we use the Newton-Raphson method to approximate the ratio for our target first value, to understand the math properly I recommend Google

  // For those who want to understand the math I've written the simplified equations in comments above the relevant code
  // For those these are the terms/base algebra I am using and the variables they align to:
  // From k=0 to n-1, sum(ar^k) = a(1-r^n)/(1-r)
  // sum(ar^k) = S
  // S = bufferLength
  // a = targetFirstValue (our actual first value might be slightly different to the ideal one)
  // r = ratio
  // n = numberOfBars

  /**
   * Returns the first value for a particular geometric series ratio value
   * @param {number} ratio Geometric series ratio value
   * @returns {number}
   */
  const calculateFirstValue = (ratio) => {
    // if the ratio is 1 then the distribution is going to be linear so we just work out the direct ratio between the buffer size and the number of bars
    if(ratio === 1) return bufferLength/numberOfBars;
    // a = S (1 - r)/(1 - r^n)
    return bufferLength * (1 - ratio)/(1 - ratio ** numberOfBars);
  }

  const targetFirstValue = (bufferLength / numberOfBars) / normalisationMagnitude;

  /**
   * Finds f(r) for the Newton method
   * @param {number} ratio
   * @returns {number}
   */
  const newtonFunction = (ratio) => {
    // f(r) = a (1 - r^n)/(1 - r) - S
    return targetFirstValue * (1 - ratio ** numberOfBars) / (1 - ratio) - bufferLength;
  }

  /**
   * Finds f'(r) for Newton method
   * @param {number} ratio 
   * @returns {number}
   */
  const newtonDerivative = (ratio) => {
    // f'(r) = (a (r + n (r - 1) r^n - r^(1 + n)))/((r - 1)^2 r)
    return (targetFirstValue * (ratio + numberOfBars * (ratio - 1) * ratio ** numberOfBars - ratio ** (1 + numberOfBars)))/((ratio - 1) ** 2 * ratio);
  }

  // fail safe loops counter
  let loops = 0;
  // Starting guess for Ratio
  let geometricRatio = 1.04;

  // The math breaks when the normalisationMagnitude is 1 as we're effectively targeting a geometric ratio of 1 (which breaks the math)
  if(normalisationMagnitude === 1) {
    loops = 101;
    geometricRatio = 1;
  }

  while (!(Math.abs(targetFirstValue - calculateFirstValue(geometricRatio)) < 0.01) && loops < 100) {
    // Next r = r - f(r)/f'(r)
    geometricRatio -= newtonFunction(geometricRatio)/newtonDerivative(geometricRatio);
    loops++;
  }
  const firstValue = calculateFirstValue(geometricRatio);

  let total = 0;
  
  // Calculate the x coord and frequency range for each bar
  for (let i = 0; i < numberOfBars; i++) {
    const frequencyRange = firstValue * geometricRatio ** i;

    const nextTotal = total + frequencyRange;

    bars[i] = {
      xCoord: offset + (barSpace * i),
      frequencyRange: {
        rangeStart: Math.floor(total),
        rangeEnd: Math.floor(nextTotal),
        rangeDelta: Math.floor(nextTotal) - Math.floor(total),
        startFrequencyPercentage: 1 - (total % 1),
        endFrequencyPercentage: nextTotal % 1,
        frequencyRangeSize: frequencyRange
      }
    };

    total = nextTotal;
  }
}

export async function drawBarVis() {
  analyser.getByteFrequencyData(frequencyData);
  bars.forEach(drawBar);
}

/**
 * Draws an individual bar
 * @param {bar} bar Current Bar we are drawing
 */
function drawBar(bar) {
  const barHeight = ((calcFrequencyAverage(bar.frequencyRange) / 255) ** 3) * canvas.height * (userSettings.maxHeight / 100);

  if (barHeight === 0) return; // if the bar is nothing we simply skip it;

  canvasCtx.fillRect(bar.xCoord, canvas.height - barHeight, barWidth, barHeight);
}

/**
 * Calculates the average frequency value for given frequency range
 * @param {frequencyRange} frequencyRange
 * @returns {number}
 */
function calcFrequencyAverage(frequencyRange) {
  // If the range only has one number we don't need to worry about averaging anything, we can just send it since we'd get the same result
  if(frequencyRange.rangeDelta === 0) {
    return frequencyData[frequencyRange.rangeStart];
  }

  // Get the frequency range we're looking at
  const range = frequencyData.slice(frequencyRange.rangeStart, frequencyRange.rangeEnd + 1);
  
  // First we handle the partial start and end numbers
  let rangeTotal = (range[0] * frequencyRange.startFrequencyPercentage) + (range[frequencyRange.rangeDelta] * frequencyRange.endFrequencyPercentage);

  // Now we add all the numbers in between the start and end numbers
  rangeTotal += range.slice(1, -1).reduce((partialSum, a) => partialSum + a, 0);

  // return average of range
  return (rangeTotal / frequencyRange.frequencyRangeSize);
}
