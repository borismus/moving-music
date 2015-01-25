function MovingTrack(params) {
  this.src = params.src || null;
  this.position = params.position || [0,0,0];
  this.velocity = params.velocity || [0,0,0];
  this.trajectory = params.trajectory || new FixedTrajectory();
  this.color = params.color || 0x00FF00;
  // Generate a UUID so that the track can be uniquely identified.
  this.id = Util.generateUUID();

  // Track the amplitude of the track.
  this.amplitude = 0;
}

MovingTrack.prototype.update = function() {
  this.trajectory.update(this);
};

MovingTrack.prototype.setAmplitude = function(amp) {
  // Do a moving average on the radius.
  var alpha = 0.3;
  this.amplitude = alpha * amp + (1-alpha) * this.amplitude;
};
