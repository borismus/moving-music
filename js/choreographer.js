function Choreographer() {
  this.manager = new TrackManager();
  this.mode_ = -1;
  this.callbacks_ = {};

  this.init();
}

Choreographer.Modes = {
  CLUSTERED: 0,
  SURROUND: 1,
  MOVING: 2
};
Choreographer.TOTAL_MODE_COUNT = 3;

Choreographer.prototype.init = function() {
  var vocal = new MovingTrack({
    name: 'synths1',
    src: 'snd/Accapela.mp3',
    srcFormat: this.getFormat('Accapela'),
    color: 0xB8A795,
  });
  var bass = new MovingTrack({
    src: 'snd/Bass.mp3',
    srcFormat: this.getFormat('Bass'),
    color: 0xD97D48,
  });
  var beat = new MovingTrack({
    src: 'snd/Beat.mp3',
    srcFormat: this.getFormat('Beat'),
    color: 0x77A6A0,
  });
  var guitar = new MovingTrack({
    src: 'snd/Guitar.mp3',
    srcFormat: this.getFormat('Guitar'),
    color: 0x19414B,
  });
  var keys = new MovingTrack({
    src: 'snd/Key.mp3',
    srcFormat: this.getFormat('Key'),
    color: 0xACF0F2,
  });
  var percussion = new MovingTrack({
    name: 'percussion',
    srcFormat: this.getFormat('Roll'),
    src: 'snd/Roll.mp3',
    color: 0x1695A3,
  });
  this.manager.addTrack(percussion); // Don't do much -- keep on periphery.
  this.manager.addTrack(bass);
  this.manager.addTrack(beat);
  this.manager.addTrack(vocal);
  this.manager.addTrack(guitar);
  this.manager.addTrack(keys); // Don't do much -- keep on periphery.

  this.setMode(Choreographer.Modes.CLUSTERED);
}

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
};

Choreographer.prototype.getFormat = function(name) {
  return 'snd/chunks/' + name + '/' + name + '-{{index}}.mp3';
};


/**
 * Creates fixed position trajectories clustered around a point.
 */
Choreographer.prototype.createClusteredTrajectory_ = function(index) {
  var clusterPoint = new THREE.Vector3(0, 0, -200);
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
  var radius = 200;
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
  var radius = 200;
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
