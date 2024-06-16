import { notificationsBanner } from "./global.js";

export function showBanner(txt) {
  setTimeout(() => {
    notificationsBanner.style.bottom = '150px';
    notificationsBanner.innerHTML = txt;
  }, 2000);
  setTimeout(() => {
    notificationsBanner.style.bottom = '-100px';
  }, 7000);
}
