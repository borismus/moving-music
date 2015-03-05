function TrackManager() {
  this.tracks = {};
  this.referenceTime = new Date();
  this.trackCount = 0;
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
  this.trackCount += 1;
};

TrackManager.prototype.setCameraQuaternion = function(quaternion) {
  this.cameraQuaternion = quaternion;
};

TrackManager.prototype.getCameraQuaternion = function() {
  return this.cameraQuaternion;
};

TrackManager.prototype.getTrackByName = function(name) {
  for (var id in this.tracks) {
    var track = this.tracks[id];
    if (track.name == name) {
      return track
    }
  }
  return null;
};
