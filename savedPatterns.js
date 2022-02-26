function createPatternHTML(pattern) {
    return `
            <div class="pattern-edit-area">
                <button class="pattern-edit-button"> ^ </button>
                <div class="pattern-edit-dropdown">
                    <button type="button" class="pattern-change-name-button"> Change Name </button>
                    <button type="button" class="pattern-remove-button"> Remove Pattern </button>
                </div>
            </div>

            <table class="pattern-visualizer">
                <!-- Added dynamically -->
            </table>

            <h2 class="pattern-title"> ${pattern.name} </h2>
            <div class="pattern-info">
                <h3> Length: ${pattern.patternLength} </h3>
                <h3> Notes: ${pattern.notes.length} </h3>
            </div>
            <div class="pattern-interact">
                <div class="pattern-time-manager">
                    <input type="range" min="1" max="${pattern.patternLength}">
                    <p style="color: white;"> Tick 1 / ${pattern.patternLength} </p>
                </div>
                <button type="button" class="windowSelectionButton pattern-play-button"> Play </button>
                <button type="button" class="windowSelectionButton pattern-select-button"> Select </button>
            </div>
`
}


var savedPatterns = {
    patterns: [],

    addPattern: function(pattern) {
        if (pattern.name == "") {
            pattern.name = `New Pattern #${this.patterns.length + 1}`;
        }
        this.patterns.push(pattern);
    },

    removePattern: function(name) {

    },
}

function savedPatternsProgram() {
    $("#saved-patterns-window").hide();
    $(".pattern-edit-dropdown").hide();
    $("#saved-patterns-close-button").click(toggleVisibility);

    function constructSavedPatterns() {
        const savedPatternsDisplay = document.getElementById("saved-patterns");
        
        while (savedPatternsDisplay.firstChild) {
            savedPatternsDisplay.removeChild(savedPatternsDisplay.lastChild);
        }

        for (let i = 0; i < savedPatterns.patterns.length; i++) {
            let patternInstance = makeDisplayFromPattern(savedPatterns.patterns[i]);
            appendVisualizer(savedPatterns.patterns[i], patternInstance);
            savedPatternsDisplay.append(patternInstance);
        }

        function savedPatternInstanceEvents() {
            $("#saved-patterns *").off();
            $(".pattern-edit-dropdown").hide();
            
            $(".pattern-edit-button").click(function() {
                $(this).parent().find(".pattern-edit-dropdown").toggle();
                if ($(this).parent().find(".pattern-edit-dropdown").is(":visible")) {
                    $(this).css("right", String($(this).parent().width() / 2 - $(this).width() / 2) + "px");
                } else {
                    $(this).css("right", "0px");
                }
            });

            $(".pattern-remove-button").click(function() {
                    let currentPatternInstance = $(this).parents(".pattern-instance")[0]
                    let currentPatternIndex = $(currentPatternInstance).index();
                    $(currentPatternInstance).remove();
                    savedPatterns.patterns.splice(currentPatternIndex, 1);
            });

            $(".pattern-play-button").click(function() {
                playPattern(getPatternOfElement(this), $(this).parents(".pattern-instance")[0]);
            });
        }

        function playPattern(pattern, patternInstance) {
            console.log(JSON.stringify(pattern.notes));
            if (pattern.playing) {
                console.log("Cannot play pattern: Already playing");
                return;
            }
            pattern.play();

            let currentVisualizer = $(patternInstance).find(".pattern-visualizer")[0];
            visualize();
            function visualize() {
                let currentNotes = [...pattern.currentlyPlaying];
                $(currentVisualizer).find("tr td").css("background-color", "");
                $(patternInstance).find(".pattern-time-manager input").val(pattern.currentTick);
                
                for (let i = 0; i < currentNotes.length; i++) {
                    let soundName = currentNotes[i].sound.name;
                    let columnIndex = $(currentVisualizer).find(`.sound-${soundName}`).index();
                    $(currentVisualizer).find(`tr:nth-of-type(1) td:nth-of-type(${columnIndex + 1})`).css("background-color", "white");
                }  

                if (pattern.playing) {
                    window.setTimeout( () => visualize(), getTickSpeed());
                } else {
                    $(currentVisualizer).find("tr td").css("background-color", "");
                }
            }
        }

        function getPatternOfElement(element) {
            let instance = $(element).parents(".pattern-instance")[0];
            if (instance) {
                return savedPatterns.patterns[$(instance).index()];
            }
        }


        savedPatternInstanceEvents();
    }

    function makeDisplayFromPattern(pattern) {
        const patternInstance = document.createElement("div");
        patternInstance.classList.add("pattern-instance");
        patternInstance.insertAdjacentHTML('beforeend', createPatternHTML(pattern));

        return patternInstance;
    }
    
    function appendVisualizer(pattern, patternInstance) {
        const visualizer = $(patternInstance).find(".pattern-visualizer")[0];
        visualizer.append(document.createElement("tr"));
        visualizer.append(document.createElement("tr"));
        let patternSounds = pattern.sounds;
        for (let i = 0; i < patternSounds.length; i++) {
            $(visualizer).find("tr:nth-of-type(1)").append(document.createElement("td"));
            const sound_name = document.createElement("td");
            sound_name.innerText = patternSounds[i].name;
            sound_name.classList.add(`sound-${patternSounds[i].name}`);
            $(visualizer).find("tr:nth-of-type(2)").append(sound_name)
        }
    }

    function addPattern() {
        return null;
    }

    function removePattern(index) {
        return null;
    }

    this.addPattern = addPattern;
    this.removePattern = removePattern;

    function toggleVisibility() {
        $("#saved-patterns-window").toggle();
        if ($("#saved-patterns-window").is(":visible")) {
            constructSavedPatterns();
        }
    }

    $("#saved-patterns-selection-button").click(toggleVisibility);
}

function makePatternFromJSONObject(jsonObject) {
    let notes = [];
    jsonObject.notes.forEach(note => {
        notes.push(new Note(new Sound(note.sound.name, note.sound.source), note.tick));
    });
    let pattern = new Pattern(notes);
    pattern.name = jsonObject.name;
    console.log(pattern);
    return pattern;
}

fetch("basicPatterns.json")
    .then(file => {return file.json()})
    .then(patterns => patterns.forEach( function(pattern) {
        let conversion = makePatternFromJSONObject(pattern);
        savedPatterns.addPattern(conversion);
    }))
    .catch(error => console.log('could not load default patterns'));

$(window).on('load', savedPatternsProgram);