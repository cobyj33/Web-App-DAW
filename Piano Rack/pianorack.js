const { Tone } = require("tone/build/esm/core/Tone");

const numOfOctaves = 8;
const numOfBeats = 20;
const octaveNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];


const selectedColor = "rgb(0, 255, 0)";

class PianoRackSelection {
    constructor(note) {
        this.note = note;
        let element = document.createElement('div');
        element.classList.add('piano-rack-selection');
        element.innerText = note.freq;

        let extender = document.createElement('div');
        extender.classList.add('piano-rack-selection-extender');
        element.appendChild(extender);
        this.extender = extender;

        $(`#pianoRack tr td[data-tick='${note.tick}'][data-note='${note.freq}']`).append(element);
        this.element = element;
        this.events();
    }

    render() {

    }

    events() {
        let current = this;
        let extendingNote = function() {
            $(current.extender).on('mousedown', function(event) {
                if (event.target != current.extender) { return; }
                let startingPosition = $(current.extender).offset().left;
                let tickDistance = $("#pianoRack tr td[data-tick]").outerWidth();
                let extendLength = 0;
                let minExtend = 1 - current.note.length;

                function extend(event) {
                    console.log(extendLength);
                    extendLength = Math.max(minExtend, (event.clientX - startingPosition) / tickDistance);
                    $(current.element).css('width', `${(current.note.length + extendLength) * tickDistance}px`);
                }

                function cancelExtending() {
                    current.note.length = Math.round(current.note.length + extendLength);
                    let startingCell = $(`#pianoRack td[data-tick='${current.note.tick}'][data-note='${current.note.freq}']`);
                    let endingCell = $(`#pianoRack td[data-tick='${current.note.tick + current.note.length}'][data-note='${current.note.freq}']`);
                    $(current.element).css('width', `${endingCell.position().left - startingCell.position().left}px`);
                    window.removeEventListener('mouseup', cancelExtending);
                    window.removeEventListener('mousemove', extend);
                }

                window.addEventListener('mouseup', cancelExtending);
                window.addEventListener('mousemove', extend);
            });
        }();
    }

    erase() {
        $(this.extender).remove();
        $(this.element).remove();
    }
}

pianoRack = {
    octaves: 5,
    measuresShown: 4,
    sound: new Sound("Snare", "../Sounds/snare.mp3"),
    currentTick: 1,
    selections: [],
    recording: false,

    get length() {
        const length = Math.max(...this.selections.map(selection => selection.note.tick + selection.note.length));
        return length;
    },

    get notes() {
        return this.selections.map(selection => selection.note);
    },

    select: function(note) {
        note.playImmediately();
        this.selections.push(new PianoRackSelection(note));
    },

    deselect: function(note) {
        for (let i = 0; i < this.selections.length; i++) {
            if (this.selections[i].note.overlaps(note)) {
                let deletedElement = this.selections.splice(i, 1);
                deletedElement[0].erase();
                break;
            }
        }
    },

    isSelected: function(note) {
        return this.selections.some((value) => value.note.overlaps(note));
    },

    highlight: function(freq) {
        console.log(freq);
        console.log($(`#piano-rack-edit-area tr td.key-display`).length);
        console.log($(`#piano-rack-edit-area tr td[data-note='${freq}']`).length);
        console.log($(`#piano-rack-edit-area tr td.key-display[data-note='${freq}']`).length);
        $(`#piano-rack-edit-area tr td.key-display[data-note='${freq}']`).addClass('highlighted');
    },

    unhighlight: function(freq) {
        console.log(freq);
        $(`#piano-rack-edit-area tr td.key-display[data-note='${freq}']`).removeClass('highlighted');
    },

    render: function() {

    },
    
    play: function() {
        if (this.currentTick >= this.length) {
            this.currentTick = 1;
            $(`#piano-rack-edit-area tr td[data-tick]`).removeClass('play-line');
        }
        Tone.Transport.cancel();
        let queue = this.selections.map(selection => selection.note)
        .filter(note => note.tick >= this.currentTick)
        .sort((a, b) => a.tick - b.tick);

        let noteInfo = [];
        queue.forEach(note => {
            noteInfo.push({
                time: note.timeInSeconds + Tone.Transport.seconds,
                note: note
            });
        })

        let track = new Tone.Part(function(time, values) {
            values.note.playNote();
        }, noteInfo).start(0);

        Tone.Transport.scheduleRepeat(function(time) {
            $(`#piano-rack-edit-area tr td[data-tick='${pianoRack.currentTick - 1}']`).removeClass('play-line')
            $(`#piano-rack-edit-area tr td[data-tick='${pianoRack.currentTick}']`).addClass('play-line')
            pianoRack.currentTick++;
            console.log('tick: ', pianoRack.currentTick);
        }, getTickSpeed() / 1000);
        Tone.Transport.start();
        console.log(queue[queue.length - 1].endInSeconds);
        Tone.Transport.pause(Tone.now() + queue[queue.length - 1].endInSeconds);
    },

    record: function() {

    },

    stop: function() {
        $(`#piano-rack-edit-area tr td[data-tick]`).removeClass('play-line')
        Tone.Transport.cancel();
        Tone.Transport.stop();
    },

    restart: function() {

    },

    show: function() {
        $('#pianoRack').show();
        keyboardPianoEnabled = true;
    },

    hide: function() {
        $('#pianoRack').hide();
        keyboardPianoEnabled = false;
    },

    toggleVisibility: function() {
        if ($('#pianoRack').is(":visible")) {
            this.hide();
        } else {
            this.show();
        }
    },

    getPattern: function() {
        if (this.notes.length == 0) {
            console.log("cannot get empty pattern");
            return;
        }

        let currentPattern = new Pattern(this.notes);
        currentPattern.name = document.getElementById("piano-rack-name-input").value;
        if (currentPattern.name == "")
            currentPattern.name = `New Pattern #${savedPatterns.patterns.length + 1}`;

        return currentPattern;
    },

    save: function() {
        let pattern = this.getPattern();
        if (pattern)
            savedPatterns.addPattern(pattern)
    },

    record: function() {
        if (this.recording) {
            this.recording = false;
            return;
        }
        this.recording = true;
        Tone.Transport.scheduleRepeat(function(time) {

        }, getTickSpeed() / 1000);
        // implemented in keyboardPiano.js
    }
}

