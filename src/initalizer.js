// Why does this exist? see this: https://stackoverflow.com/questions/48104433/how-to-import-es6-modules-in-content-script-for-chrome-extension
// TLDR is that it lets us use es6 imports without needing to run out code through webpack or anything like that

(async () => {
  const src = chrome.runtime.getURL("visualizer.js");
  await import(src);
})();
