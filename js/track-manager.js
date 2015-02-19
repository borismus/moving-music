function TrackManager() {
  this.tracks = {};
  this.referenceTime = new Date();
}

TrackManager.prototype.update = function() {
  for (var id in this.tracks) {
    var track = this.tracks[id];
    track.update();

    if (track.isActivationNeeded()) {
      console.log('[ACTIVATE] Track %s active', track.src);
      track.activate();
    }

    if (track.isDeactivationNeeded()) {
      console.log('[DEACTIVATE] Track %s inactive', track.src);
      track.deactivate();
    }
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

TrackManager.prototype.getTrackByName = function(name) {
  for (var id in this.tracks) {
    var track = this.tracks[id];
    if (track.name == name) {
      return track
    }
  }
  return null;
};
