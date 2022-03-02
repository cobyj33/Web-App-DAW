var bpm = 128;
var timeSignature = "4x4";
var selectedPattern = undefined;
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
    $(this).val(bpm);
    $(this).css("background", "linear-gradient(to left, black, green)");
  });

  $("#current-time-display").on('input', function() {
    //TODO: implement time counter
  });

  $(".window").on('mouseenter', function() {
    $(this).css("z-index", "1000");
  });

  let zIndex = 100;

  $(".window").on('mouseleave', function() {
    $(this).css("z-index", String(zIndex++));
    if (zIndex > 1000) {
      zIndex = 100;
      $(".window").css("z-index", "0");
      $(this).css("z-index", String(zIndex++));
    }
  });


})