function secondsToTicks(seconds) {
    return Math.round((seconds * 1000) / getTickSpeed());
} 

const defaultPlaylistWidth = 25;
const defaultPlaylistHeight = 100;

const minRows = 4;
const minCols = 20;

playlist = {
        zoom: 1,
        placedTracks: [],
        currentlyPlaying: [],
        selectedTrack: undefined,
        currentTick: 1,
        playing: false,
        looped: false,
        metronomePlaying: false,
        timerLine: {

            render: function() {
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

        get rows() {
            return $("#playlist-table tr").length;
        },

        get cols() {
            return $("#playlist-table tr:first").children().length;
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
            $("#playlist-table tr").css({
                "height": `${defaultPlaylistHeight * this.zoom}px`,
            });

            $("#playlist-table tr td").css({
                "max-width": `${defaultPlaylistWidth * this.zoom}px`,
                "min-width": `${defaultPlaylistWidth * this.zoom}px`,
            });


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
                this.extendHorizontally(track.width);
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
                        if (this.selectedTrack == input) {
                            this.selectedTrack = undefined;
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
            if (this.playing || this.patterns.length == 0 || this.currentTick >= this.length) {
                console.log("play rejected");
                return;
            }
            this.playing = true;
            this.fit();
            
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

        createQueue: function(start) {
            let queue = this.notes;
            queue.sort((a, b) => a.tick - b.tick);

            if (start) {
                queue = queue.filter(note => note.tick >= start);
            } else {
                queue = queue.filter(note => note.tick >= this.currentTick);
            }
            
            return queue;
        },

        extendHorizontally: function(desiredAmount) {
            const playlistTable = document.getElementById("playlist-table");
            let extendAmount = 20;
            if (desiredAmount > 20) {
                extendAmount = desiredAmount + (desiredAmount % 20);
            }

            let colCount = this.cols

            for (let col = 0; col < extendAmount; col++) {
                let currentCol = document.createElement("td");
                if ((((colCount + col) / 4 | 0) % 2) == 1) {
                    currentCol.classList.add('dark');
                }
                $("#playlist-table tr").append(currentCol.cloneNode(true));
            }
            playListTableEvents();
            this.render();
        },

        extendVertically: function(desiredAmount) {
            const playlistTable = document.getElementById("playlist-table");
            let extendAmount = desiredAmount;
            if (isNaN(desiredAmount) || desiredAmount < 1) {
                extendAmount = 1;
            }


            for (let row = 0; row < extendAmount; row++) {
                const currentRow = document.createElement("tr");
                for (let col = 0; col < this.cols; col++) {
                    const currentCol = document.createElement("td");
                    if (((col / 4 | 0) % 2) == 1) {
                        currentCol.classList.add('dark');
                    }
                    $(currentRow).append(currentCol);
                }
                $("#playlist-table").append(currentRow);
            }
        
            playListTableEvents();
            this.render();
        },

        fit: function() {
            let fittedColumnCount = this.length;
            let fittedRowCount = Math.max(...(this.placedTracks.map(track => track.row)));

            if (fittedRowCount < minRows) {
                fittedRowCount = minRows;
            }

            if (fittedColumnCount < minCols) {
                fittedColumnCount = minCols;
            }

            let rowsToDelete = this.rows - fittedRowCount;
            let columnsToDelete = this.cols - fittedColumnCount;

            console.log('rows to delete: ', rowsToDelete);
            console.log('cols to delete: ', columnsToDelete);

            for (let i = 0; i < rowsToDelete; i++) {
                $("#playlist-table tr:last").remove();
            }

            for (let i = 0; i < columnsToDelete; i++) {
                $("#playlist-table tr").find("td:last").remove();
            }

            if ($('#playlist').scrollLeft() > $('#playlist')[0].scrollWidth) {
                $('#playlist').scrollLeft(0);
            }

            if ($('#playlist').scrollTop() > $('#playlist')[0].scrollHeight) {
                $('#playlist').scrollTop(0);
            }

            this.render();
        },

        exportJSON: function() {
            let exportedTracks = [];
            this.placedTracks.forEach(track => {
                let {row, col, width, pattern} = track;
                pattern = pattern.clone();
                exportedTracks.push({row, col, width, pattern});
            });

            return JSON.stringify(exportedTracks);
        },

        importJSON: function(exportedJSON) {
            this.placedTracks = [];
            this.render();
            exportedJSON.forEach(track => {
                let {row, col, width, pattern} = track;
                pattern = makePatternFromJSONObject(pattern);
                this.addTrack(new PlaylistTrack(row, col, width, pattern));
            });
            this.render();
        },
    }

function constructPlayList() {
    const playlistTable = document.getElementById("playlist-table");
    var playlistRows = minRows;
    var playlistCols = minCols;
    

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

    playlist.render();
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
            if ($(this).val() != "") {
                let time = Number($(this).val());
                if (!(time > (playlist.length * getTickSpeed() / 1000) || time < 0)) {
                    playlist.time = time;
                }
            }
        });
    }();


    let autoScrollers = function() {
        $("#playlist-holder .autoscroller").off();
        let scrollPercentage = 0.5;
        let autoScrollingLeft = false;
        let autoScrollingRight = false;
        let autoScrollingUp = false;
        let autoScrollingDown = false;
        let scrollDelay = 50;
        let horizontalScrollAmount = function() {
            return $("#playlist")[0].scrollWidth / 50;
        }; //px
        let verticalScrollAmount = function() {
            return $("#playlist")[0].scrollHeight / 50;
        }


        function scrollPlaylistLeft() {
            let currentLeftScroll = $("#playlist").scrollLeft();
            if (currentLeftScroll - horizontalScrollAmount() <= 0) {
            $("#playlist").scrollLeft(0);
            $("#playlist-autoscroller-left").hide();
            autoScrollingLeft = false;
            } else {
            $("#playlist").scrollLeft(currentLeftScroll - (horizontalScrollAmount() * scrollPercentage));
            }

            if (autoScrollingLeft) {
            setTimeout( () => scrollPlaylistLeft(), scrollDelay);
            }
        }

        function scrollPlaylistRight() {
            let currentLeftScroll = $("#playlist").scrollLeft();
            let maxScrollRight = $("#playlist")[0].scrollWidth - $("#playlist").width();
            if (currentLeftScroll + horizontalScrollAmount() >= maxScrollRight) {
                playlist.extendHorizontally();
            } else {
            $("#playlist").scrollLeft( currentLeftScroll + (horizontalScrollAmount() * scrollPercentage));
            }

            if (autoScrollingRight) {
            setTimeout( () => scrollPlaylistRight(), scrollDelay);
            }
        }

        function scrollPlaylistUp() {
            let currentTopScroll = $("#playlist").scrollTop();
            if (currentTopScroll - verticalScrollAmount() <= 0) {
                $("#playlist").scrollTop(0);
                $("#playlist-autoscroller-top").hide();
                autoScrollingUp = false;
            } else {
                $("#playlist").scrollTop(currentTopScroll - (verticalScrollAmount() * scrollPercentage));
            }

            if (autoScrollingUp) {
            setTimeout( () => scrollPlaylistUp(), scrollDelay);
            }
        }

        function scrollPlaylistDown() {
            let currentTopScroll = $("#playlist").scrollTop();
            let maxScrollTop = $("#playlist")[0].scrollHeight - $("#playlist").height();
            if (currentTopScroll + verticalScrollAmount() >= maxScrollTop) {
                playlist.extendVertically();
            } else {
            $("#playlist").scrollTop(currentTopScroll + (verticalScrollAmount() * scrollPercentage));
            }

            if (autoScrollingDown) {
            setTimeout( () => scrollPlaylistDown(), scrollDelay);
            }
        }

        $("#playlist-autoscroller-right").mouseenter(function() {
            autoScrollingRight = true;
            scrollPlaylistRight();
            $("#playlist-autoscroller-left").show();
        }).mouseleave(function() {
            autoScrollingRight = false;
            scrollPercentage = 0.5;
        }).mousemove(function(e) {
            let scrollerOffset = $("#playlist-autoscroller-right").offset();
            let distanceFromRight = (e.clientX - scrollerOffset.left);
            scrollPercentage = distanceFromRight / $("#playlist-autoscroller-right").width();
        });

        $("#playlist-autoscroller-left").mouseenter(function() {
            autoScrollingLeft = true;
            scrollPlaylistLeft();
            $("#playlist-autoscroller-right").show();
        }).mouseleave(function() {
            autoScrollingLeft = false;
            scrollPercentage = 0.5;
        }).mousemove(function(e) {
            let scrollerOffset = $("#playlist-autoscroller-left").offset();
            let distanceFromLeft = ($("#playlist-autoscroller-left").width() - (e.clientX - scrollerOffset.left))
            scrollPercentage = distanceFromLeft / $("#playlist-autoscroller-left").width();
        });

        $("#playlist-autoscroller-top").mouseenter(function() {
            autoScrollingUp = true;
            scrollPlaylistUp();
            $("#playlist-autoscroller-bottom").show();
        }).mouseleave(function() {
            autoScrollingUp = false;
            scrollPercentage = 0.5;
        }).mousemove(function(e) {
            let scrollerOffset = $("#playlist-autoscroller-top").offset();
            let distanceFromBottom = ($("#playlist-autoscroller-top").height() - (e.clientY - scrollerOffset.top))
            scrollPercentage = distanceFromBottom / $("#playlist-autoscroller-top").height();
        });

        $("#playlist-autoscroller-bottom").mouseenter(function() {
            autoScrollingDown = true;
            scrollPlaylistDown();
            $("#playlist-autoscroller-top").show();
        }).mouseleave(function() {
            autoScrollingDown = false;
            scrollPercentage = 0.5;
        }).mousemove(function(e) {
            let scrollerOffset = $("#playlist-autoscroller-bottom").offset();
            let distanceFromTop = (e.clientY - scrollerOffset.top);
            scrollPercentage = distanceFromTop / $("#playlist-autoscroller-bottom").height();
        });

        $("#playlist-autoscroller-top").hide();
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

        $("#playlist-save-button").click(function() {
            let trackData = "[ " + playlist.exportJSON() + ", " + savedPatterns.exportJSON() + " ]";
            $('#save-ui').toggle();
            $('#save-ui textarea').val(trackData);
        });

        $("#playlist-open-button").click(function() {
            $('#open-ui').toggle();
        });

        $('#playlist-load-button').click(function() {
            let trackData = $('#open-ui textarea').val();
            try {
                let jsonData = JSON.parse(trackData);
                let playlistData = jsonData[0];
                let savedPatternsData = jsonData[1];
                playlist.importJSON(playlistData);
                savedPatterns.importJSON(savedPatternsData);
                selectedPattern = undefined;
            } catch (e) {
                alert("Invalid JSON save");
                return false;
            }
        });

        $('#save-ui').hide();
        $("#open-ui").hide();
    }();

    let renderLoop = function() {
        $("#playlist").hover(function() {
            playlist.render();
        });
    }();

    let playlistKeyEvents = function() {
        $("#playlist").keydown(function(event) {
            let zoomAmount = 0.05;
            let minZoom = 0.05;
            let maxZoom = 3;

            if (event.code == 'Minus') {
                if (playlist.zoom > minZoom) {
                    
                    if (playlist.zoom - zoomAmount < minZoom) {
                        playlist.zoom = minZoom;
                    } else {
                        playlist.zoom -= zoomAmount;
                    }

                    playlist.render();
                }
            } else if (event.code == 'Equal') {
                
                if (playlist.zoom < maxZoom) {
                    
                    if (playlist.zoom + zoomAmount > maxZoom) {
                        playlist.zoom = maxZoom;
                    } else {
                        playlist.zoom += zoomAmount;
                    }

                    playlist.render();
                }

            }
        });

    }();
}



window.addEventListener("load", e => {
    constructPlayList();
    playListTableEvents();
    playListFunctionalityEvents();
});
