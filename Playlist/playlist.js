function secondsToTicks(seconds) {
    return Math.round((seconds * 1000) / getTickSpeed());
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

                if (tick <= 0 || playlist.placedTracks.length == 0) {
                    tick = 1;
                } else if (tick > playlist.length) {
                    tick = playlist.length; 
                }

                playlist.currentTick = tick;
                playlist.render();
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
            return Math.max(...(this.notes.map(note => note.tick)));
        },

        set time(time) {
            this.currentTick = secondsToTicks(time) + 1;
            this.timerLine.tick = this.currentTick;
            this.timerLine.render();
            this.timeDisplay.update();
        },

        render: function() {
            this.placedTracks.forEach(track => track.render());
            this.timerLine.render();
            this.timeDisplay.update();
            if (this.playing) {
                $("#playlist-play-button").addClass('on');
            } else {
                $("#playlist-play-button").removeClass('on');
            }

            if (this.looped) {
                $("#playlist-loop-button").addClass('on');
            } else {
                $("#playlist-loop-button").removeClass('on');
            }
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
                        this.placedTracks.splice(i, 1);
                        if (selectedTrack == input) {
                            selectedTrack = undefined;
                        }
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
            console.log(`current tick: ${this.currentTick} length: ${this.length}`);
            if (this.playing || this.patterns.length == 0 || this.currentTick >= this.length) {
                console.log("play rejected");
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

            let end = function() {
                let trackTime = queue[queue.length - 1].tick * tickTime - (playlist.currentTick * tickTime);
                let predictedEndTime = Date.now() + trackTime;

                function handle() {
                    if (Date.now() < predictedEndTime) {
                        setTimeout(handle, predictedEndTime - Date.now());
                    } else if (scheduledBuffers.length == 0) {
                        if (playlist.playing) {
                            playlist.stop();
                            if (playlist.looped) {
                                playlist.time = 0;
                                playlist.play();
                            }
                        }
                    }                
                }

                setTimeout(handle, trackTime)
            }();

            let moveTimerLine = function() {
                let startTime = Date.now();
                let desiredTime = 0;
                let predictedTick = playlist.currentTick;

                function moveLine() {
                    if (playlist.playing && (playlist.currentTick == predictedTick)) {
                        console.log(scheduledBuffers);
                        playlist.currentTick++;
                        predictedTick++;
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
            this.render();
        },

        restart: function() {
            this.stop();
            setTimeout(() => {
                this.currentTick = 0;
                this.play();
            }, getTickSpeed());
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
            playListTableEvents();
            this.render();
        },

        zoom: function(amount) {

        },

        zoomTo: function(amount) {

        }
    }

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

function playListTableEvents() {
    $('#playlist-table *').off();
    $("#playlist-table tr td").mousedown(function(event) {
        if (selectedPattern == undefined) {
            return;
        }
        let row = $(this).parent().index();
        let col = $(this).index();
        let width = selectedPattern.patternLength;

        if ($(this).hasClass("selected")) {
            playlist.selectedTrack = playlist.getTrackSelectedAt(row, col);

            if (event.button == 2) { //right click
                playlist.removeTrack(playlist.selectedTrack);
            } else {
                playlist.selectedTrack.move();
            }
        } else {
            if (!playlist.isAreaSelected({row: row, col: col, width: width})) {
                let newTrack = new PlaylistTrack(row, col, width, selectedPattern);
                playlist.addTrack(newTrack);
                playlist.selectedTrack = newTrack;
                playlist.render();
            }
        }


    });
}

function playListFunctionalityEvents() {
    document.getElementById('playlist-table').addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });

    let timerLineEvents = function() {
        $('#timer-line').off();
        $('#playlist').scroll(function() {
            $("#timer-line").css('top', $(this).scrollTop() + 'px');
        });

        let movingTimer = false;
        let mouseX = 0;
        function updateMouse(e) {
            mouseX = e.clientX;
        }

        $("#timer-line").mousedown(function(e) {
            movingTimer = true;
            updateMouse(e);
            document.getElementById('playlist').addEventListener('mousemove', updateMouse);
            $(this).css('cursor', 'grabbing');
            dragTimer();
        });

        function dragTimer() {
            if (movingTimer) {
                let mouseOnTable = mouseX - $("#playlist").offset().left; 
                $("#timer-line").css('left', $("#playlist").scrollLeft() + mouseOnTable + "px");
                setTimeout(() => dragTimer(), 50);
            }
        }

        window.addEventListener('mouseup', () => {
            if (movingTimer == true) {
                document.getElementById('playlist').removeEventListener('mousemove', updateMouse);
                $("#timer-line").css('cursor', '');
                playlist.timerLine.setPlaylistTime();
            }
            movingTimer = false;
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


    let autoScroller = function() {
        $("#playlist-holder .autoscroller").off();
        let scrollPercentage = 0.5;
        let autoScrollingLeft = false;
        let autoScrollingRight = false;
        let scrollDelay = 50;
        let scrollAmount = function() {
            return $("#playlist")[0].scrollWidth / 50;
        }; //px

        function scrollPlaylistLeft() {
            console.log("scroll percentage: " + scrollPercentage);
            let currentLeftScroll = $("#playlist").scrollLeft();
            if (currentLeftScroll - scrollAmount() <= 0) {
            $("#playlist").scrollLeft(0);
            $("#playlist-autoscroller-left").hide();
            autoScrollingLeft = false;
            } else {
            $("#playlist").scrollLeft(currentLeftScroll - (scrollAmount() * scrollPercentage));
            }

            if (autoScrollingLeft) {
            setTimeout( () => scrollPlaylistLeft(), scrollDelay);
            }
        }

        function scrollPlaylistRight() {
            console.log("scroll percentage: " + scrollPercentage);
            let currentLeftScroll = $("#playlist").scrollLeft();
            let maxScrollRight = $("#playlist")[0].scrollWidth - $("#playlist").width();
            if (currentLeftScroll + scrollAmount() >= maxScrollRight) {
                playlist.extend();
            } else {
            $("#playlist").scrollLeft( currentLeftScroll + (scrollAmount() * scrollPercentage));
            }

            if (autoScrollingRight) {
            setTimeout( () => scrollPlaylistRight(), scrollDelay);
            }
        }

        $("#playlist-autoscroller-right").mouseenter(function() {
            autoScrollingRight = true;
            scrollPlaylistRight();
            $("#playlist-autoscroller-left").show();
        });

        $("#playlist-autoscroller-right").mouseleave(function() {
            autoScrollingRight = false;
            scrollPercentage = 0.5;
        });

        $("#playlist-autoscroller-right").mousemove(function(e) {
            let scrollerOffset = $("#playlist-autoscroller-right").offset();
            let distanceFromRight = (e.clientX - scrollerOffset.left);
            scrollPercentage = distanceFromRight / $("#playlist-autoscroller-right").width();
        });

        $("#playlist-autoscroller-left").mouseenter(function() {
            autoScrollingLeft = true;
            scrollPlaylistLeft();
            $("#playlist-autoscroller-right").show();
        });

        $("#playlist-autoscroller-left").mouseleave(function() {
            autoScrollingLeft = false;
            scrollPercentage = 0.5;
        });

        $("#playlist-autoscroller-left").mousemove(function(e) {
            let scrollerOffset = $("#playlist-autoscroller-left").offset();
            let distanceFromLeft = ($("#playlist-autoscroller-left").width() - (e.clientX - scrollerOffset.left))
            scrollPercentage = distanceFromLeft / $("#playlist-autoscroller-left").width();
        });

        $("#playlist-autoscroller-left").hide();
    }();

    let toolBarButtonEvents = function() {
        $("#playlist-play-button").click( function() {
            if (playlist.playing) {
                playlist.stop();
            } else {
                playlist.play();
            }
        });

        $("#playlist-loop-button").click( function() {
            if (playlist.looped) {
                $(this).removeClass('on');
                playlist.looped = false;
            } else {
                $(this).addClass('on');
                playlist.looped = true;
            }
        });

        $("#playlist-restart-button").click( function() {
            if (playlist.playing) {
                playlist.restart();
            } else {
                playlist.time = 0;
            }
            
        });
    }();
}



window.addEventListener("load", e => {
    constructPlayList();
    playListTableEvents();
    playListFunctionalityEvents();
});
