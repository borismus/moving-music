/*
 * Copyright 2015 Boris Smus. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Connect the start VR button.
function main() {
  start();
}

var video;
var audio;
var manager;
var isLoaded = false;

function start() {
  var set = Util.getParameterByName('set');
  var mode = Util.getParameterByName('mode');
  // Create the world.
  choreographer = new Choreographer({set: set, mode: mode});
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
  WebFont.load({
    google: {
      families: ['Dosis']
    },
    active: function() {
      if (window.orientation == 0 || window.orientation == 180) {
        video.toast('headphones', 5000);
      } else {
        video.toast('headphones required', 5000);
      }
    },
  });

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
    if (Util.iOS()) {
      video.toast('tap to start', 10000);
    }
    choreographer.onStarted();
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
  choreographer.update();
  video.render();
  audio.render();

  requestAnimationFrame(loop);
}

var isStarted = false;
function onTouchStart() {
  if (Util.iOS() && !isStarted && isLoaded) {
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

function dots(num) {
  var out = '';
  for (var i = 0; i < num; i++) {
    out += '.';
  }
  return out;
}

function onVisibilityChange(e) {
  if (!document.hidden) {
    // Play the sounds when page becomes visible.
    audio.setMute(false);
  } else {
    // Pause them when the page is hidden.
    audio.setMute(true);
  }
}

window.addEventListener('DOMContentLoaded', main);
window.addEventListener('touchstart', onTouchStart);
window.addEventListener('keydown', onKeyDown);
document.addEventListener('visibilitychange', onVisibilityChange);
