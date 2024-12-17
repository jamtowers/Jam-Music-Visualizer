import { userSettings } from './user-settings.js';

const defaultCast = input => { return input }

export function bindInput(element, inputMap) {
  const { propertyName, inputCast = defaultCast, inputProp, onChangeHandling: additionalHandling, initHandling: additionalInitHandling } = inputMap[element.id];

  // Set initial value, if it's null populate it with an empty string
  if(userSettings[propertyName] !== null) {
    element[inputProp] = userSettings[propertyName];
  }
  else {
    element[inputProp] = "";
  }

  // Do any initial handling if it exists
  if(additionalInitHandling) additionalInitHandling(userSettings[propertyName]);

  // Bind change event
  const inputEvent = element.tagName === "BUTTON" ? "onclick" : "onchange";

  element[inputEvent] = () => {
    // Set user setting with new value
    userSettings[propertyName] = inputCast(element[inputProp]);
    chrome.storage.sync.set(userSettings);
    // Do any additional handling if it exists
    if(additionalHandling) additionalHandling(userSettings[propertyName], element);
  }
}

export function toggleHandling (input, inputElement) {
  inputElement.ariaPressed = input;
}

// Since the toggles are buttons and clicking them doesn't change the aria-pressed value itself we need to both invert and convert the value here
export const toggleCast = input => { return input === "false" }
// If we have more than one shared cast in the future it might be worth breaking it out into a separate file rather than tacking it on here
