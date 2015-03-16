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

function Trajectory() {
  this.type = 'invalid';
  this.referenceTime = new Date();
}

Trajectory.prototype.update = function(movingTrack, opt_timeDelta) {
  var position = this.getPosition(opt_timeDelta);
  movingTrack.position = [position.x, position.y, position.z];

  if (this.getVelocity) {
    var velocity = this.getVelocity(opt_timeDelta);
    movingTrack.velocity = [velocity.x, velocity.y, velocity.z];
  }
};

Trajectory.prototype.setReferenceTime = function(time) {
  this.referenceTime = time;
};


/**
 * The null trajectory (object is fixed in place).
 */
function FixedTrajectory(params) {
  params = params || {};
  this.type = 'fixed';
  this.position = params.position || new THREE.Vector3();
}
FixedTrajectory.prototype = new Trajectory();


FixedTrajectory.prototype.getPosition = function(opt_timeDelta) {
  return this.position;
};



/**
 * Elliptical trajectory.
 */
function EllipticalTrajectory(params) {
  this.type = 'elliptical';

  params = params || {};
  // Center of the ellipse.
  this.center = params.center || [0,0,0];
  // Rotation angle expressed as pitch and roll.
  this.pitch = params.pitch || 0;
  this.roll = params.roll || 0;
  this.yaw = params.yaw || 0;
  if (params.radius) {
    this.zAxis = params.radius;
    this.xAxis = params.radius;
  } else {
    // Major and minor axes.
    this.zAxis = params.zAxis || 10;
    this.xAxis = params.xAxis || 10;
  }
  // How long it takes to return to the same point (in ms).
  this.period = params.period || 5000;
  // Direction: 'cw' or 'ccw'.
  this.direction = params.direction || 'cw';
  this.phase = params.phase || 0;

  this.init();
}
EllipticalTrajectory.prototype = new Trajectory();

EllipticalTrajectory.prototype.init = function() {
  // Variables to reduce allocations and make calculations more efficient.
  this.position = new THREE.Vector3();
  this.velocity = new THREE.Vector3();
  this.euler = new THREE.Euler();
  this.quaternion = new THREE.Quaternion();
  this.centerVec = new THREE.Vector3(this.center[0], this.center[1], this.center[2]);
};

EllipticalTrajectory.prototype.getAngle = function(opt_timeDelta) {
  var now = new Date();
  var timeDelta = opt_timeDelta || 0;
  var elapsed = now - this.referenceTime + timeDelta;
  var relative = elapsed % this.period;
  var percent = relative / this.period;
  // Counterclockwise percentages are negative.
  if (this.direction == 'ccw') {
    percent *= -1;
  }

  // The angle on the ellipse.
  var angle = percent * Math.PI * 2 + this.phase;
  return angle;
};

/**
 * In units per second.
 */
EllipticalTrajectory.prototype.getVelocity = function(opt_timeDelta) {
  var angle = this.getAngle(opt_timeDelta);
  // Velocity is the derivative of position.
  this.velocity.set(
    -Math.sin(angle) * this.xAxis,
    0,
    Math.cos(angle) * this.zAxis
  );

  // Calculate the quaternion based on pitch and roll.
  this.euler.set(this.pitch, this.yaw, this.roll, 'XYZ');
  this.quaternion.setFromEuler(this.euler);

  // Rotate the position and velocity into 3D.
  this.velocity.applyQuaternion(this.quaternion);
  return this.velocity;
};

EllipticalTrajectory.prototype.getPosition = function(opt_timeDelta) {
  var angle = this.getAngle(opt_timeDelta);

  // Calculate the position on the 2D elliptical orbit.
  this.position.set(
    Math.cos(angle) * this.xAxis,
    0,
    Math.sin(angle) * this.zAxis
  );
  // Calculate the quaternion based on pitch and roll.
  this.euler.set(this.pitch, this.yaw, this.roll, 'XYZ');
  this.quaternion.setFromEuler(this.euler);

  // Rotate the position and velocity into 3D.
  this.position.applyQuaternion(this.quaternion);
  this.position.add(this.centerVec);

  return this.position;
};

/**
 * Object moves from one point to another on a line.
 */
function LinearTrajectory(params) {
  params = params || {};
  this.start = params.start || [0,0,0];
  this.end = params.end || [1,1,1];
  this.duration = params.duration || 5000;
  this.startTime = new Date();

  this.init();
}
LinearTrajectory.prototype = new Trajectory();

LinearTrajectory.prototype.init = function() {
  this.position = new THREE.Vector3();

  // Precompute velocity to be along the direction of movement.
  this.velocity = new THREE.Vector3();
  this.velocity.copy(this.end);
  this.velocity.sub(this.start);
  this.velocity.normalize();
};

LinearTrajectory.prototype.getPosition = function(opt_timeDelta) {
  var now = new Date();
  var timeDelta = opt_timeDelta || 0;
  var elapsed = now - this.startTime + timeDelta;
  var percent = elapsed / this.duration;

  // Linearly interpolate between start and end points.
  this.position.copy(this.start);
  this.position.lerp(this.end, percent);
  return this.position;
};

LinearTrajectory.prototype.getVelocity = function(opt_timeDelta) {
  return this.velocity;
};
