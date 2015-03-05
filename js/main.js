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
  video = new VideoRenderer({selector: 'body', overview: false});
  video.setManager(manager);
  video.addLight();
  video.addSkybox();

  // Create the audio renderer.
  audio = new AudioRenderer();
  audio.setManager(manager);
  audio.on('ready', onAudioLoaded);

  // Show a "use headphones" dialog briefly.
  video.toast('headphones required', 8000);

  // After a little while, if we're not loaded yet, start updating progress.
  setTimeout(function() {
    progressInterval = setInterval(updateProgress, 500);
  }, 3000);

  loop();
}

var counter = 0;
function updateProgress() {
  if (isLoaded) {
    clearTimeout(progressInterval);
    if (iOS()) {
      video.toast('tap to start', 10000);
    }
    return;
  }
  var percent = audio.getLoadingProgress();
  if (percent < 1) {
    var percentLabel = Math.floor(percent * 100);
    video.toast('loading... ' + percentLabel + '%', 3000);
  } else {
    // We've loaded the audio tracks, and now we're just decoding them.
    video.toast('decoding' + this.dots(counter % 4), 3000);
  }
  counter += 1;
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

var isStarted = false;
function onTouchStart() {
  if (iOS() && !isStarted && isLoaded) {
    audio.start();
    isStarted = true;
  } else {
    choreographer.setNextMode();
  }
}

function onKeyDown(e) {
  if (e.keyCode == 32) {
    choreographer.setNextMode();
  }
}

function iOS() {
  return /(iPhone|iPod|iPad)/i.test(navigator.userAgent);
}

function dots(num) {
  var out = '';
  for (var i = 0; i < num; i++) {
    out += '.';
  }
  return out;
}

window.addEventListener('DOMContentLoaded', main);
window.addEventListener('touchstart', onTouchStart);
window.addEventListener('keydown', onKeyDown);
