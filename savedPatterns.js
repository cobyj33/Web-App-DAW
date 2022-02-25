var savedPatterns = {
    patterns: [],

    addPattern: function(pattern) {
        if (pattern.name == "") {
            pattern.name = `New Pattern #${this.patterns.length + 1}`;
        }
        this.patterns.push(pattern);
        program.addPattern();
    },

    removePattern: function(name) {

    },
}

function savedPatternsProgram() {
    $("#saved-patterns-window").hide();
    $(".pattern-edit-dropdown").hide();

    function constructSavedPatterns() {
        const savedPatternsDisplay = document.getElementById("saved-patterns");
        for (let i = 0; i < savedPatterns.patterns.length; i++) {
            const patternInstance = makeDisplayFromPattern(savedPatterns.patterns[i]);
            savedPatternsDisplay.append(patternInstance);
        }
    }

    function makeDisplayFromPattern(pattern) {
        const newPatternInstance = document.createElement("div");
        newPatternInstance.classList.add("pattern-instance");
        
        const patternEditArea = makeEditDropDown();
        const visualizer = makeVisualizerFromPattern(pattern);
        
        const title = document.createElement("h2");
        title.classList.add("pattern-title");
        title.innerText = pattern.name;

        const info = makePatternInfo(pattern);

        const interact = makePatternInteractionArea();

        
        newPatternInstance.append(patternEditArea);
        newPatternInstance.append(visualizer);
        newPatternInstance.append(title);
        newPatternInstance.append(info);
        newPatternInstance.append(interact);
        return newPatternInstance;
    }

    function makeVisualizerFromPattern(pattern) {
        const visualizer = document.createElement("div");
        visualizer.classList.add("pattern-visualizer");

        return visualizer;
    }



    function makeEditDropDown() {
        const patternEditArea = createElementWithClasses("div", ["pattern-edit-area"]);
        const patternEditButton = createElementWithClasses("button", ["pattern-edit-button"]);
        const patternEditDropDown = createElementWithClasses("div", ["pattern-edit-dropdown"]);
    }

    function makePatternInteractionArea() {
        const patternInteract = document.createElement("div");
        const playButton = document.createElement()
    }

    function makePatternInfo() {

    }

    function addPattern() {

    }

    function removePattern(index) {

    }

    this.addPattern = addPattern;
    this.removePattern = removePattern;

    function toggleVisibility() {
        $("#saved-patterns-window").toggle();
    }

    console.log("in saved patterns");
    $("#saved-patterns-selection-button").click(toggleVisibility);
    $("#saved-patterns-close-button").click(toggleVisibility);
    $(".pattern-edit-button").click(function() {
        console.log("clicked");
        $(this).parent().find(".pattern-edit-dropdown").toggle();
    });
}

$(window).on('load', savedPatternsProgram);