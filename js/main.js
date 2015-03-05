// Connect the start VR button.
function main() {
  start();
}

var video;
var audio;
var manager;
var isLoaded = false;

function start() {
  // Create the world.
  choreographer = new Choreographer();
  manager = choreographer.manager;
  choreographer.on('modechanged', onModeChanged);

  // Create a video renderer.
  video = new VideoRenderer({selector: '#container', overview: false});
  video.setManager(manager);
  video.addLight();
  video.addSkybox();

  // Create the audio renderer.
  audio = new AudioRenderer();
  audio.setManager(manager);
  audio.on('ready', onAudioLoaded);

  // Show a "use headphones" dialog briefly.
  video.toast('please put on headphones');

  // After a little while, if we're not loaded yet, start updating progress.
  setTimeout(function() {
    progressInterval = setInterval(updateProgress, 3000);
  }, 3000);

  loop();
}

function updateProgress() {
  if (isLoaded) {
    clearTimeout(progressInterval);
    return;
  }
  var percent = Math.floor(audio.getLoadingProgress() * 100);
  console.log(percent)
  video.toast('loading... ' + percent + '%', 3000);
}

function onAudioLoaded() {
  isLoaded = true;
  audio.start();
}

function onModeChanged(mode) {
  switch (mode) {
    case Choreographer.Modes.CLUSTERED:
      video.toast('clustered', 2000);
      break;
    case Choreographer.Modes.SURROUND:
      video.toast('surround', 2000);
      break;
    case Choreographer.Modes.MOVING:
      video.toast('moving', 2000);
      break;
  }
}

function loop() {
  manager.update();
  video.render();
  audio.render();

  requestAnimationFrame(loop);
}

function onTouchStart() {
  choreographer.setNextMode();
}

function onKeyDown(e) {
  if (e.keyCode == 32) {
    choreographer.setNextMode();
  }
}

window.addEventListener('DOMContentLoaded', main);
window.addEventListener('touchstart', onTouchStart);
window.addEventListener('keydown', onKeyDown);
