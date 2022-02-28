let selectedAreas = [];
let selectedArea = undefined;

function secondsToTicks(seconds) {
    return Math.round((seconds * 1000) / getTickSpeed());
} 

function getAreaSelectedAt(row, col) {
    for (let i = 0; i < selectedAreas.length; i++) {
        if (selectedAreas[i].contains(row, col)) {
            return selectedAreas[i];
        }
    }
    console.log("[FATAL] NO AREA SELECTED AT " + row + " " + col);
    return undefined; 
}

function createArea(row, col, width) {
    return {
        row: row,
        col: col,
        width: width,

        get rightSide() {
            return col + width;
        },

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
        },

        contains: function(row, col) {
            if (this.row == row && (this.col <= col && this.col + this.width >= col)) {
                return true;
            }
            return false;
        }
    };
}

playlist = {
        rows: 10,
        cols: 40,
        zoom: 100,
        patterns: [],
        currentlyPlaying: [],
        currentTick: 1,
        playing: false,
        looped: false,
        metronomePlaying: false,
        timerLine: {
            tick: 1,

            render: function() {
                $("#timer-line").css('transition', `left ${getTickSpeed() / 1000}s`);
                $("#timer-line").css('left', (this.tick - 1) * $("#playlist-table tr td").width() + "px");
            },

            setPlaylistTime: function() {
                let leftOffset = $("#timer-line").position().left;
                this.tick = Math.round(leftOffset / $("#playlist-table tr td").width());
                playlist.currentTick = this.tick;
                playlist.timeDisplay.update();
            },

            move: function() {

            }
        },
        timeDisplay: {
            update: function() {
                let displayedTime = Math.round(playlist.currentTime * 100) / 100;
                $("#current-time-display").val(displayedTime);
            }
        },

        get currentTime() {
            return (this.currentTick * getTickSpeed()) / 1000;
        },

        get length() {
            let patternLengths = [];
            this.patterns.forEach(pattern => patternLengths.push(pattern.patternLength));
            return Math.max(...patternLengths);
        },

        set time(time) {
            this.currentTick = secondsToTicks(time);
            this.timerLine.tick = this.currentTick;
            this.timerLine.render();
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
            if (this.playing || this.patterns.length == 0) {
                return;
            }
            this.playing = true;
            
            let queue = this.createQueue();
            console.log(queue);
            let startTime = audioContext.currentTime;
            let tickTime = getTickSpeed();
            $("#timer-line").css('left', (this.currentTick - 1) * $("#playlist-table tr td").width() + "px");

            queue.forEach(note => {
                note.play(startTime + ((note.tick - this.currentTick) * tickTime / 1000));
            });

            setTimeout(() => {
                if (scheduledBuffers.length == 0)
                    this.playing = false;
            }, queue[queue.length - 1].tick * tickTime);

            let playlist = this;
            let moveTimerLine = function() {
                let startTime = Date.now();
                let desiredTime = 0;

                function moveLine() {
                    if (playlist.playing) {
                        playlist.currentTick++;
                        playlist.timerLine.tick = playlist.currentTick;
                        playlist.timerLine.render();
                        playlist.timeDisplay.update();
                        let diff = (Date.now() - startTime) - desiredTime;
                        desiredTime += tickTime;
                        setTimeout(moveLine, tickTime - diff);
                    }
                }
                moveLine();
            }();
        },

        stop: function() {
            window.stopPlayback();
            this.playing = false;
        },

        createQueue: function() {
            let queue = [];
            this.patterns.forEach(pattern => queue.push(...pattern.notes));
            queue.sort((a, b) => a.tick - b.tick);
            queue = queue.filter(note => note.tick >= this.currentTick);
            return queue;
        },

        extend: function(desiredAmount) {
            const playlistTable = document.getElementById("playlist-table");
            let extendAmount = 20;
            if (desiredAmount > 20) {
                extendAmount = desiredAmount + (desiredAmount % 20);
            }

            for (let col = 0; col < extendAmount; col++) {
                let currentCol = document.createElement("td");
                if (((this.cols / 4 | 0) % 2) == 1) {
                    currentCol.classList.add('dark');
                }
                $("#playlist-table tr").append(currentCol.cloneNode(true));
                this.cols++;
            }
        }
    }

