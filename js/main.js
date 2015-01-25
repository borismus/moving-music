// Connect the start VR button.
document.querySelector('#start').addEventListener('click', start);

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
    src: 'snd/Shishkabob Stems - Synths 1.mp3',
    color: 0xFF0000,
    trajectory: new EllipticalTrajectory({
      xAxis: 100,
      zAxis: 200,
      center: [0,20,-100],
      period: 10000,
      pitch: Math.PI/16,
    })
  });
  var track2 = new MovingTrack({
    src: 'snd/Shishkabob Stems - FX.mp3',
    color: 0x0000FF,
    trajectory: new EllipticalTrajectory({
      center: [0,0,-100],
      radius: 200,
      period: 15000,
      phase: Math.PI
    })
  });
  var track3 = new MovingTrack({
    src: 'snd/Shishkabob Stems - Synths 3.mp3',
    color: 0x00FF00,
    trajectory: new EllipticalTrajectory({
      center: [0,-50,-100],
      radius: 300,
      period: 12000,
      direction: 'ccw',
      roll: Math.PI/16,
      phase: Math.PI/2
    })
  });
  var track4 = new MovingTrack({
    src: 'snd/Shishkabob Stems - Synths 2.mp3',
    color: 0x00FFFF,
    trajectory: new EllipticalTrajectory({
      center: [0,50,-100],
      radius: 100,
      period: 20000,
      pitch: -Math.PI/24,
      direction: 'ccw',
      phase: 3*Math.PI/2
    })
  });
  var track5 = new MovingTrack({
    src: 'snd/Shishkabob Stems - Vocal.mp3',
    color: 0xFF00FF,
    trajectory: new EllipticalTrajectory({
      center: [0,0,-100],
      radius: 150,
      period: 15000,
      phase: Math.PI
    })
  });
  var track5 = new MovingTrack({
    src: 'snd/Shishkabob Stems - Vocal.mp3',
    color: 0xFF00FF,
    trajectory: new EllipticalTrajectory({
      center: [0,0,-100],
      radius: 150,
      period: 8000,
    })
  });
  manager.addTrack(track1);
  manager.addTrack(track2);
  manager.addTrack(track3);
  manager.addTrack(track4);
  manager.addTrack(track5);

  // Create a video renderer.
  video = new VideoRenderer({selector: '#container', overview: false});
  video.setManager(manager);
  video.addLight();
  video.addSkybox();

  // Create the audio renderer.
  audio = new AudioRenderer();
  audio.setManager(manager);
  audio.on('ready', onRendererReady);
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

window.addEventListener('DOMContentLoaded', main);
