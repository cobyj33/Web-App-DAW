// Tone.context.resume()
Tone.Transport.bpm.value = 128;
var selectedPattern = undefined;
var loadedSounds = {
  get sounds() {
    return Object.keys(this).map(key => this[key]);
  }
};

window.loadSound = function(soundObj) {
  loadedSounds[`${soundObj.name}`] = soundObj;
}

loadSound(new Sound("Kick", "Sounds/kick.mp3"));
loadSound(new Sound("Clap", "Sounds/clap.mp3"));
loadSound(new Sound("Snare", "Sounds/snare.mp3"));
loadSound(new Sound("HiHat", "Sounds/hihat.mp3"));

// var loadedSounds = [];

window.createElementWithClasses = function(elementTag, classes) {
  const element = document.createElement(elementTag);
  classes.forEach(className => element.classList.add(className));
  return element;
}

function getBeatSpeed() {
    let beatsPerMillisecond = Tone.Transport.bpm.value / 60 / 1000;
    return 1 / beatsPerMillisecond;
}

function getTickSpeed() {
  return getBeatSpeed() / 4;
}

function ticksToSeconds(tick) {
  return tick * getTickSpeed() / 1000;
}

function secondsToTicks(seconds) {
  return seconds * 1000 / getTickSpeed();
}

window.getSample = function(url, defaultNote) {
  let note = 'C4';
  if (defaultNote) {
      note = defaultNote;
  }
  console.log(note);
  urls = {}
  urls[`${note}`] = url;

  return new Tone.Sampler({urls});
};

$(document).on('ready', function() {
  $("*").attr("draggable", "false");

  document.getElementById("bpm-display").value = Tone.Transport.bpm.value;
  document.getElementById("current-time-display").value = 0;

  $("#bpm-display").on('input', function() {
    if (Number($(this).val()) > 10) {
      $(this).css("background", "linear-gradient(to left, black, green)");
      Tone.Transport.bpm.value = Number($(this).val());
    } else {
      $(this).css("background", "linear-gradient(to left, black, red)");
    }
  });

  $("#bpm-display").on('focusout', function() {
    $(this).val(Tone.Transport.bpm.value);
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