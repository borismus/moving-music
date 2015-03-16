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
