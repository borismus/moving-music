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

function Choreographer(opt_params) {
  var params = opt_params || {};
  var set = params.set || 'speech';
  var mode = params.mode || Choreographer.Modes.CLUSTERED;
  mode = parseInt(mode);

  this.manager = new TrackManager();
  this.dwellDetector = new DwellDetector();

  this.mode_ = -1;
  this.callbacks_ = {};

  if (set == 'speech') {
    this.initVocal();
  } else if (set == 'phoenix') {
    this.initPhoenix();
  } else if (set == 'jazz') {
    this.initJazz();
  }

  this.setMode(mode);
}

Choreographer.Modes = {
  CLUSTERED: 0,
  SURROUND: 1,
  MOVING: 2
};
Choreographer.TOTAL_MODE_COUNT = 3;

Choreographer.prototype.initPhoenix = function() {
  var set = 'phoenix';
  var vocal = new MovingTrack({
    name: 'vocal',
    src: this.getAudioFile(set, 'Accapela'),
    color: 0xB8A795,
  });
  var bass = new MovingTrack({
    src: this.getAudioFile(set, 'Bass'),
    color: 0xD97D48,
  });
  var beat = new MovingTrack({
    src: this.getAudioFile(set, 'Beat'),
    color: 0x77A6A0,
  });
  var guitar = new MovingTrack({
    src: this.getAudioFile(set, 'Guitar'),
    color: 0x19414B,
  });
  var keys = new MovingTrack({
    src: this.getAudioFile(set, 'Key'),
    color: 0xACF0F2,
  });
  var percussion = new MovingTrack({
    src: this.getAudioFile(set, 'Roll'),
    color: 0x1695A3,
  });
  this.manager.addTrack(percussion); // Don't do much -- keep on periphery.
  this.manager.addTrack(bass);
  this.manager.addTrack(beat);
  this.manager.addTrack(vocal);
  this.manager.addTrack(guitar);
  this.manager.addTrack(keys); // Don't do much -- keep on periphery.
}

Choreographer.prototype.initVocal = function() {
  var set = 'voice';
  var cats = new MovingTrack({
    src: this.getAudioFile(set, 'Cats'),
    color: 0xB8A795,
  });
  var nimoy = new MovingTrack({
    src: this.getAudioFile(set, 'Nimoy'),
    color: 0xD97D48,
  });
  var roth = new MovingTrack({
    src: this.getAudioFile(set, 'Roth'),
    color: 0x77A6A0,
  });
  var russian = new MovingTrack({
    src: this.getAudioFile(set, 'Russian'),
    color: 0x19414B,
  });

  this.manager.addTrack(cats);
  this.manager.addTrack(nimoy);
  this.manager.addTrack(roth);
  this.manager.addTrack(russian);
};

Choreographer.prototype.initJazz = function() {
  var set = 'jazz';
  var bass = new MovingTrack({
    src: this.getAudioFile(set, 'bass'),
    color: 0xB8A795,
  });
  var piano = new MovingTrack({
    src: this.getAudioFile(set, 'piano'),
    color: 0xD97D48,
  });
  var snare = new MovingTrack({
    src: this.getAudioFile(set, 'snare'),
    color: 0x77A6A0,
  });

  this.manager.addTrack(bass);
  this.manager.addTrack(piano);
  this.manager.addTrack(snare);
};

Choreographer.prototype.getAudioFile = function(set, basename) {
  var extension = Util.isMp3Supported() ? 'mp3' : 'ogg';
  return 'snd/' + set + '/' + basename + '.' + extension;
};

Choreographer.prototype.update = function() {
  this.dwellDetector.updateCameraQuaternion(this.manager.getCameraQuaternion());

  // If we're dwelling (no motion) on something, tell instructions.
  if (this.dwellDetector.isDwelling() && this.shouldShowActionReminder_()) {
    var message = Util.isMobile() ? 'try tapping' : 'try the space key';
    // TODO(smus): This breaks encapsulation of VideoRenderer. Fix!
    video.toast(message);
    this.lastActionReminderTime = new Date();
  }
};

