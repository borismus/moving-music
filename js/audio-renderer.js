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

// Observer's sound cone configuration.
var IN_FOV_GAIN = 1;
var OUT_FOV_GAIN = 0.5;
var FOV_RAMP_TIME = 1.5;

// Doppler effect configuration.
var ENABLE_DOPPLER = false;
var DOPPLER_FACTOR = 1;

var REF_DISTANCE = 3;

function AudioRenderer() {
  // Whether we should stream the tracks via MediaElements, or load them
  // directly as audio buffers.
  // TODO(smus): Once crbug.com/419446 is fixed, switch to streaming.
  this.isStreaming = false;

  this.isMuted = false;

  // Various audio nodes keyed on UUID (so we can update them later).
  this.panners = {};
  this.gains = {};
  this.buffers = {};
  // Tracking buffer loading progress.
  this.progress = {};
  // For streaming.
  this.audioTags = {};
  this.ready = {};
  this.analysers = {};

  // Source nodes.
  this.sources = {};

  this.times = new Uint8Array(2048);

  // Callbacks.
  this.callbacks = {};

  this.init();
}

AudioRenderer.prototype.init = function() {
  // Start by preparing the audio graph.
  // TODO: Fix up for prefixing.
  window.AudioContext = window.AudioContext||window.webkitAudioContext;
  this.context = new AudioContext();

  // For calculating isTrackWithinFov_:
  this.cameraDirection = new THREE.Vector3();
  this.trackPosition = new THREE.Vector3();

  // Pipe the mix through a convolver node for a room effect.
  var convolver = this.context.createConvolver();
  Util.loadTrackSrc(this.context, 'snd/forest_impulse_response.wav', function(buffer) {
    convolver.buffer = buffer;
  });
  convolver.connect(this.context.destination);

  // Setup the mix.
  var mix = this.context.createGain();
  mix.connect(convolver);


  this.convolver = convolver;
  this.mix = mix;
};

AudioRenderer.prototype.setManager = function(manager) {
  this.manager = manager;
  // Load audio tracks for each of the tracks in the manager.
  for (var id in manager.tracks) {
    if (this.isStreaming) {
      this.streamTrack_(id);
    } else {
      this.loadTrack_(id);
    }
  }
};

AudioRenderer.prototype.start = function() {
  for (var id in this.manager.tracks) {
    var source;
    if (this.isStreaming) {
      source = this.context.createMediaElementSource(this.audioTags[id]);
      source.loop = true;
    } else {
      source = this.context.createBufferSource();
      source.buffer = this.buffers[id];
      source.loop = true;
    }
    // Create a panner for each source.
    var panner = this.context.createPanner();
    panner.panningModel = 'HRTF';
    panner.refDistance = REF_DISTANCE;

    // Create an analyser to calculate amplitude per track.
    var analyser = this.context.createAnalyser();

    var gain = this.context.createGain();

    // Connect the audio graph.
    source.connect(analyser);
    analyser.connect(gain);
    gain.connect(panner);
    panner.connect(this.mix);
    //panner.connect(this.context.destination);

    // Store nodes for later use.
    this.panners[id] = panner;
    this.gains[id] = gain;
    this.analysers[id] = analyser;

    if (this.isStreaming) {
      source.mediaElement.play();
    } else {
      source.start(0);
    }

    this.sources[id] = source;
  }
};

AudioRenderer.prototype.setMute = function(isMuted) {
  var gain = isMuted ? 0 : 1;
  this.mix.gain.value = gain;
};

AudioRenderer.prototype.render = function() {
  // Set the orientation of the observer
  this.setOrientation_();

  // Update the position of the objects.
  for (var id in this.manager.tracks) {
    var track = this.manager.tracks[id];
    // Assume that the track object is present.
    var panner = this.panners[id];
    if (!panner) {
      return console.error('No panner found for id: %s.', id);
    }

    // Set the position of each track object as they spin.
    panner.setPosition(track.position[0], track.position[1], track.position[2]);
    if (ENABLE_DOPPLER) {
      panner.setVelocity(track.velocity[0] * DOPPLER_FACTOR,
                         track.velocity[1] * DOPPLER_FACTOR,
                         track.velocity[2] * DOPPLER_FACTOR
      );
    }

    // Create the gain-based observer soundcone.
    this.setObserverCone_(id);

    // Also calculate the amplitude of the signal.
    var maxAmp = this.calculateAmplitude_(id);
    track.setAmplitude(maxAmp);
  }
};

