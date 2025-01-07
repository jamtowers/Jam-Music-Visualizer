import { audioCtx, analyser } from "./audio-context.js";
import { onPlay, onPause } from "../visualizer.js";
import { setMediaElement } from "./media-element.js";

// Youtube Music always has the video output element available so we can just fetch it
// This is always used even if used in audio only mode
const videoElement = document.getElementsByTagName('video')[0];
setMediaElement(videoElement);

const source = audioCtx.createMediaElementSource(videoElement);

source.connect(analyser);

videoElement.addEventListener('play', () => {
  onPlay();
});

videoElement.addEventListener('pause', () => {
  onPause();
});
