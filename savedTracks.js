function program() {
    $("#saved-tracks-window").hide();

    savedTracks = {
        
    }

    function constructSavedTracks() {

    }

    $("#saved-tracks-selection-button").click(function() {
        console.log("toggle saved tracks visibility");
        $("#saved-tracks-window").toggle();
    });
}

$(document).ready(program);