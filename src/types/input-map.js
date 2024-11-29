/**
 * @typedef inputHandling
 * @type object
 * 
 * @property {string} propertyName Name of property for corresponding property in userSettings
 * @property {(input) => any} inputCast Casting function for this setting input
 * @property {string} inputProp Name of property for corresponding value on input element
 * @property {((input, inputElement) => void) | undefined} onChangeHandling Additional handling for this setting run on update, gets passed current input value
 * @property {((input) => void) | undefined} initHandling Additional handling for this setting run on initalisation, gets passed current input value
 */


/**
 * @typedef inputHandlingMap
 * Keys are the input IDs for the particular setting
 * @type {Object.<string, inputHandling>}
 */