window.addEventListener("load", e => {
    

    function constructPlayList() {
        const playlistTable = document.getElementById("playlist-table");
        var playlistRows = playlist.rows;
        var playlistCols = playlist.cols;
        

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

    let movingArea = false;
    window.addEventListener('mouseup', () => movingArea = false);
    function playlistEvents() {
        $('#playlist-table *').off();
        $('#timer-line').off();

        $('#playlist').scroll(function() {
            $("#timer-line").css('top', $(this).scrollTop() + 'px');
        });

        $("#playlist-table tr td").mousedown(function() {
            if (selectedPattern == undefined) {
                return;
            }
            let row = $(this).parent().index();
            let col = $(this).index();
            let width = selectedPattern.patternLength;

            let newArea = createArea(row, col, width);
            if (!playlist.isAreaSelected(newArea)) {
                selectedAreas.push(newArea);
                selectedArea = newArea;
                playlist.addPattern(selectedPattern, $(this).index() + 1);

                if (newArea.rightSide > playlist.cols) {
                    playlist.extend(newArea.width);
                }

                let canvas = createCanvas(selectedPattern);
                $(this).css("max-width", $(this).width() + "px");
                $(this).css("z-index", "1");
                $(this).append(canvas);

                for (let i = 0; i < width; i++) {
                    $(`#playlist-table tr:nth-of-type(${row + 1}) td:nth-of-type(${col + 1 + i}`).addClass("selected");
                }
            }
        });

        $("#playlist-play-button").click( function() {
            if (playlist.playing) {
                switchIndicatorOff(this);
                playlist.stop();
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

        let timerLineEvents = function() {
            let movingTimer = false;
            let mouseX = 0;
            function updateMouse(e) {
                mouseX = e.clientX;
            }

            $("#timer-line").mousedown(function() {
                movingTimer = true;
                document.getElementById('playlist').addEventListener('mousemove', updateMouse);
                $(this).css('cursor', 'grabbing');
                dragTimer();
            });

            function dragTimer() {
                if (movingTimer) {
                    let offset = $("#timer-line").offset();
                    let movement = mouseX - offset.left;
                    $("#timer-line").css('left', $("#timer-line").position().left + movement + "px");
                    setTimeout(() => dragTimer(), 50);
                }
            }

            window.addEventListener('mouseup', () => {
                movingTimer = false;
                document.getElementById('playlist').removeEventListener('mousemove', updateMouse);
                $("#timer-line").css('cursor', '');
                playlist.timerLine.setPlaylistTime();
            });
        }(); 

        let timeDisplayEvents = function() {
            $("#current-time-display").off();
            $("#current-time-display").on('input', function() {
                console.log($(this).val());
                if ($(this).val() != "") {
                    console.log('is number');
                    let time = Number($(this).val());
                    if (!(time > (playlist.length * getTickSpeed() / 1000) || time < 0)) {
                        console.log("time changed");
                        playlist.time = time;
                        console.log(playlist);
                    }
                }
            });
        }();
    }

    function createCanvas(pattern) {
        let canvas = document.createElement("canvas");
        // let canvas = document.getElementById("canvas");
        canvas.style.backgroundColor = "gray";
        canvas.width = selectedArea.width * $("#playlist-table tr td").width();
        canvas.height = $("#playlist-table tr td").height();
        let context = canvas.getContext("2d");
        context.strokeStyle = "white";
        context.fillStyle = "white";

        function drawCanvas() {
            let patternSounds = pattern.sounds;
            let gap = 10;
            let tickHeight = canvas.height / patternSounds.length;
            let tickLength = canvas.width / pattern.patternLength;
            let drawnNotes = pattern.notes;

            function getSoundPosition(note) {
                for (let i = 0; i < patternSounds.length; i++) {
                    if (_.isEqual(note.sound, patternSounds[i])) {
                        return i;
                    }
                }
            }

            for (let i = 0; i < drawnNotes.length; i++) {
                let currentNote = drawnNotes[i];
                context.fillRect((currentNote.tick - 1) * tickLength + gap, getSoundPosition(currentNote) * tickHeight + gap, tickLength - gap, tickHeight - gap);
            }

            context.rect(0, 0, canvas.width, canvas.height);
            context.stroke();
        }

        drawCanvas();
        return canvas;
    }
    

    
    constructPlayList();
    playlistEvents();
});