AudioRenderer.prototype.on = function(event, callback) {
  this.callbacks[event] = callback;
};

AudioRenderer.prototype.getLoadingProgress = function() {
  var totalProgress = 0;
  for (var id in this.progress) {
    totalProgress += this.progress[id];
  }
  return totalProgress / this.manager.trackCount;
};



AudioRenderer.prototype.streamTrack_ = function(id) {
  var track = this.manager.tracks[id];
  var audio = new Audio();
  audio.src = track.src;
  this.audioTags[id] = audio;
  audio.addEventListener('canplay', function() {
    this.ready[id] = true;
    this.initializeIfReady_();
  }.bind(this));
};

AudioRenderer.prototype.loadTrack_ = function(id) {
  var track = this.manager.tracks[id];
  Util.loadTrackSrc(this.context, track.src, function(buffer) {
    this.buffers[id] = buffer;
    this.ready[id] = true;
    this.initializeIfReady_();
  }.bind(this), function(progress) {
    this.progress[id] = progress;
  }.bind(this));
};

AudioRenderer.prototype.initializeIfReady_ = function() {
  // We're ready if all of the tracks are loaded (ie. there's a buffer for
  // each of the manager's tracks).
  for (var id in manager.tracks) {
    if (!this.ready[id]) {
      console.log('Audio track %s not ready yet.', manager.tracks[id].src);
      // One of the buffers isn't loaded yet. Abort!
      return false;
    }
  }

  // And callback if anyone cares.
  if (this.callbacks.ready) {
    console.log('All audio tracks ready.');
    this.callbacks.ready();
  }
};

/**
 * Returns a value in [0,1].
 */
AudioRenderer.prototype.calculateAmplitude_ = function(id) {
  var analyser = this.analysers[id];
  // NB: getFloatTimeDomainData is newer, still not available in iOS8.
  analyser.getByteTimeDomainData(this.times);
  var maxAmp = -Infinity;
  for (var i = 0; i < this.times.length; i++) {
    var amp = 128-this.times[i];
    if (amp > maxAmp) {
      maxAmp = amp;
    }
  }
  return maxAmp/128;
};

/**
 * Implements an observer soundcone similar to what panners do for audio sources.
 */
AudioRenderer.prototype.setObserverCone_ = function(id) {
  var gain = this.gains[id].gain;
  var track = this.manager.tracks[id];
  var inFov = this.isTrackWithinFov_(id, 40);
  // If the track is entering the field of view, ramp up.
  if (inFov && !track.inFov) {
    console.log('Fading in %s', track.src);
    gain.linearRampToValueAtTime(IN_FOV_GAIN,
        this.context.currentTime + FOV_RAMP_TIME);
  }
  // If the track is leaving the field of view, ramp down.
  if (!inFov && track.inFov) {
    console.log('Fading out %s', track.src);
    gain.linearRampToValueAtTime(OUT_FOV_GAIN,
        this.context.currentTime + FOV_RAMP_TIME);
  }
  track.inFov = inFov;
};

AudioRenderer.prototype.isTrackWithinFov_ = function(id, fov) {
  // Get a unit vector pointing in the direction of the camera.
  var camera = this.manager.getCameraQuaternion();
  this.cameraDirection.set(0, 0, -1);
  this.cameraDirection.applyQuaternion(camera);

  // Now get the vector corresponding to the position of this track.
  var position = this.manager.tracks[id].position;
  this.trackPosition.set(position[0], position[1], position[2]);
  var angle = this.cameraDirection.angleTo(this.trackPosition);
  return angle < THREE.Math.degToRad(fov);
};

AudioRenderer.prototype.setOrientation_ = function() {
  var camera = this.manager.getCameraQuaternion();
  this.cameraDirection.set(0, 0, -1);
  this.cameraDirection.applyQuaternion(camera);
  var dir = this.cameraDirection.clone();
  this.cameraDirection.set(0, 1, 0);
  this.cameraDirection.applyQuaternion(camera);
  var up = this.cameraDirection;
  this.context.listener.setOrientation(dir.x, dir.y, dir.z, up.x, up.y, up.z);
};
