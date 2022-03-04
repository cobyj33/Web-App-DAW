function getSample(url, defaultNote) {
    let note = 'C4';
    if (defaultNote) {
        note = defaultNote;
    }
    console.log(note);
    urls = {}
    urls[`${note}`] = url;

    return new Tone.Sampler({urls});
}

const numOfOctaves = 8;
const numOfBeats = 20;
const octaveNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function getTickSpeed() {

}

const selectedColor = "rgb(0, 255, 0)";

class PianoSelection {
    constructor(note, beat, length) {
        this.note = note;
        this.beat = beat;
        this.length = length;
    }
}

pianoRack = {
    octaves: 5,
    measuresShown: 4,
    sound: getSample("../Sounds/snare.mp3"),
    selections: [],

    select: function(beat, note, length) {
        selections.push(new PianoSelection(beat, note, length));
    },

    render: function() {

    },
    
    play: function() {
        alert("playtrack not implemented");
    },

    record: function() {

    },

    stop: function() {

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
    }
}

function runProgram() {
    pianoRack.hide();
    $("#pianoRack .closeBar .closeButton").on('click', function() {
        pianoRack.hide();
    });

    function constructPianoRackTable() {
        let table = document.getElementById('piano-rack-edit-area');

        for (let octave = numOfOctaves; octave > 0; octave--) {
            octaveNotes.forEach(note => {
                let freq = `${note}${octave}`;
                if (freq.charAt(1) == "#") {

                }

                const noteRow = document.createElement('tr');
                noteRow.setAttribute('data-note', `${note}${octave}`);

                let keyboardKey = document.createElement('td');
                $(keyboardKey).attr('data-note', `${note}${octave}`);
                if (freq.charAt(1) == "#") {
                    $(keyboardKey).addClass('black-key');
                } else {
                    $(keyboardKey).addClass('white-key');
                }
                keyboardKey.innerText = freq;

                noteRow.append(keyboardKey);

                for (let tick = 1; tick < numOfBeats; tick++) {
                    const newCol = document.createElement('td');
                    $(newCol).attr('data-tick', `${tick}`);
                    noteRow.append(newCol);
                }
                table.appendChild(noteRow);
            });
        }
    }

    let oneTimeEvents = function() {
        $(window).on('keypress', function(event) {
            if (event.target == document.body) {
                if (event.code == "KeyP") {
                    pianoRack.toggleVisibility();
                }
            }
        });

        $("#piano-rack-selection-button").on('click', function() {
            pianoRack.toggleVisibility();
        });
    }();

    constructPianoRackTable();
}

$(window).on('load', runProgram);