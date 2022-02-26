
window.addEventListener("load", e => {
    
    

    playlist = {
        patterns: [],
        currentlyPlaying: [],
        currentTick: 1,
        isPlaying: false,
        isLooped: false,
        metronomePlaying: false,

        set currentTime(ms) {
            this.currentTime = ms
        },

        play: function() {

        }, 

        pause: function() {

        },
    }

    function constructPlayList() {
        const playListTable = document.getElementById("playlist-table");
        var playlistRows = 4;
        var playlistCols = 10;
        

        for (let row = 0; row < playlistRows; row++) {
            let currentRow = document.createElement("tr");
            for (let col = 0; col < playlistCols; col++) {
                let currentCol = document.createElement("td");
                // if ((col / 4 | 0) % 2 == 1) {
                //     currentCol.classList.add("dark");
                // }

                currentRow.append(currentCol);
            }
            playListTable.append(currentRow);
        }
    
    }

    // $("#pianoRoll").hide();
    // $("#channelRack").hide();

    
    constructPlayList();
});