function runProgram() {
    pianoRack.hide();
    $("#pianoRack .closeButton").on('click', function() {
        pianoRack.hide();
    });

    let constructPianoRackTable = function() {
        let table = document.getElementById('piano-rack-edit-area');

        for (let octave = numOfOctaves; octave > 0; octave--) {
            octaveNotes.forEach(note => {
                let freq = `${note}${octave}`;

                const noteRow = document.createElement('tr');
                $(noteRow).attr('data-note', `${note}${octave}`);
                let keyboardKey = document.createElement('td');
                $(keyboardKey).attr('data-note', `${note}${octave}`);
                $(keyboardKey).addClass('key-display');

                if (freq.charAt(1) == "#") {
                    $(keyboardKey).addClass('black-key');
                    $(noteRow).addClass('black-key');
                } else {
                    $(keyboardKey).addClass('white-key');
                    $(noteRow).addClass('white-key');
                }
                keyboardKey.innerText = freq;

                noteRow.append(keyboardKey);

                for (let tick = 1; tick < numOfBeats; tick++) {
                    const newCol = document.createElement('td');
                    $(newCol).attr('data-tick', `${tick}`);
                    $(newCol).attr('data-note', $(noteRow).attr('data-note'));
                    noteRow.append(newCol);
                }
                table.appendChild(noteRow);
            });
        }
    }();

    let oneTimeEvents = function() {
        $(window).on('keypress', function(event) {
            if (event.target == document.body) {
                if (event.code == "KeyP") {
                    pianoRack.toggleVisibility();
                }
            }
        });

        $(".piano-rack-selection-button").on('click', () => pianoRack.toggleVisibility() );
        $("#piano-rack-stop-button").on('click', () => pianoRack.stop() );
        $("#piano-rack-play-button").on('click', () => pianoRack.play() );
        $("#piano-rack-save-button").on('click', () => pianoRack.save() );
        $("#piano-rack-record-button").on('click', () => {
            pianoRack.record();
        });

        $("#pianoRack").on('mousedown', function(event) {
            if (event.key = 'r')
                pianoRack.record();
        })

        $("#pianoRack tr td[data-tick]").on('mousedown', function(event) {
            event.preventDefault();
            noteInfo = {
                sound: pianoRack.sound,
                tick: Number(this.getAttribute('data-tick')),
                freq: this.getAttribute('data-note'),
            }
            let newNote = new Note(noteInfo);
            if (!pianoRack.isSelected(newNote)) {
                pianoRack.select(new Note(noteInfo));
            } else if ($(event.target).hasClass('piano-rack-selection')) {
                console.log('is selected');
                pianoRack.deselect(new Note(noteInfo));
            }
        });
    }();

}

$(window).on('load', runProgram);