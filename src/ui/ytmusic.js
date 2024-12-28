// YouTube Music specific logic

import { canvas } from "./global.js";
import { updateCanvasSize } from "../shared/canvas.js";

canvas.classList.add('music');

let updateCanvasSizeTimeout;

/**
 * Updates the canvas values, includes a timeout to account for animation times and the like, cancels old timeout if one exists
 */
function updateCanvasTimeout() {
  clearTimeout(updateCanvasSizeTimeout);
  updateCanvasSizeTimeout = setTimeout(() => {
    updateCanvasSize();
  }, 400);
}

const ytMusicLayout = document.getElementById('layout');

let playerPageOpen = ytMusicLayout.hasAttribute("player-page-open");
let playerFullscreened = ytMusicLayout.hasAttribute("player-fullscreened");

const ytMusicLayoutObserver = new MutationObserver(() => {
  // Player open handling
  if(ytMusicLayout.hasAttribute("player-page-open") && !playerPageOpen) {
    playerPageOpen = true;
    updateCanvasTimeout();
  }
  else if(!ytMusicLayout.hasAttribute("player-page-open") && playerPageOpen ) {
    playerPageOpen = false;
    updateCanvasTimeout();
  }
  // player fullscreened handling
  if(ytMusicLayout.hasAttribute("player-fullscreened") && !playerFullscreened) {
    playerFullscreened = true;
    updateCanvasSize();
  }
  else if(!ytMusicLayout.hasAttribute("player-fullscreened") && playerFullscreened ) {
    playerFullscreened = false;
    updateCanvasSize();
  }
});
ytMusicLayoutObserver.observe(ytMusicLayout, { attributes: true, childList: false });

// const rightButtons = document.getElementById('right-controls').children[1];
// const buttonElement = rightButtons.appendChild(document.createElement('tp-yt-paper-icon-button')); // The youtube music app takes over from this and populate some more elements for us
// buttonElement.classList.add('volume', 'style-scope', 'ytmusic-player-bar'); // it doesn't add the classes however so we do that here, we're also using the "volume" class to nab the reactive styles from that
// buttonElement.children[0].innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z"></path></svg>'; // here we're injecting the icon itself

// // Bind the settings menu event
// buttonElement.addEventListener("click", (_event) => {
//   toggleSettings();
// });

// TODO: add buttons for the other sizes (tablet and mobile)
