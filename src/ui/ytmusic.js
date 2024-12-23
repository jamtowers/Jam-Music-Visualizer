// YouTube Music specific logic

// import { calcBars } from "../visualizers/bar-vis.js";
import { canvas } from "./global.js";

canvas.classList.add('music');

const miniGuide = document.getElementById('mini-guide');

// TODO: update this to reduce the width of the canvas by 240px as well (note to self, would this be better done through a class?)
const miniGuideObserver = new MutationObserver(() => {
  if (miniGuide.style.display !== 'none') {
    canvas.style.left = '0';
  }
  if (miniGuide.style.display === 'none') {
    canvas.style.left = '240px';
  }
});
miniGuideObserver.observe(miniGuide, { attributes: true, childList: false });

// // This section keeps track on if the player page is open or not, as this can effect if scroll bar is there or not we use this as a chance to recalculate the canvas values
// const playerBar = document.querySelectorAll('ytmusic-player-bar[slot=player-bar]')[0];

// let playerPageOpen = playerBar.hasAttribute("player-page-open");
// let playerPageOpenTimeout;

// const playerBarObserver = new MutationObserver(() => {
//   console.log("observed");
//   if(playerBar.hasAttribute("player-page-open") && !playerPageOpen) {
//     playerPageOpen = true;
//     clearTimeout(playerPageOpenTimeout);
//     playerPageOpenTimeout = setTimeout(() => {
//       calcBars();
//     }, 400);
//     console.log("opened");
//   }
//   else if(playerPageOpen) {
//     playerPageOpen = false;
//     clearTimeout(playerPageOpenTimeout);
//     playerPageOpenTimeout = setTimeout(() => {
//       calcBars();
//     }, 400);
//     console.log("closed");
//   }
//   else {
//     console.log("something else");
//   }
// });
// playerBarObserver.observe(playerBar, { attributes: true, childList: false });

// const rightButtons = document.getElementById('right-controls').children[1];
// const buttonElement = rightButtons.appendChild(document.createElement('tp-yt-paper-icon-button')); // The youtube music app takes over from this and populate some more elements for us
// buttonElement.classList.add('volume', 'style-scope', 'ytmusic-player-bar'); // it doesn't add the classes however so we do that here, we're also using the "volume" class to nab the reactive styles from that
// buttonElement.children[0].innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z"></path></svg>'; // here we're injecting the icon itself

// // Bind the settings menu event
// buttonElement.addEventListener("click", (_event) => {
//   toggleSettings();
// });


// TODO: add buttons for the other sizes (tablet and mobile)
