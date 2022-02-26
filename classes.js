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
      new Audio(this.sound.source).play();
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
      queue = queue.filter( note => note.tick >= this.currentTick);
      let patternLength = this.patternLength;
      let pattern = this;

      let startTime = Date.now();
      let desiredTime = 0;
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
          pattern.currentlyPlaying.push(queue[0]);
          queue[0].play();
          queue.shift();
          if (queue.length == 0) {
            break;
          }
        }
        
        let diff = (Date.now() - startTime) - desiredTime;
        console.log(diff);
        pattern.currentTick++;
        desiredTime += tickTime;
        window.setTimeout( () => playbackLoop(), (tickTime - diff));
        return;
      }
    }
  
  }