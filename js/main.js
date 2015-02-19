// Connect the start VR button.
function main() {
  start();
}

var video;
var audio;
//var manager;

// Enter VR mode.
function start() {
  // Full screen => we go into VR mode.
  // TODO(smus): Temporarily disabled for development.
  //document.documentElement.webkitRequestFullscreen();

  // Create the world.
  manager = new TrackManager();
  // Create a couple of dummy tracks for now.
  var track1 = new MovingTrack({
    name: 'synths1',
    //src: 'snd/Shishkabob Stems - Synths 1.mp3',
    src: 'snd/Accapela.mp3',
    color: 0xB8A795,
    trajectory: getTrajectory(0),
    inactiveTrajectory: getTrajectory(0, {inactive: true})
  });
  var track2 = new MovingTrack({
    //src: 'snd/Shishkabob Stems - FX.mp3',
    src: 'snd/Bass.mp3',
    color: 0xD97D48,
    trajectory: getTrajectory(1),
    inactiveTrajectory: getTrajectory(1, {inactive: true})
  });
  var track3 = new MovingTrack({
    //src: 'snd/Shishkabob Stems - Synths 3.mp3',
    src: 'snd/Beat.mp3',
    color: 0x77A6A0,
    trajectory: getTrajectory(2),
    inactiveTrajectory: getTrajectory(2, {inactive: true})
  });
  var track4 = new MovingTrack({
    //src: 'snd/Shishkabob Stems - Synths 2.mp3',
    src: 'snd/Guitar.mp3',
    color: 0x19414B,
    trajectory: getTrajectory(3),
    inactiveTrajectory: getTrajectory(3, {inactive: true})
  });
  var track5 = new MovingTrack({
    name: 'vocal',
    //src: 'snd/Shishkabob Stems - Vocal.mp3',
    src: 'snd/Key.mp3',
    color: 0xACF0F2,
    trajectory: getTrajectory(4),
    inactiveTrajectory: getTrajectory(4, {inactive: true})
  });
  var track6 = new MovingTrack({
    name: 'percussion',
    //src: 'snd/Shishkabob Stems - Percussion.mp3',
    src: 'snd/Roll.mp3',
    color: 0x1695A3,
    trajectory: getTrajectory(5),
    inactiveTrajectory: getTrajectory(5, {inactive: true})
  });
  manager.addTrack(track1);
  manager.addTrack(track2);
  manager.addTrack(track3);
  manager.addTrack(track4);
  manager.addTrack(track5);
  manager.addTrack(track6);

  // Create a video renderer.
  video = new VideoRenderer({selector: '#container', overview: false});
  video.setManager(manager);
  video.addLight();
  video.addSkybox();

  // Create the audio renderer.
  audio = new AudioRenderer();
  audio.setManager(manager);
  audio.on('ready', onRendererReady);

  // Show a "use headphones" dialog briefly.
  showHeadphonesDialog();
}

function onRendererReady() {
  audio.start();
  loop();
}

function loop() {
  manager.update();
  video.render();
  audio.render();

  requestAnimationFrame(loop);
}

function showHeadphonesDialog() {
  var headphones = document.querySelector('#headphones');
  headphones.style.opacity = 1;
  setTimeout(function() {
    headphones.style.opacity = 0;
  }, 3000);
}

function getTrajectory(index, params) {
  params = params || {};
  var inactive = !!params.inactive;
  var period = 30000;
  var radius = 200;
  var total = 6;
  if (inactive) {
    return new FixedTrajectory({position: new THREE.Vector3(0,-50,0)});
  }
  return new EllipticalTrajectory({
    period: period,
    phase: index/total * 2*Math.PI,
    radius: radius,
  })
}

window.addEventListener('DOMContentLoaded', main);
