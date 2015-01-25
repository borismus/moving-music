function Trajectory() {
  this.type = 'invalid';
  this.referenceTime = new Date();
}

Trajectory.prototype.update = function(movingTrack) {
  return 'Not implemented';
};

Trajectory.prototype.setReferenceTime = function(time) {
  this.referenceTime = time;
};


function FixedTrajectory(params) {
  this.type = 'fixed';
  this.position = params.position || [0,0,0];
}
FixedTrajectory.prototype = new Trajectory();

FixedTrajectory.prototype.update = function(movingTrack, timeDelta) {
  return;
};



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
  this.euler = new THREE.Euler();
  this.quaternion = new THREE.Quaternion();
  this.centerVec = new THREE.Vector3(this.center[0], this.center[1], this.center[2]);
};

EllipticalTrajectory.prototype.update = function(movingTrack) {
  var elapsed = new Date() - this.referenceTime;
  var relative = elapsed % this.period;
  var percent = relative / this.period;
  // Counterclockwise percentages are negative.
  if (this.direction == 'ccw') {
    percent *= -1;
  }

  // The angle on the ellipse.
  var angle = percent * Math.PI * 2 + this.phase;

  // Calculate the position on the 2D elliptical orbit.
  this.position.set(
    Math.cos(angle) * this.xAxis,
    0,
    Math.sin(angle) * this.zAxis
  );
  // Calculate the quaternion based on pitch and roll.
  this.euler.set(this.pitch, this.yaw, this.roll, 'XYZ');
  this.quaternion.setFromEuler(this.euler);
  // Rotate the position into 3D.
  this.position.applyQuaternion(this.quaternion);
  this.position.add(this.centerVec);

  movingTrack.position = [this.position.x, this.position.y, this.position.z];
};
