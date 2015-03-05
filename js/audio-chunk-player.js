/**
 * An attempt to work around crbug.com/419446 by splitting each track into multiple
 * chunks, and loading a bunch of it together. This doesn't work right: we need to have
 * much smarter cross-synchronization, etc.
 */
function AudioChunkPlayer(context, opt_params) {
  this.context = context;

  var params = opt_params || {};
  this.urlFormat = params.urlFormat || 'snd/chunks/Beat/Beat-{{index}}.mp3';

  // TODO: these should be extracted from a metadata file.
  this.totalFiles = params.totalFiles || 9;
  this.bufferDuration = params.bufferDuration || 20;

  // To allow a custom destination buffer.
  this.destination = params.destination || context.destination;

  this.loadingProgress_ = 0;
  // Data structure to keep the audio buffers.
  this.buffers = {};
  // Keep track of which buffers have been scheduled to play.
  this.sources = {};
  this.callbacks_ = {};
}
AudioChunkPlayer.VALID_EVENTS = ['loaded', 'progress'];

AudioChunkPlayer.prototype.connect = function(node) {
  for (var id in this.sources) {
    var source = this.sources[id];
    source.connect(node);
  }
}

/**
 * Starts loading a series of mp3 files.
 */
AudioChunkPlayer.prototype.load = function() {
  this.loadChunkIndex_(0);
};

AudioChunkPlayer.prototype.play = function() {
  if (!this.isReady()) {
    console.error('Not ready to play yet.');
    return;
  }
  this.playStartTime = this.context.currentTime;
  // Setup a timer that will continuously check for new buffers that are
  // loaded but not yet scheduled.
  setInterval(this.schedulePlayingNewBuffers_.bind(this), 1000);
};

AudioChunkPlayer.prototype.isReady = function() {
  return this.loadingProgress_ > 0.1;
};

AudioChunkPlayer.prototype.on = function(eventName, callback) {
  if (AudioChunkPlayer.VALID_EVENTS.indexOf(eventName) == -1) {
    console.error('Invalid event %s', eventName);
    return;
  }
  this.callbacks_[eventName] = callback;
};



/*************
 *
 * PRIVATE
 *
 *************/

AudioChunkPlayer.prototype.fire_ = function(callback) {
  if (!callback) {
    console.log('No valid callback specified.');
    return;
  }
  var args = [].slice.call(arguments)
  // Eliminate the first param (the callback).
  args.shift();
  callback.apply(this, args);
};

AudioChunkPlayer.prototype.loadChunkIndex_ = function(index) {
  this.loadingIndex = index;
  var url = this.urlFormat.replace('{{index}}', index);
  Util.loadTrackSrc(this.context, url, this.onChunkLoaded_.bind(this));
};

AudioChunkPlayer.prototype.onChunkLoaded_ = function(buffer) {
  // Assign the chunk to the right place.
  this.buffers[this.loadingIndex] = buffer;

  // Update progress.
  this.loadingProgress_ = this.loadingIndex / (this.totalFiles - 1);
  this.fire_(this.callbacks_.progress, this.loadingProgress_);

  // Queue loading the next chunk, if there are any left over.
  if (this.loadingIndex < this.totalFiles - 1) {
    this.loadChunkIndex_(this.loadingIndex + 1);
  } else {
  this.fire_(this.callbacks_.loaded);
  }
};

AudioChunkPlayer.prototype.schedulePlayingNewBuffers_ = function() {
  // For each buffer that is not scheduled to play, create an AudioBufferSourceNode
  // and schedule it at the right time.
  for (var id in this.buffers) {
    var index = parseInt(id);
    // If we already have a source node for this buffer, ignore.
    if (index in this.sources) {
      continue;
    }
    console.log('Scheduling new buffer: %d', index);

    // Otherwise, create a new source node.
    var buffer = this.buffers[index];
    var source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = false;
    source.connect(this.destination);

    // And schedule it to play at the right time.
    var time = this.playStartTime + index*this.bufferDuration;
    source.start(time);

    // Save the source for later (and to indicate that we're already playing it).
    this.sources[index] = source;
  }
};
