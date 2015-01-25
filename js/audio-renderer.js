function AudioRenderer() {
  // Whether we should stream the tracks via MediaElements, or load them
  // directly as audio buffers.
  this.isStreaming = false;

  // Various audio nodes keyed on UUID (so we can update them later).
  this.panners = {};
  this.buffers = {};
  this.audioTags = {};
  this.ready = {};
  this.analysers = {};

  this.times = new Float32Array(2048);

  // Callbacks.
  this.callbacks = {};

  this.init();
}

AudioRenderer.prototype.init = function() {
  // Start by preparing the audio graph.
  // TODO: Fix up for prefixing.
  window.AudioContext = window.AudioContext||window.webkitAudioContext;
  this.context = new AudioContext();
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
    panner.refDistance = 100;

    // Create an analyser to calculate amplitude per track.
    var analyser = this.context.createAnalyser();

    // Connect the audio graph.
    source.connect(analyser);
    analyser.connect(panner);
    panner.connect(this.context.destination);

    // Store nodes for later use.
    this.panners[id] = panner;
    this.analysers[id] = analyser;

    if (this.isStreaming) {
      source.mediaElement.play();
    } else {
      source.start();
    }
  }
};

AudioRenderer.prototype.render = function() {
  // Update the position of the objects.
  for (var id in this.manager.tracks) {
    var track = this.manager.tracks[id];
    // Assume that the track object is present.
    var panner = this.panners[id];
    if (!panner) {
      return console.error('No panner found for id: %s.', id);
    }
    panner.setPosition(track.position[0], track.position[1], track.position[2]);

    // Also calculate the amplitude of the signal.
    var maxAmp = this.calculateAmplitude_(id);
    track.setAmplitude(maxAmp);
  }
};

AudioRenderer.prototype.on = function(event, callback) {
  this.callbacks[event] = callback;
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

  var request = new XMLHttpRequest();
  request.open('GET', track.src, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously.
  request.onload = function() {
    this.context.decodeAudioData(request.response, function(buffer) {
      this.buffers[id] = buffer;
      this.ready[id] = true;
      this.initializeIfReady_();
    }.bind(this), function(e) {
      console.error(e);
    });
  }.bind(this)
  request.send();
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

AudioRenderer.prototype.calculateAmplitude_ = function(id) {
  var analyser = this.analysers[id];
  analyser.getFloatTimeDomainData(this.times);
  var maxAmp = -Infinity;
  for (var i = 0; i < this.times.length; i++) {
    var amp = this.times[i];
    if (amp > maxAmp) {
      maxAmp = amp;
    }
  }
  return maxAmp;
};
