// var keyboardPianoEnabled = false;
// let keyboardOctave = 4;
// const keyboardKeys = {
//     "z": "C",
//     "s": "C#",
//     "x": "D",
//     "c": "D#",
//     "f": "E",
//     "v": "F",
//     "g": "F#",
//     "b": "G",
//     "n": "G#",
//     "j": "A",
//     "m": "A#",
//     "k": "B",

//     isKey: function(key) {
//         if (Object.keys(this).includes(key)) {
//             return true;
//         }
//         return false;
//     },

//     isDigit: function(key) {
//         if (isNaN(parseInt(key))) {
//             return false;
//         }
//         return true;
//     }
// }


// $(window).on('load', function() {

//     let keyboardPiano = function(key) {
//         console.log(key);
//         if (keyboardKeys.isDigit(key)) {
//             keyboardOctave = parseInt(key);
//         } else if (keyboardKeys.isKey(key)) {
//             const sampler = new Tone.Sampler({
//                 urls: {
//                     C4: "../Sounds/kick.mp3"
//                 },
//                 onload: function() {
//                     console.log('sound loaded');
//                     sampler.triggerAttackRelease(keyboardKeys[key] + keyboardOctave, 0.5)
//                 },
//             }).toDestination();
//         }
//     };

//     $(window).on('keypress', function(event) {
//         if (keyboardPianoEnabled) {
//             keyboardPiano(event.key)
//         }
//     });

// });