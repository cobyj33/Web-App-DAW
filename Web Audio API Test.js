var audioContext = new AudioContext();

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
  } else {
    buffer.start(0);
  }
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