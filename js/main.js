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
  var period = 30000;
  var radius = 200;
  // Create a couple of dummy tracks for now.
  var track1 = new MovingTrack({
    src: 'snd/Shishkabob Stems - Synths 1.mp3',
    //src: 'snd/Accapela.mp3',
    color: 0xFF0000,
    trajectory: new EllipticalTrajectory({
      period: period,
      phase: 0,
      radius: radius,
    })
  });
  var track2 = new MovingTrack({
    src: 'snd/Shishkabob Stems - FX.mp3',
    //src: 'snd/Bass.mp3',
    color: 0x0000FF,
    trajectory: new EllipticalTrajectory({
      period: period,
      phase: Math.PI/3,
      radius: radius,
    })
  });
  var track3 = new MovingTrack({
    src: 'snd/Shishkabob Stems - Synths 3.mp3',
    //src: 'snd/Beat.mp3',
    color: 0x00FF00,
    trajectory: new EllipticalTrajectory({
      period: period,
      phase: 2*Math.PI/3,
      radius: radius,
    })
  });
  var track4 = new MovingTrack({
    src: 'snd/Shishkabob Stems - Synths 2.mp3',
    //src: 'snd/Guitar.mp3',
    color: 0x00FFFF,
    trajectory: new EllipticalTrajectory({
      period: period,
      phase: 3*Math.PI/3,
      radius: radius,
    })
  });
  var track5 = new MovingTrack({
    src: 'snd/Shishkabob Stems - Vocal.mp3',
    //src: 'snd/Key.mp3',
    color: 0xFF00FF,
    trajectory: new EllipticalTrajectory({
      period: period,
      phase: 4*Math.PI/3,
      radius: radius,
    })
  });
  var track6 = new MovingTrack({
    src: 'snd/Shishkabob Stems - Percussion.mp3',
    //src: 'snd/Roll.mp3',
    color: 0xFFFF00,
    trajectory: new EllipticalTrajectory({
      period: period,
      phase: 5*Math.PI/3,
      radius: radius,
    })
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

window.addEventListener('DOMContentLoaded', main);
