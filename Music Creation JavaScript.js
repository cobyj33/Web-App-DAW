var bpm = 128;
var timeSignature = "4x4";
var currentTime = 0;

function getBeatSpeed() {
    let beatsPerMillisecond = bpm / 60 / 1000;
    return 1 / beatsPerMillisecond;
}

function getTickSpeed() {
    return getBeatSpeed() / 4;
}

window.createSound = function(name, source) {
    return {
      name: name,
      source: source
    }
  }

 window.createNote = function(soundObject, tick) {
    note = {
      sound: soundObject,
      tick: tick,
      play: function() {
        if (this.sound.source == "")
            return;
        let currentSound = new Audio(this.sound.source);
        console.log(`Playing sound ${this.sound.name}`);
        currentSound.play();
      }
    }
    return note;
  }