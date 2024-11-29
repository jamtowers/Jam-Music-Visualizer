chrome.runtime.onMessage.addListener(
  // eslint-disable-next-line no-unused-vars
  function(request, _sender, _sendResponse) {
    if(request === "openGlobalOptions") {
      chrome.runtime.openOptionsPage();
    }
  }
);
