var audioContext = new AudioContext();
var scheduledBuffers = [];

window.createBuffer = function(path) {
  let source = audioContext.createBufferSource();
  let request = new Request(path);

  fetch(request)
  .then(data => { return data.arrayBuffer() })
  .then(buffer => {
    audioContext.decodeAudioData(buffer, function(decodedData) {
      source.buffer = decodedData;
      source.connect(audioContext.destination);
    }, function(error) {
      console.log(error);
    })
  });

  return source;
}

window.playSound = function(buffer, time) {
  if (time) {
    buffer.start(time);
    scheduledBuffers.push(buffer);
    let timeToPlay = time - audioContext.currentTime;
    setTimeout(() => {
      console.log("attempting to remove " + buffer);
      scheduledBuffers = scheduledBuffers.filter(currentBuffer => {return currentBuffer != buffer});
    } ,timeToPlay * 1000);
  } else {
    buffer.start(0);
  }
}

window.stopPlayback = function() {
  scheduledBuffers.forEach(buffer => {
    buffer.stop();
  });
  scheduledBuffers = [];
}

// class BufferSound {
//   constructor(name, buffer) {
//     this.name = name;
//     this.buffer = buffer;
//   }
// }

// let kick = createBuffer("Sounds/kick.mp3", "Kick");
// savedBuffers.addBuffer(kick);

// window.addEventListener('keydown', function() {
//   playSound(kick.buffer);
// });