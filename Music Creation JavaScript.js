var bpm = 128;
var timeSignature = "4x4";
var currentTime = 0; //in Milliseconds

function changeCurrentTimeToText() {
  //format 00:00:00 minutes:seconds:milliseconds
  let newTime = currentTime
  let minutes = newTime / 1000 / 60;
  let seconds = newTime - (minutes * 1000 * 60) / 1000;
  let milliseconds = newTime - (minutes * 1000 * 60) - (seconds * 1000);

  return `${minutes}:${seconds}:${milliseconds}`;
}

window.createElementWithClasses = function(elementTag, classes) {
  const element = document.createElement(elementTag);
  classes.forEach(className => element.classList.add(className));
  return element;
}

function getBeatSpeed() {
    let beatsPerMillisecond = bpm / 60 / 1000;
    return 1 / beatsPerMillisecond;
}

function getTickSpeed() {
    return getBeatSpeed() / 4;
}

class Sound {
  constructor(name, source) {
    this.name = name;
    this.source = source;
  }
}

class Note {
  constructor(sound, tick) {
    this.sound = sound;
    this.tick = tick;
  }

  play() {
    if (this.sound.source == "")
        return;
    let currentSound = new Audio(this.sound.source);
    console.log(`Playing sound ${this.sound.name}`);
    currentSound.play();
  }
}

class Pattern {
  constructor(notes) {
    this.notes = [...notes];
    this.currentlyPlaying = [];
    this.startingBeat = 0;
    this.currentTick = 1;
    this.name = "";
    this.playing = false;
    //cannot be looped
  }

  get patternLength() {
    let max = 0;
    for (let i = 0; i < this.notes.length; i++) {
      if (this.notes[i].tick > max)
        max = this.notes[i].tick;
    }

    if (max % 4 != 0) {
      max += 4 - (max % 4);
    }
    return max;
  }

  get sounds() {
    let noteSounds = [];
    for (let i = 0; i < this.notes.length; i++) {
      let currentSound = this.notes[i].sound;
      let contains = false;
      for (let j = 0; j < noteSounds.length; j++) {
        if (_.isEqual(noteSounds[j], currentSound)) {
          contains = true;
          break;
        }
      }

      if (!contains) {
        noteSounds.push(currentSound);
      }
    }
    console.log(noteSounds.length);
    return noteSounds;
  }

  clone() {
    return new Pattern(this.notes);
  }

  playFromStart() {
    this.currentTick = 1;
    this.play();
  }

  pause() {
    this.playing = false;
    this.currentlyPlaying = [];
  }

  play() {
    this.playing = true;
    let tickTime = getTickSpeed();
    let queue = [...this.notes].sort((a, b) => a.tick - b.tick);
    let patternLength = this.patternLength;
    let pattern = this;
    playbackLoop();

    function playbackLoop() {
      pattern.currentlyPlaying = [];
      if (!pattern.playing) {
        return;
      } else if (pattern.currentTick > patternLength) {
        pattern.playing = false;
        pattern.currentTick = 1;
        return;
      } else if (queue.length < 1) {
        pattern.currentTick++;
        window.setTimeout( () => playbackLoop(), tickTime);
        return;
      }
        
      
      while (queue[0].tick == pattern.currentTick) {
        console.log("playing sound");
        pattern.currentlyPlaying.push(queue[0]);
        queue[0].play();
        queue.shift();
        if (queue.length == 0) {
          break;
        }
      }
      
      pattern.currentTick++;
      window.setTimeout( () => playbackLoop(), tickTime);
      return;
    }
  }

}



// window.createSound = function(name, source) {
//     return {
//       name: name,
//       source: source
//     }
//   }

//  window.createNote = function(soundObject, tick) {
//     note = {
//       sound: soundObject,
//       tick: tick,
//       play: function() {
//         if (this.sound.source == "")
//             return;
//         let currentSound = new Audio(this.sound.source);
//         console.log(`Playing sound ${this.sound.name}`);
//         currentSound.play();
//       }
//     }
//     return note;
//   }

//   window.createPattern = function(notes) {
//     pattern = {
//       notes: [...notes],
//       startingBeat: 0,
//       currentTick: 1,
//       get patternLength() {
//         let max = 0;
//         for (let i = 0; i < notes.length; i++) {
//           if (notes[i].tick > max)
//             max = notes[i].tick;
//         }

//         if (max % 4 != 0) {
//           max += 4 - (max % 4);
//         }
//         return max;
//       },

//       playFromStart: function() {
//         this.currentTick = 0;
//         this.play();
//       },

//       play: function() {
//         let tickTime = getTickSpeed();
//         let queue = [...this.notes].sort((a, b) => a.tick - b.tick);
//         let patternLength = this.patternLength;
//         playbackLoop();

//         function playbackLoop() {
//           if (pattern.currentTick > patternLength || queue.length == 0)
//             return;
          
//           while (queue[0].tick == pattern.currentTick) {
//             console.log("playing sound");
//             queue[0].play();
//             queue.shift();
//             if (queue.length == 0) {
//               break;
//             }
//           }
          
//           pattern.currentTick++;
//           window.setTimeout( () => playbackLoop(), tickTime);
//         }
//       }
//     }

//     return pattern;
//   }

$(document).ready(function() {
  $("*").attr("draggable", "false");

  document.getElementById("bpm-display").value = bpm;
  document.getElementById("current-time-display").value = currentTime;

  $("#bpm-display").on('input', function() {
    if (Number($(this).val()) > 10) {
      $(this).css("background", "linear-gradient(to left, black, green)");
      bpm = Number($(this).val());
    } else {
      $(this).css("background", "linear-gradient(to left, black, red)");
    }
  });

  $("#bpm-display").focusout(function() {
    console.log(bpm);
    $(this).val(bpm);
    $(this).css("background", "linear-gradient(to left, black, green)");
  });

  $("#current-time-display").on('input', function() {
    //TODO: implement time counter
  });

  $(".window").on('mouseenter', function() {
    $(this).css("z-index", "1000");
  });

  let zIndex = 0;

  $(".window").on('mouseleave', function() {
    $(this).css("z-index", String(zIndex++));
    if (zIndex > 1000) {
      zIndex = 0;
      $(".window").css("z-index", "0");
      $(this).css("z-index", String(zIndex++));
    }
  });


})