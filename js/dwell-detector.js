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

var DWELL_TIME = 10000;
var DWELL_THRESHOLD = 1;

function DwellDetector() {
  this.motionHistory = [];
}

DwellDetector.prototype.isDwelling = function() {
  // Calculate the total motion history over a period of time.
  var sum = 0;
  var now = new Date();
  for (var i = this.motionHistory.length - 1; i >= 0; i--) {
    var angleDate = this.motionHistory[i];
    var elapsed = now - angleDate.date;
    if (elapsed < DWELL_TIME) {
      sum += angleDate.angle;
    }
  }

  return sum < DWELL_THRESHOLD;
};

DwellDetector.prototype.updateCameraQuaternion = function(newQuaternion) {
  var oldQuaternion = this.oldQuaternion;
  if (!oldQuaternion) {
    this.oldQuaternion = new THREE.Quaternion();
    return;
  }

  // Apply both of these quaternions to a unit vector, calculate the angular
  // distance between them.
  if (!this.vec1) {
    this.vec1 = new THREE.Vector3();
    this.vec2 = new THREE.Vector3();
  }
  this.vec1.set(0, 0, -1);
  this.vec2.set(0, 0, -1);
  this.vec1.applyQuaternion(oldQuaternion);
  this.vec2.applyQuaternion(newQuaternion);

  // Calculate angular distance.
  var angleDelta = this.vec1.angleTo(this.vec2);
  if (angleDelta == 0) {
    return;
  }

  // Save angular distance to the array.
  this.motionHistory.push(new AngleDate(angleDelta));
  // If the motion history is too long, pop it off the top.
  if (this.motionHistory.length > 100) {
    this.motionHistory.splice(0, 1);
  }

  this.oldQuaternion.copy(newQuaternion);
};

function AngleDate(angle) {
  this.angle = angle;
  this.date = new Date();
};
