function secondsToTicks(seconds) {
    return Math.round((seconds * 1000) / getTickSpeed());
} 
class PlaylistTrack {
    constructor(row, col, width, pattern) {
        this.row = row;
        this.col = col;
        this.width = width;
        this.pattern = pattern.clone();
        this.moving = false;
        console.log(this.pattern);
        this.canvas = document.createElement('canvas');
        this.render();
    }

    get rightSide() {
        return this.col + this.width;
    }

    get startingTick() {
        return this.col + 1;
    }

    overlaps({row, col, width}) {
        if (row != this.row) {
            return false;
        }

        if (col + width > this.col && col < this.col) {
            return true;
        } else if (col < this.col + this.width && col > this.col) {
            return true;
        }
        return false;
    }

    contains(row, col) {
        if (this.row == row && (this.col <= col && this.col + this.width >= col)) {
            return true;
        }
        return false;
    }

    render() {
        let current = this;
        this.canvas.width = this.width * $("#playlist-table tr td").width();
        if (this.canvas.height / $("#playlist-table tr td").height() < 0.9) {
            this.canvas.height = $("#playlist-table tr td").height();
        }
        

        function isRenderedCorrectly() {
            if (typeof $(current.canvas).parent[0] == 'undefined') {
                return false;
            }
            let tableColumn = $(current.canvas).parent();

            if (current.col + current.width > playlist.cols) {
                return false;
            }

            for (let i = 0; i < current.width; i++) {
                if (!$(`#playlist-table tr:nth-of-type(${current.row + 1}) td:nth-of-type(${current.col + 1 + i}`).hasClass("selected")) {
                    return false;
                }
            }

            if (tableColumn.index() == col && tableColumn.parent.index() == row) {
                return true;
            }
            return false;
        }

        function placeCanvas() {
            $(current.canvas).css("position", "static");
            let properPosition = $(`#playlist-table tr:nth-of-type(${current.row + 1}) td:nth-of-type(${current.col + 1}`);
            properPosition.css({
                'max-width': properPosition.width(),
                'z-index': '1'
            });
            properPosition.append(current.canvas);

            if (current.col + current.width > playlist.cols) {
                playlist.extend(current.width);
            }

            for (let i = 0; i < current.width; i++) {
                $(`#playlist-table tr:nth-of-type(${current.row + 1}) td:nth-of-type(${current.col + 1 + i}`).addClass("selected");
            }
        }

        if (!isRenderedCorrectly()) {       
            placeCanvas();
        }

        this.drawCanvas();
    }

    drawCanvas() {
        let context = this.canvas.getContext("2d");
        let offset = $(this.canvas).offset();
        context.clearRect(-offset.left, -offset.top, window.innerWidth, window.innerHeight);
        context.strokeStyle = "white";
        context.fillStyle = "white";

        let patternSounds = this.pattern.sounds;
        let gap = 10;
        let tickHeight = this.canvas.height / patternSounds.length;
        let tickLength = this.canvas.width / this.pattern.patternLength;
        let drawnNotes = this.pattern.notes;

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

        context.rect(0, 0, this.canvas.width, this.canvas.height);
        context.stroke();
    }

    move() {
        if (this.moving) {
            console.log("[PlaylistTrack] cannot move because track is already moving");
            return;
        } else if (!($(this.canvas).is(":visible"))) {
            console.log("[PlaylistTrack] cannot move because track is not rendered");
            return;
        }

        for (let i = 0; i <  this.width; i++) {
            $(`#playlist-table tr:nth-of-type(${this.row + 1}) td:nth-of-type(${this.col + 1 + i}`).removeClass("selected");
        }

        $(this.canvas).css("position", "fixed");
        window.addEventListener('mouseup', () => this.moving = false);
        let current = this;
        this.moving = true;
        let mouseX = 0;
        let mouseY = 0;
        let lastVisitedCol = $(this.canvas).parent()[0];

        $('#playlist-table tr td').mouseenter(function() {
            lastVisitedCol = this;
        });

        function updateMouse(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }

        window.addEventListener('mousemove', updateMouse);
        function movementLoop() {
            if (current.moving) {
                let offset = $(current.canvas).offset();
                let movementX = mouseX - offset.left + 10;
                let movementY = mouseY - offset.top + 10;
                $(current.canvas).css({
                    "left": $(current.canvas).offset().left + movementX + "px",
                    "top": $(current.canvas).offset().top + movementY + "px",
                });
                current.drawCanvas();
                setTimeout(() => movementLoop(), 10);
            } else {
                window.removeEventListener('mousemove', updateMouse);
                $(current.canvas).remove();
                current.row = $(lastVisitedCol).parent().index();
                current.col = $(lastVisitedCol).index();
                current.moving = false;
                current.render();
            }
        }
        movementLoop();
    }

