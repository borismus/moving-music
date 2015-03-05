Util = {};

Util.generateUUID = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

Util.randomQuaternion = function() {
  // Generate random euler angles.
  var roll = Math.random() * Math.PI*2;
  var pitch = Math.random() * Math.PI*2;
  var yaw = Math.random() * Math.PI*2;

  var euler = new THREE.Euler(roll, pitch, yaw, 'XYZ');
  var quaternion = new THREE.Quaternion();
  quaternion.setFromEuler(euler);
  return quaternion;
};

Util.randomBetween = function(min, max) {
  return Math.random() * (max - min) + min;
};

Util.loadTrackSrc = function(context, src, callback, opt_progressCallback) {
  var request = new XMLHttpRequest();
  request.open('GET', src, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously.
  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      callback(buffer);
    }, function(e) {
      console.error(e);
    });
  };
  if (opt_progressCallback) {
    request.onprogress = function(e) {
      var percent = e.loaded / e.total;
      opt_progressCallback(percent);
    };
  }

  request.send();
};

