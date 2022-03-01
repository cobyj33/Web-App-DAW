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
  
    play(time) {
      if (this.sound.source == "")
          return;
      let buffer = window.createBuffer(this.sound.source, this.sound.name);
      if (time) {
        window.playSound(buffer, time);
      } else {
        window.playSound(buffer);
      }
    }

    clone() {
      return new Note(this.sound, this.tick);
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
      let clonedNotes = [];
      this.notes.forEach(note => clonedNotes.push(note.clone()));
      return new Pattern(clonedNotes);
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
      let pattern = this;
      let startTime = audioContext.currentTime;

      queue.forEach(note => {
        note.play(startTime + (note.tick * tickTime / 1000));
      });

      let updateCurrentlyPlaying = function() {
        let startTime = Date.now();
        let desiredTime = 0;

        function update() {
          if (pattern.playing) {
            pattern.currentTick++;
            pattern.currentlyPlaying = queue.filter(note => note.tick == pattern.currentTick);
            let diff = (Date.now() - startTime) - desiredTime;
            console.log(diff);
            desiredTime += tickTime;
            setTimeout(() => update(), tickTime - diff);
          }
        };
        update();

      }();

      setTimeout(() => {
          pattern.playing = false;
          pattern.currentTick = 1;
      }, queue[queue.length - 1].tick * tickTime);
    }

    // play() {
    //   this.playing = true;
    //   let tickTime = getTickSpeed();
    //   let queue = [...this.notes].sort((a, b) => a.tick - b.tick);
    //   queue = queue.filter( note => note.tick >= this.currentTick);
    //   let pattern = this;
    //   let startTime = Date.now();

    //   queue.forEach(note => {
    //     setTimeout(() => {
    //       note.play();
    //       let diff = (Date.now() - startTime) - (note.tick * tickTime);
    //       console.log(`inaccuracy: ${diff}`);
    //     }, note.tick * tickTime);
    //   });

    //   setTimeout(() => { pattern.playing = false; pattern.currentTick = 1; }, queue[queue.length - 1].tick * tickTime);
    // }
  
  }




/*
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
      let queueLocation = 0;

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
        } else if (queueLocation >= queue.length) {
          pattern.currentTick++;
          window.setTimeout( () => playbackLoop(), tickTime);
          return;
        }
          
        
        while (queue[queueLocation].tick == pattern.currentTick) {
          pattern.currentlyPlaying.push(queue[queueLocation]);
          queue[queueLocation].play();
          queueLocation++;
          if (queueLocation >= queue.length) {
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
  */