var bpm = 128;
var timeSignature = "4x4";
var currentTime = 0;

function changeCurrentTimeToText() {
  
}

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

  window.createTrack = function(notes) {
    track = {
      notes: [...notes],
      startingBeat: 0,
      currentTick: 0,
      get trackLength() {
        let max = 0;
        for (let i = 0; i < notes.length; i++) {
          if (notes[i].tick > max)
            max = notes[i].tick;
        }

        if (max % 4 != 0) {
          max += 4 - (max % 4);
        }
        return max;
      },

      playFromStart: function() {
        this.currentTick = 0;
        this.play();
      },

      play: function() {
        let tickTime = getTickSpeed();
        let queue = [...this.notes].sort((a, b) => a.tick - b.tick);
        let trackLength = this.trackLength;
        playbackLoop();

        function playbackLoop() {
          if (track.currentTick > trackLength || queue.length == 0)
            return;
          
          while (queue[0].tick == track.currentTick) {
            console.log("playing sound");
            queue[0].play();
            queue.shift();
            if (queue.length == 0) {
              break;
            }
          }
          
          track.currentTick++;
          window.setTimeout( () => playbackLoop(), tickTime);
        }
      }
    }

    return track;
  }

$(document).ready(function() {
  $("*").attr("draggable", "false");

  document.getElementById("bpm-display").value = bpm;
  document.getElementById("current-time-display").value = currentTime;

  $("#bpm-display").on('input', function() {
    if (Number($(this).val()) > 10) {
      bpm = Number($(this).val());
    }
  });

  $("#bpm-display").focusout(function() {
    console.log(bpm);
    $(this).val(bpm);
  });

  $("#current-time-display").on('input', function() {
    //TODO: implement time counter
  });

})