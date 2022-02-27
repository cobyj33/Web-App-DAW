let selectedAreas = [];

function createArea(row, col, width) {
    return {
        row: row,
        col: col,
        width: width,

        overlaps: function(area) {
            if (area.row != this.row) {
                return false;
            }

            if (area.col + area.width > this.col && area.col < this.col) {
                return true;
            } else if (area.col < this.col + this.width && area.col > this.col) {
                return true;
            }
            return false;
        }
    };
}

playlist = {
        patterns: [],
        currentlyPlaying: [],
        currentTick: 1,
        playing: false,
        looped: false,
        metronomePlaying: false,

        get length() {
            let patternLengths = [];
            this.patterns.forEach(pattern => patternLengths.push(pattern.patternLength));
            return Math.max(...patternLengths);
        },

        addPattern: function(pattern, startingTick) {
            let patternNotes = [...pattern.notes];
            patternNotes = patternNotes.map(note => { return new Note(note.sound, note.tick + startingTick)});
            console.log(patternNotes);
            this.patterns.push(new Pattern(patternNotes));
        },

        removePattern: function(input) {
            if (typeof input == 'number') {
                this.patterns.splice(input, 1);
            } else {
                for (let i = 0; i < this.patterns.length; i++) {
                    if (_.isEqual(this.patterns[i], input)) {
                        this.patterns.splice(i, 1);
                        break;
                    }
                }
            }
        },

        isAreaSelected: function(area) {
            for (let i = 0; i < selectedAreas.length; i++) {
                if (area.overlaps(selectedAreas[i])) {
                    return true;
                }
            }
            return false;
        },

        play: function() {
            if (this.playing) {
                return;
            }
            this.playing = true;
            let startTime = Date.now();
            let tickTime = getTickSpeed();
            let playlistLength = this.length;
            let desiredTime = 0;
            let queue = this.createQueue();
            console.log(queue);
            let playlist = this;
            playbackLoop();

            function playbackLoop() {
                playlist.currentlyPlaying = [];
                console.log(`tick: ${playlist.currentTick} length ${playlistLength}`);
                if (!playlist.playing) {
                  return;
                } else if (playlist.currentTick > playlistLength) {
                  playlist.playing = false;
                  playlist.currentTick = 1;
                  return;
                } else if (queue.length < 1) {
                  playlist.currentTick++;
                  window.setTimeout( () => playbackLoop(), tickTime);
                  return;
                }
                  
                
                while (queue[0].tick == playlist.currentTick) {
                  playlist.currentlyPlaying.push(queue[0]);
                  queue[0].play();
                  queue.shift();
                  if (queue.length == 0) {
                    break;
                  }
                }
                
                let diff = (Date.now() - startTime) - desiredTime;
                console.log(diff);
                playlist.currentTick++;
                desiredTime += tickTime;
                window.setTimeout( () => playbackLoop(), (tickTime - diff));
                return;
              }
        }, 

        createQueue: function() {
            let queue = [];
            this.patterns.forEach(pattern => queue.push(...pattern.notes));
            queue.sort((a, b) => a.tick - b.tick);
            queue = queue.filter(note => note.tick >= this.currentTick);
            return queue;
        },

        pause: function() {

        },
    }

window.addEventListener("load", e => {
    

    function constructPlayList() {
        const playlistTable = document.getElementById("playlist-table");
        var playlistRows = 4;
        var playlistCols = 40;
        

        for (let row = 0; row < playlistRows; row++) {
            let currentRow = document.createElement("tr");
            for (let col = 0; col < playlistCols; col++) {
                let currentCol = document.createElement("td");
                if ((col / 4 | 0) % 2 == 1) {
                    currentCol.classList.add("dark");
                }

                currentRow.append(currentCol);
            }
            playlistTable.append(currentRow);
        }
    
    }

    function playlistEvents() {
        $('#playlist-table *').off();
        $("#playlist-table tr td").mousedown(function() {
            if (selectedPattern == undefined) {
                return;
            }
            let row = $(this).parent().index();
            let col = $(this).index();
            let width = selectedPattern.patternLength;

            let selectedArea = createArea(row, col, width);
            if (!playlist.isAreaSelected(selectedArea)) {
                selectedAreas.push(selectedArea);
                playlist.addPattern(selectedPattern, $(this).index() + 1);

                for (let i = 0; i < width; i++) {
                    $(this).parent().find(`td:nth-of-type(${col + 1 + i})`).css('background-color', 'green');
                }

            }
        });

        $("#playlist-play-button").click( function() {
            if (playlist.playing) {
                switchIndicatorOff(this);
                playlist.playing = false;
            } else {
                switchIndicatorOn(this);
                playlist.play();
            }
        });

        function switchIndicatorOff(indicator) {
            indicator.classList.remove("on");
            indicator.classList.add("off");
        }

        function switchIndicatorOn(indicator) {
            indicator.classList.remove("off");
            indicator.classList.add("on");
        }
    }

    
    constructPlayList();
    playlistEvents();
});