/**
 * Set the current mode of the musical playback: CLUSTERED, SURROUND or MOVING.
 */
Choreographer.prototype.setMode = function(mode, opt_delay) {
  this.mode_ = mode;
  var delay = opt_delay || 0;

  var index = 0;
  // Go through each track, setting the trajectory to the appropriate mode
  for (var trackId in this.manager.tracks) {
    var track = this.manager.tracks[trackId];
    var trajectory = this.createTrajectoryForMode_(mode, index);
    track.changeTrajectory(trajectory, delay);
    index += 1;
  }

  // Notify others that the mode changed.
  this.fire_(this.callbacks_.modechanged, this.mode_);
};

Choreographer.prototype.on = function(eventName, callback) {
  this.callbacks_[eventName] = callback;
};

Choreographer.prototype.setNextMode = function() {
  var newMode = this.mode_ + 1;
  this.setMode(newMode % Choreographer.TOTAL_MODE_COUNT, 3000);

  this.didUserChangeMode = true;
};

Choreographer.prototype.onStarted = function() {
  this.startTime = new Date();
};


/**
 * Creates fixed position trajectories clustered around a point.
 */
Choreographer.prototype.createClusteredTrajectory_ = function(index) {
  var clusterPoint = new THREE.Vector3(0, 0, -5);
  var angleRange = Math.PI/3;

  var percent = index / (this.manager.trackCount - 1);
  var minAngle = -angleRange/2;
  var maxAngle = angleRange/2;
  var angle = minAngle + (angleRange * percent);
  clusterPoint.applyEuler(new THREE.Euler(0, angle, 0));

  return new FixedTrajectory({position: clusterPoint});
};

/**
 * Creates fixed position trajectories that surround the viewer.
 */
Choreographer.prototype.createSurroundTrajectory_ = function(index) {
  var radius = 5;
  var phase = 0;
  var percent = index / this.manager.trackCount;
  // Generate a position around the viewer.
  var x = radius * Math.cos(percent * 2*Math.PI + phase);
  var z = radius * Math.sin(percent * 2*Math.PI + phase);
  return new FixedTrajectory({position: new THREE.Vector3(x, 0, z)});
};

/**
 * Creates a moving trajectory all around the viewer.
 */
Choreographer.prototype.createMovingTrajectory_ = function(index) {
  var percent = index / this.manager.trackCount;
  var period = 30000;
  var radius = 5;
  return new EllipticalTrajectory({
    period: period,
    phase: percent * 2*Math.PI - Math.PI,
    radius: radius,
  });
};

Choreographer.prototype.createTrajectoryForMode_ = function(mode, index) {
  switch (mode) {
    case Choreographer.Modes.CLUSTERED:
      return this.createClusteredTrajectory_(index);
    case Choreographer.Modes.SURROUND:
      return this.createSurroundTrajectory_(index);
    case Choreographer.Modes.MOVING:
      return this.createMovingTrajectory_(index);
  }
  return null;
};

Choreographer.prototype.fire_ = function(callback) {
  if (!callback) {
    console.log('No valid callback specified.');
    return;
  }
  var args = [].slice.call(arguments)
  // Eliminate the first param (the callback).
  args.shift();
  callback.apply(this, args);
};

Choreographer.prototype.shouldShowActionReminder_ = function() {
  // Never show the change reminder if the user already changed modes.
  if (this.didUserChangeMode) {
    return false;
  }
  var now = new Date();
  if (!this.lastActionReminderTime) {
    // Don't show it too soon into the session (wait 20s).
    var timeSinceStart = now - this.startTime;
    return timeSinceStart > 10000;
  }
  var timeSinceReminder = now - this.lastActionReminderTime;
  // Wait at least 30s between reminders.
  return timeSinceReminder > 20000;
};

