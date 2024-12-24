// YouTube Music specific logic

import { canvas, updateCanvasSize } from "./global.js";

canvas.classList.add('music');

let updateCanvasSizeTimeout;

/**
 * Updates the canvas values, includes a timeout to account for animation times and the like, cancels old timeout if one exists
 */
function updateCanvas() {
  clearTimeout(updateCanvasSizeTimeout);
  updateCanvasSizeTimeout = setTimeout(() => {
    updateCanvasSize();
  }, 400);
}

const miniGuide = document.getElementById('mini-guide');

const miniGuideObserver = new MutationObserver(() => {
  if (miniGuide.style.display !== 'none') {
    canvas.style.left = '0';
  }
  if (miniGuide.style.display === 'none') {
    canvas.style.left = '240px';
  }
  updateCanvasSize();
});
miniGuideObserver.observe(miniGuide, { attributes: true, childList: false });

// This section keeps track on if the player page is open or not, as this can effect if scroll bar is there or not we use this as a chance to recalculate the canvas values
const playerBar = document.querySelectorAll('ytmusic-player-bar[slot=player-bar]')[0];

let playerPageOpen = playerBar.hasAttribute("player-page-open");

const playerBarObserver = new MutationObserver(() => {
  if(playerBar.hasAttribute("player-page-open") && !playerPageOpen) {
    playerPageOpen = true;
    updateCanvas();
  }
  else if(playerPageOpen) {
    playerPageOpen = false;
    updateCanvas();
  }
});
playerBarObserver.observe(playerBar, { attributes: true, childList: false });

// const rightButtons = document.getElementById('right-controls').children[1];
// const buttonElement = rightButtons.appendChild(document.createElement('tp-yt-paper-icon-button')); // The youtube music app takes over from this and populate some more elements for us
// buttonElement.classList.add('volume', 'style-scope', 'ytmusic-player-bar'); // it doesn't add the classes however so we do that here, we're also using the "volume" class to nab the reactive styles from that
// buttonElement.children[0].innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z"></path></svg>'; // here we're injecting the icon itself

// // Bind the settings menu event
// buttonElement.addEventListener("click", (_event) => {
//   toggleSettings();
// });


// TODO: add buttons for the other sizes (tablet and mobile)
