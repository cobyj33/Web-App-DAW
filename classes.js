
class Sound {
    constructor(name, source, defaultFrequency) {
      this.name = name;
      this.source = source;
      this.defaultFrequency = defaultFrequency ? defaultFrequency : "C4";
    }
  }
  
  class Note {
    //sound and tick are required, length and freq are optional
    constructor({sound, tick, length, freq, velocity, sample}) {
      this.sound = sound;
      this.tick = tick;
      this.length = length ? length : 1;
      this.freq = freq ? freq : this.sound.defaultFrequency;
      this.velocity = velocity ? velocity : 1;
      this.sample = sample ? sample : this.createSample().toDestination();
    }

    createSample() {
      let urls = {};
      urls[this.sound.defaultFrequency] = this.sound.source;
      const sample = new Tone.Sampler({urls});
      return sample;
    }

    get timeInSeconds() {
      return ticksToSeconds(this.tick - 1);
    }

    get endInSeconds() {
      return this.timeInSeconds + this.lengthInSeconds;
    }

    get lengthInSeconds() {
      return ticksToSeconds(this.length);
    }

    playNote() {
      if (this.sample.loaded) {
        this.sample.triggerAttackRelease(this.freq, this.lengthInSeconds);
      }
    }

    playImmediately() {
      let urls = {};
      urls[this.sound.defaultFrequency] = this.sound.source;
      const sample = new Tone.Sampler({urls, onload: () => {
        console.log('sample loaded');
        sample.triggerAttackRelease(this.freq, this.lengthInSeconds);
      }}).toDestination();
    }

    clone() {
      return new Note(this);
    }

    overlaps(note) {
      if (note.freq == this.freq && ((this.tick <= note.tick && this.tick + this.length > note.tick) || (note.tick <= this.tick && note.tick + note.length > this.tick))) {
        return true;
      }
      return false;
    }

    static equals(note, note2) {
      const {sound, tick, length, freq, velocity} = note;
      const {sound: sound2, tick: tick2, length: length2, freq: freq2, velocity: velocity2} = note2;
      if (sound.source == sound2.source && tick == tick2 && length == length2 && freq == freq2 && velocity == velocity2) {
        console.log('EQUALS');
        return true;
      }
      console.log('not equals');
      return false;
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

    get standardLength() {
      let max = 0;
      for (let i = 0; i < this.notes.length; i++) {
        if (this.notes[i].tick > max)
          max = this.notes[i].tick;
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
      return noteSounds;
    }
  
    clone() {
      let clonedNotes = [];
      this.notes.forEach(note => clonedNotes.push(note.clone()));
      let newPattern = new Pattern(clonedNotes);
      newPattern.name = this.name;
      return newPattern;
    }
  
    playFromStart() {
      this.currentTick = 1;
      this.play();
    }
  
    pause() {
      this.playing = false;
      this.currentlyPlaying = [];
      Tone.Transport.pause();
    }
  
    play() {
      this.playing = true;
      Tone.Transport.cancel();
      let tickTime = getTickSpeed();
      let queue = [...this.notes].sort((a, b) => a.tick - b.tick);
      queue = queue.filter( note => note.tick >= this.currentTick);
      let pattern = this;

      let noteInfo = [];
        queue.forEach(note => {
          noteInfo.push({
            time: note.timeInSeconds + Tone.Transport.seconds,
            note: note
          })
        });

        const track = new Tone.Part(function(time, values) {
          values.note.playNote();
          if (queue.length != 0) {
            queue.shift();
          }
        }, noteInfo).start(0);
        Tone.Transport.scheduleRepeat(function(time){
          pattern.currentTick++;
          pattern.currentlyPlaying = queue.filter(note => note.tick == pattern.currentTick);
        }, tickTime / 1000);
        Tone.Transport.start("+0", "0:0:0");

      setTimeout(() => {
          pattern.playing = false;
          pattern.currentTick = 1;
          Tone.Transport.stop();
          Tone.Transport.cancel();
      }, queue[queue.length - 1].tick * tickTime);
    }
  
  }