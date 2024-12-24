// This is a stub for wave-vis for the line version of wave-vis
// Wave vis needs to get refactored to avoid the need for the if(isCircle) logic at some point, but for the moment this is the solution

import { drawLineVis } from "./wave-vis.js";

export const drawVis = () => {drawLineVis(false)};

export { activate, deactivate } from"./wave-vis.js";
