
window.addEventListener("load", e => {
    
    /*
    track {
        notes: []
        startingBeat: int
        currentTick: int
        play()
        pause()
        setTime()
        tick()
        get length()
        isPlaying
    }
    */

    playlist = {
        tracks: [],
        currentlyPlaying: [],
        currentTime: 0,
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
        const toolBar = document.querySelector("toolBar");
        const playlist = document.querySelector("playlist");
        const pianoRoll = document.querySelector("pianoRoll");
        const channelRack = document.querySelector("channelRack");

        const playListTable = document.querySelector("#playlistTable");
        var playlistRows = 10;
        var playlistCols = 20;
        
        let playlistRow = document.createElement("tr")
        let playlistCol = document.createElement("td")

        for (let row = 0; row < playlistRows; row++) {
            let currentRow = playlistRow.cloneNode(true);
            currentRow.classList.add("playlistRow");
            for (let col = 0; col < playlistCols; col++) {
                let currentCol = playlistCol.cloneNode(true);
                currentCol.classList.add("playlistCol");
                currentCol.style.borderRadius = "5px";
                currentRow.append(currentCol.cloneNode(true));
            }
            playListTable.append(currentRow.cloneNode(true));
        }
    
    }

    // $("#pianoRoll").hide();
    // $("#channelRack").hide();

    
    constructPlayList();
});
