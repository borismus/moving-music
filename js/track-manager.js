function TrackManager() {
  this.tracks = {};
  this.referenceTime = new Date();
}

TrackManager.prototype.update = function() {
  for (var id in this.tracks) {
    var track = this.tracks[id];
    track.update();
  }
};

TrackManager.prototype.addTrack = function(track) {
  this.tracks[track.id] = track;
  // Get all of the tracks synchronized.
  track.trajectory.setReferenceTime(this.referenceTime);
};

TrackManager.prototype.setCameraQuaternion = function(quaternion) {
  this.cameraQuaternion = quaternion;
};

TrackManager.prototype.getCameraQuaternion = function() {
  return this.cameraQuaternion;
};
