// Note: this is just the functions from visualiser.js that were pulled out when I broke up that file, But I chose not to reimpliment this one just yet, so for the moment the code sits here unused.

function ambientVis() {
  const activeSource = findActiveAudioSource();
  mediaElements[activeSource].analyser.getByteFrequencyData(mediaElements[activeSource].frequencyData);

  ambience.style.display = 'block';
  ambience.style.height = window.innerHeight - 72 + 'px'; // TODO: Update this magic 72 to bottom offset value
  ambience.style.boxShadow = 'inset 0px 0px 500px rgba(255,255,255,' + mediaElements[activeSource].frequencyData[2] / 255 + ')';

  document.getElementById('topGlow').style.boxShadow = '0px 0px 500px 500px rgba(50,50,255,' + (mediaElements[activeSource].frequencyData[8] * mediaElements[activeSource].frequencyData[8]) / (255 * 255) + ')';
  document.getElementById('bottomGlow').style.boxShadow = '0px 0px 500px 500px rgba(255,50,50,' + (mediaElements[activeSource].frequencyData[40] * mediaElements[activeSource].frequencyData[40]) / (255 * 255) + ')';
  document.getElementById('leftGlow').style.boxShadow = '0px 0px 500px 500px rgba(50,255,50,' + (mediaElements[activeSource].frequencyData[160] * mediaElements[activeSource].frequencyData[160]) / (255 * 255) + ')';
  document.getElementById('rightGlow').style.boxShadow = '0px 0px 500px 500px rgba(255,255,50,' + (mediaElements[activeSource].frequencyData[500] * mediaElements[activeSource].frequencyData[500]) / (255 * 255) + ')';
}


let runAmbienceVisualizer;

function toggleAmbienceViz() {
  if (visualizerToggles[3] == false) {
    visualizerToggles[3] = true;
    runAmbienceVisualizer = setInterval(ambientVis, 1);
  } else {
    ambience.style.display = 'none';
    clearInterval(runAmbienceVisualizer);
    visualizerToggles[3] = false;
  }
}
