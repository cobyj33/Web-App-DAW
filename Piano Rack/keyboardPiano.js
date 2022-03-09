var keyboardPianoEnabled = false;
let keyboardOctave = 4;
const keyboardKeys = {
    "z": "C",
    "s": "C#",
    "x": "D",
    "d": "D#",
    "c": "E",
    "v": "F",
    "g": "F#",
    "b": "G",
    "h": "G#",
    "n": "A",
    "j": "A#",
    "m": "B",

    isKey: function(key) {
        if (Object.keys(this).includes(key)) {
            return true;
        }
        return false;
    },

    isDigit: function(key) {
        if (isNaN(parseInt(key))) {
            return false;
        }
        return true;
    }
}


$(window).on('load', function() {

    let keyboardPiano = function(key) {
        console.log(key);
        if (keyboardKeys.isDigit(key)) {
            keyboardOctave = parseInt(key);
        }
        
        if (keyboardKeys.isKey(key)) {


            let released = false;
            window.addEventListener('keyup', checkQuickRelease)
            let urls = {};
            urls[`${pianoRack.sound.defaultFrequency}`] = pianoRack.sound.source;
            function checkQuickRelease(event) {
                if (event.key == key)
                    released = true;
            }

            const sampler = new Tone.Sampler({
                urls,
                onload: function() {

                    if (pianoRack.recording) {
                        let note = new Note({
                            sound: pianoRack.sound,
                            freq: keyboardKeys[key],
                        });
                    }

                    console.log('sound loaded');
                    if (released) {
                        sampler.triggerAttackRelease(keyboardKeys[key] + keyboardOctave, 0.1);
                        if (pianoRack.recording)
                            pianoRack.select(note)
                    } else {
                        window.removeEventListener('keyup', checkQuickRelease);
                        sampler.triggerAttack(keyboardKeys[key] + keyboardOctave);
                        let start = Tone.now();

                        function checkRelease(event) {
                            if (event.key == key) {
                                console.log('released');
                                sampler.triggerRelease();
                                let duration = Tone.now() - start;
                                if (pianoRack.recording) {
                                    note.lengthInSeconds = duration;
                                    pianoRack.select(note);
                                }
                                window.removeEventListener('keyup', checkRelease);
                            }
                        }
                    
                        window.addEventListener('keyup', checkRelease);
                    }
                },
            }).toDestination();

            pianoRack.highlight(keyboardKeys[key] + keyboardOctave);
        }
    };

    window.addEventListener('keypress', function(event) {
        if (keyboardPianoEnabled && !event.repeat)
            keyboardPiano(event.key)
    });

    $(window).on('keyup', function(event) {
        if (keyboardPianoEnabled && keyboardKeys.isKey(event.key))
            pianoRack.unhighlight(keyboardKeys[event.key] + keyboardOctave);
    });

});