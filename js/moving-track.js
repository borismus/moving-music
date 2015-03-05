function MovingTrack(params) {
  this.src = params.src || null;
  this.srcFormat = params.srcFormat || null;
  this.position = params.position || [0,0,0];
  this.velocity = params.velocity || [0,0,0];
  this.trajectory = params.trajectory || new FixedTrajectory();
  this.color = params.color || 0x00FF00;
  this.name = params.name || null;
  // Generate a UUID so that the track can be uniquely identified.
  this.id = Util.generateUUID();

  // The current amplitude of the track.
  this.amplitude = 0;
  // Whether or not the track is currently in the field of view.
  this.inFov = false;

}

MovingTrack.prototype.update = function() {
  this.trajectory.update(this);
};

MovingTrack.prototype.setAmplitude = function(amp) {
  // Do a moving average on the radius.
  var alpha = 0.3;
  this.amplitude = alpha * amp + (1-alpha) * this.amplitude;
};

MovingTrack.prototype.changeTrajectory = function(newTrajectory, transitionTime) {
  if (this.trajectoryTimer) {
    clearTimeout(this.trajectoryTimer);
  }
  newTrajectory.setReferenceTime(this.trajectory.referenceTime);
  // Place this object on a connecting trajectory.
  var tempTrajectory = new LinearTrajectory({
    start: this.trajectory.getPosition(),
    end: newTrajectory.getPosition(transitionTime),
    duration: transitionTime
  });
  this.trajectory = tempTrajectory;
  // After some time, place the object on the new trajectory.
  this.trajectoryTimer = setTimeout(function() {
    this.trajectory = newTrajectory;
  }.bind(this), transitionTime);
};
