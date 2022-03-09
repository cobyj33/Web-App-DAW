class PlaylistTrack {
    constructor(row, col, width, pattern) {
        this.row = row;
        this.col = col;
        this.width = width;
        this.pattern = pattern.clone();
        this.moving = false;

        this.canvas = document.createElement('canvas');
        let infoDisplay = document.createElement('div');
        infoDisplay.classList.add('canvas-info-display');
        infoDisplay.innerText = pattern.name;

        this.infoDisplay = infoDisplay;
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
        this.canvas.width = this.width * $("#playlist-table tr td").outerWidth();

        let column = $(this.canvas).parent()[0];
        let row = $(column).parent()[0];
        let endCell = $(row).find(`td:nth-of-type(${$(this.canvas).parent().index() + this.width + 1})`);
        console.log(endCell);
        console.log($(column).index() + this.width + 1);
        if ($(this.canvas).parent().length > 0 && endCell.length > 0) {
            console.log('using the long equation');
            this.canvas.width = endCell.position().left - $(column).position().left + $('#pianoRack tr td').outerWidth();
        }

        let canvasToTableRatio = this.canvas.height / $("#playlist-table tr td").height();
        if (canvasToTableRatio > 0.99 || canvasToTableRatio < 0.80) {
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

            if ($(`#playlist-table tr:nth-of-type(${current.row + 1}) td:nth-of-type(${current.col + 1 + i}`).width() != $(`#playlist-table tr td`).not(".selected").width()) {
                return false;
            }

            if (tableColumn.index() == col && tableColumn.parent.index() == row) {
                return true;
            }

            return false;
        }

        function placeCanvas() {
            $(current.canvas).css("position", "static");
            for (let i = 0; i < current.width; i++) {
                $(`#playlist-table tr:nth-of-type(${current.row + 1}) td:nth-of-type(${current.col + 1 + i}`).addClass("selected");
            }

            let properPosition = $(`#playlist-table tr:nth-of-type(${current.row + 1}) td:nth-of-type(${current.col + 1}`);
            properPosition.addClass("canvas-holder");
            properPosition.append(current.canvas);

            if (current.col + current.width > playlist.cols) {
                playlist.extendHorizontally(current.width);
            }
        }

        if (!isRenderedCorrectly() && !this.moving) {
            this.erase();
            placeCanvas();
        }

        let canvasEvents = function() {
            function updateInfoDisplayPosition(mouseEvent) {
                $(current.infoDisplay).css({
                    'left': `${mouseEvent.clientX + 10}px`,
                    'top': `${mouseEvent.clientY + 10}px`
                });
            }

            $(current.canvas).off();
            $(current.canvas).on('mousemove', function(event){
                updateInfoDisplayPosition(event);
            });

            $(current.canvas).on('mouseenter', function(event){
                $(document.body).append(current.infoDisplay);
                updateInfoDisplayPosition(event);
            });

            $(current.canvas).on('mouseleave', function(){
                $(current.infoDisplay).remove();
            });
        }();
        

        this.drawCanvas();
    }

    drawCanvas() {
        let context = this.canvas.getContext("2d");
        let offset = $(this.canvas).offset();
        context.clearRect(-offset.left, -offset.top, window.innerWidth, window.innerHeight);
        context.strokeStyle = "white";
        context.fillStyle = "white";

        let patternSounds = this.pattern.sounds;
        let tickHeight = this.canvas.height / patternSounds.length;
        let tickLength = this.canvas.width / this.pattern.patternLength;
        let gap = tickHeight / 10;
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

        $(this.canvas).parent().removeClass("canvas-holder");
        $(this.canvas).css("position", "fixed");
        window.addEventListener('mouseup', () => this.moving = false);
        let current = this;
        this.moving = true;
        let mouseX = 0;
        let mouseY = 0;
        let lastVisitedCol = $(this.canvas).parent()[0];

        $('#playlist-table tr td').on('mouseenter', function() {
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
        $(this.canvas).parent().removeClass("canvas-holder");
        $(this.canvas).remove();
        $(this.infoDisplay).remove();
        for (let i = 0; i <  this.width; i++) {
            $(`#playlist-table tr:nth-of-type(${this.row + 1}) td:nth-of-type(${this.col + 1 + i}`).removeClass("selected");
        }
    }
}