    erase() {
        $(this.canvas).remove();
    }
}

playlist = {
        rows: 10,
        cols: 40,
        zoom: 100,
        placedTracks: [],
        currentlyPlaying: [],
        selectedTrack: undefined,
        currentTick: 1,
        playing: false,
        looped: false,
        metronomePlaying: false,
        timerLine: {

            render: function() {
                console.log(playlist.currentTick);
                $("#timer-line").css('transition', `left ${getTickSpeed() / 1000}s`);
                $("#timer-line").css('left', (playlist.currentTick - 1) * $("#playlist-table tr td").width() + "px");
            },

            setPlaylistTime: function() {
                let leftOffset = $("#timer-line").position().left;
                let tick = Math.round(leftOffset / $("#playlist-table tr td").width());

                if (tick > 0 && tick < playlist.length) {
                    playlist.currentTick = tick;
                }
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

        get patterns() {
            let patterns = [];
            this.placedTracks.forEach(track => patterns.push(track.pattern));
            return patterns;
        },

        get notes() {
            let notes = []
            this.placedTracks.forEach(track => {
                track.pattern.notes.forEach(note => {
                    notes.push(new Note(note.sound, note.tick + track.startingTick));
                });
            });
            return notes;
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

        render: function() {
            this.placedTracks.forEach(track => track.render());
            this.timerLine.render();
        },

        addTrack: function(track) {
            this.placedTracks.push(track);
            if (track.rightSide > this.cols) {
                this.extend(track.width);
            }
        },

        removeTrack: function(input) {
            if (typeof input == 'number') {
                this.placedTracks.splice(input, 1);
            } else {
                for (let i = 0; i < this.placedTracks.length; i++) {
                    if (_.isEqual(this.placedTracks[i], input)) {
                        this.placedTracks[i].erase();
                        this.patterns.splice(i, 1);
                        break;
                    }
                }
            }
        },

        isAreaSelected: function(area) {
            for (let i = 0; i < this.placedTracks.length; i++) {
                if (this.placedTracks[i].overlaps(area)) {
                    return true;
                }
            }
            return false;
        },

        getTrackSelectedAt: function(row, col) {
            for (let i = 0; i < this.placedTracks.length; i++) {
                if (this.placedTracks[i].contains(row, col)) {
                    return this.placedTracks[i];
                }
            }
            console.log("[FATAL] NO AREA SELECTED AT " + row + " " + col);
            return undefined; 
        },

        play: function() {
            if (this.playing || this.patterns.length == 0) {
                return;
            }
            this.playing = true;
            this.render();
            
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
                        console.log(scheduledBuffers);
                        playlist.currentTick++;
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
            let queue = this.notes;
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
        },

        zoom: function(amount) {

        },

        zoomTo: function(amount) {

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

            if ($(this).hasClass("selected")) {
                playlist.selectedTrack = playlist.getTrackSelectedAt(row, col);
                playlist.selectedTrack.move();
            } else {
                if (!playlist.isAreaSelected({row: row, col: col, width: width})) {
                    let newTrack = new PlaylistTrack(row, col, width, selectedPattern);
                    playlist.addTrack(newTrack);
                    playlist.selectedTrack = newTrack;
                    playlist.render();
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

        $("#playlist-stop-button").click( function() {
            if (playlist.playing) {
                switchIndicatorOn(this);
                playlist.stop();
                playlist.currentTick = 1;
                playlist.render();
                setTimeout(() => switchIndicatorOff(this), 500);
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
    

    
    constructPlayList();
    playlistEvents();
});
