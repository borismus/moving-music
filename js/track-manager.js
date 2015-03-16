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
  this.cameraQuaternion = quaternion.clone();
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
