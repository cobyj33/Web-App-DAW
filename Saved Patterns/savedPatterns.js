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

    get length() {
        return this.patterns.length;
    },

    addPattern: function(pattern) {
        if (pattern.name == "") {
            pattern.name = `New Pattern #${this.patterns.length + 1}`;
        }
        this.patterns.push(pattern);
        constructSavedPatterns();
    },

    exportJSON: function() {
        return JSON.stringify(this.patterns);
    },

    importJSON: function(patternJSON) { 
        this.patterns = [];
        patternJSON.forEach(pattern => {
            let conversion = makePatternFromJSONObject(pattern);
            this.addPattern(conversion);
        });
    },
}



let constructSavedPatterns = function() {
        const savedPatternsDisplay = document.getElementById("saved-patterns");

        let makeDisplayFromPattern = function(pattern) {
    const patternInstance = document.createElement("div");
    patternInstance.classList.add("pattern-instance");
    patternInstance.insertAdjacentHTML('beforeend', createPatternHTML(pattern));

    return patternInstance;
        }

        let appendVisualizer = function(pattern, patternInstance) {
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
        
        while (savedPatternsDisplay.firstChild) {
            savedPatternsDisplay.removeChild(savedPatternsDisplay.lastChild);
        }

        let selectedTrackText = 'N/A'
        if (selectedPattern) {
            selectedTrackText = selectedPattern.name;
        }
        document.getElementById("current-selected-track").innerText = `Currently Selected: ${selectedTrackText}`;

        for (let i = 0; i < savedPatterns.patterns.length; i++) {
            let patternInstance = makeDisplayFromPattern(savedPatterns.patterns[i]);
            if (savedPatterns.patterns[i] == selectedPattern) {
                $(patternInstance).find('.pattern-select-button').addClass("selected-pattern");
            }

            appendVisualizer(savedPatterns.patterns[i], patternInstance);
            savedPatternsDisplay.append(patternInstance);
        }

        let savedPatternInstanceEvents = function() {
            $("#saved-patterns *").off();
            $(".pattern-edit-dropdown").hide();
            
            $(".pattern-edit-button").click(function() {
                $(this).parent().find(".pattern-edit-dropdown").toggle();
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

            $(".pattern-time-manager input").on('input', function() {
                getPatternOfElement(this).playing = false;
                $(".pattern-time-manager p").text(`Tick ${$(this).val()} / ${$(this).attr('max')}`);
            });

            $(".pattern-time-manager input").on('change', function() {
                let currentPattern = getPatternOfElement(this);
                $(".pattern-time-manager p").text(`Tick ${$(this).val()} / ${$(this).attr('max')}`);
                currentPattern.currentTick = $(this).val();
                currentPattern.playing = false;
                setTimeout(() => currentPattern.play(), getTickSpeed());
            });

            $(".pattern-select-button").click(function() {
                $(".pattern-select-button").removeClass('selected-pattern');
                if (_.isEqual(selectedPattern, getPatternOfElement(this))) {
                    selectedPattern = undefined;
                    $(this).removeClass('selected-pattern');
                    $("#current-selected-track").text(`Currently Selected: N/A`);
                } else {
                    selectedPattern = getPatternOfElement(this);
                    $(this).addClass('selected-pattern');
                    $("#current-selected-track").text(`Currently Selected: ${selectedPattern.name}`);
                }
            });
        }();
    }

let playPattern = function(pattern, patternInstance) {
        if (pattern.playing) {
            console.log("Cannot play pattern: Already playing");
            return;
        }
        pattern.play();

        let currentVisualizer = $(patternInstance).find(".pattern-visualizer")[0];
        let visualizingRow = $(currentVisualizer).find('tr:nth-of-type(1)');
        let timeSlider = $(patternInstance).find(".pattern-time-manager input");
        let timeText = $(patternInstance).find(".pattern-time-manager p");
        let startTime = Date.now();
        let desiredTime = 0;
        let tickTime = getTickSpeed();
        let maxTick = $(patternInstance).find(".pattern-time-manager input").attr('max');
        visualize();
        function visualize() {
            timeSlider.val(pattern.currentTick);
            timeText.text(`Tick ${pattern.currentTick} / ${maxTick}`);
            let currentNotes = [...pattern.currentlyPlaying];
            console.log(currentNotes);
            $(visualizingRow).children().removeClass("visualizing");
            
            for (let i = 0; i < currentNotes.length; i++) {
                let soundName = currentNotes[i].sound.name;
                let columnIndex = $(currentVisualizer).find(`.sound-${soundName}`).index();
                $(visualizingRow).find(`td:nth-of-type(${columnIndex + 1})`).addClass("visualizing");
            }  

            if (pattern.playing) {
                let diff = (Date.now() - startTime) - desiredTime;
                desiredTime += tickTime;
                window.setTimeout( () => visualize(), (tickTime - diff));
            } else {
                $(visualizingRow).children().removeClass("visualizing");
            }
        }
    };

let getPatternOfElement = function(element) {
        let instance = $(element).parents(".pattern-instance")[0];
        if (instance) {
            return savedPatterns.patterns[$(instance).index()];
        }
    };

    let toggleVisibility = function() {
        $("#saved-patterns-window").toggle();
        if ($("#saved-patterns-window").is(":visible")) {
            constructSavedPatterns();
        }
    }

var makePatternFromJSONObject = function(jsonObject) {
    let notes = [];
    jsonObject.notes.forEach(note => {
        notes.push(new Note(new Sound(note.sound.name, note.sound.source), note.tick));
    });
    let pattern = new Pattern(notes);
    pattern.name = jsonObject.name;
    console.log(pattern);
    return pattern;
}

$(window).on('load', function() {
    $("#saved-patterns-window").hide();
    fetch("Saved Patterns/basicPatterns.json")
        .then(file => {return file.json()})
        .then(patterns => patterns.forEach( function(pattern) {
            let conversion = makePatternFromJSONObject(pattern);
            savedPatterns.addPattern(conversion);
        }))
        .then(() => savedPatternsProgram())
        .catch(error => {
            console.log('could not load default patterns');
            console.error(error);
            savedPatternsProgram();
        });
});

let savedPatternsProgram = function() {
    $("#saved-patterns-window").hide();
    $(".pattern-edit-dropdown").hide();
    $("#saved-patterns-close-button").click(toggleVisibility);
    constructSavedPatterns();
    $("#saved-patterns-selection-button").click(toggleVisibility);
}