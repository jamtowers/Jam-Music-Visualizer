import { canvas } from "../ui/global.js"

export const canvasCtx = canvas.getContext('2d');

// Why does this exist? eventually I want the ability to change which canvas is being used (so you can switch between the player canvas and the global canvas)
// So that logic will be held here once it is implemented

// TODO: implement player canvas
// const playerCanvasCtx = playerCanvas.getContext('2d');
