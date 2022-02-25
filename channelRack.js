const selectionColor = "rgb(255, 255, 255)";
let columnSize = 10; //pixels

function program() {
    console.log("Hello");
    $("#channelRack").hide();
    $("#channelRack .topBar .closeButton").click(function() {
      $("#channelRack").hide();
    });

    function getColumnSize() {
      return $("#channelRack").width() / (measuresVisible * 4);
    }

    const measuresVisible = 6;
  
    channelRack = {
      beatsOnRack: 6, //In measures
      notes: [],
      sounds: [createSound("Kick", "kick.mp3"),
        createSound("clap", "clap.mp3"),
        createSound("snare", "snare.mp3"),
        createSound("HiHat", "hihat.mp3")],
      currentTick: 0,
      looping: false,
      playing: false,
      metronome: false,

      get trackLength() {
        let max = 0;
        for (let i = 0; i < this.notes.length; i++) {
          if (this.notes[i].tick > max) {
            max = this.notes[i].tick;
          }
        }
        if (max % 4 != 0) {
          max += 4 - max % 4;
        }
        return max;
      },

      addSound: function(soundName, src) {
        this.sounds.push(createSound(soundName, src))
      },

      selectArea: function({sound, tick}) {
        let newNote = createNote(sound, tick);
        newNote.play();
        this.notes.push(createNote(sound, tick));
      },

      deselectArea: function(note) {
        if (this.isAreaSelected(note)) {
          for (let i = 0; i < this.notes.length; i++) {
            if (this.notes[i].sound == note.sound && this.notes[i].tick == note.tick) {
              this.notes.splice(i, 1);
              break;
            }
          }
        }
      },

      toggleArea: function(note) {
        if (this.isAreaSelected(note)) {
          this.deselectArea(note);
        } else {
          this.selectArea(note);
        }
      },

      isAreaSelected: function({sound, tick}) {
        for (let i = 0; i < this.notes.length; i++) {
          if (this.notes[i].sound == sound && this.notes[i].tick == tick) {
            return true;
          }
        }
        return false;
      },

      playIfFinished: function() {
        if (!this.playing) {
          this.currentTick = 1;
          this.playTrack();
        }
      },

      pause: function() {
        this.playing = false;
      },

      restart: function() {
        this.playing = false;
        setTimeout(function() {
          channelRack.currentTick = 1;
          channelRack.playTrack();
        }, getTickSpeed() + 1);
      },

      playTrack: function() {
        if (this.playing || this.notes.length == 0) {
          return;
        }
        this.playing = true;
        console.log(this.playing);
        let queue = [...this.notes].sort((a, b) => a.tick - b.tick)
        queue = queue.filter((note) => { return note.tick >= this.currentTick} );
        let maxTime = this.trackLength;
        let tickTime = getTickSpeed();
        playbackLoop();

        function showPlayLine(cell) {
          if (cell.get(0).style.backgroundColor == "") {
            cell.css('background-color', 'green');
          }
        }

        function removePlayLine(cell) {
          if (cell.get(0).style.backgroundColor == "green") {
            cell.css('background-color', '');
          }
        }

        function playbackLoop() { 
          let {currentTick} = channelRack;
          $(`#channelRack table tr td:nth-of-type(${currentTick + 1})`).each(function() { showPlayLine( $(this) )});
          $(`#channelRack table tr td:nth-of-type(${currentTick})`).each(function() { removePlayLine( $(this) )});

          if (!channelRack.playing) {
            $(`#channelRack table tr td`).each(function() { removePlayLine( $(this) )});
            return;
          }
          
          console.log(`tick: ${currentTick} tickTime: ${tickTime}`);
          if (queue.length == 0) {
            if (currentTick <= maxTime) {
              channelRack.currentTick++;
              window.setTimeout( () => playbackLoop(), tickTime);
              return;
            } else {
              channelRack.playing = false;
              $(`#channelRack table tr td`).each(function() { removePlayLine( $(this) )});
              if(channelRack.looping) {
                channelRack.currentTick = 1;
                window.setTimeout(() => channelRack.playTrack(), 0);
              }
              return;
            }
          }

          while (queue[0].tick == currentTick) {
            console.log("playing sound");
            queue[0].play();
            queue.shift();
            console.log(`queue length: ${queue.length}`);
            if (queue.length == 0) {
              break;
            }
          }

          channelRack.currentTick++;
          window.setTimeout( () => playbackLoop(channelRack.currentTick), tickTime);
        }
      },

      exportRackInfo: function() {
        return createTrack(notes);
      },

      extend: function(extendAmount) {
        this.beatsOnRack += 1;
        const column = document.createElement("td");
        column.classList.add("endOfRack");
        $(column).css("min-width", `${getColumnSize()}px`);
        $("#channelRack .main table tr").each( function() {
          for (let i = 0; i < 4; i++) {
            $(column).clone().appendTo($(this));
          }
        });
        columnSize = getColumnSize();
        console.log(`column size: ${columnSize}`);

        $("#channelRack .main table tr td").css("min-width", columnSize + "px");
        $(`#channelRack .main table tr td:nth-of-type(n + ${(this.beatsOnRack - 2) * 4 + 1})`).removeClass("endOfRack");
        $("#channelRack .main table tr td:nth-of-type(4n + 1)").css("border-right", "6px solid #222222");
        channelRackEvents();
      }
    }

    function createNoteFromLocation(row, col) {
      return createNote(channelRack.sounds[row], col);
    }
    
    function appendSound() {
      console.log("maybe later");
    }
  
    function constructChannelRack() {
      $("#channelRack").toggle();
      const mainArea = document.querySelector("#channelRack .main");
      const table = document.createElement("table");
      const tablerow = document.createElement("tr");
      const tablecol = document.createElement("td");
      mainArea.innerHTML = "";
      columnSize = getColumnSize();
  
      for (let row = 0; row < channelRack.sounds.length; row++) {
        let currentRow = tablerow.cloneNode(true);
        table.append(currentRow);
        for (let col = 0; col < channelRack.beatsOnRack * 4 + 1; col++) {
          let currentCol = tablecol.cloneNode(true);
          $(currentCol).css("min-width", columnSize + "px");
          
          if (col == 0) {
            const instrumentName = document.createElement("h2");
            instrumentName.innerText = channelRack.sounds[row].name;
            instrumentName.classList.add("instrumentName");
            currentCol.append(instrumentName);
          }

          if (col >= (channelRack.beatsOnRack - 1) * 4) {
            // $(currentCol).addClass("endOfRack");
            currentCol.classList.add("endOfRack");
          }


          currentRow.append(currentCol);
        }
      }
      mainArea.append(table);
      applyDefaultCSS();
      function applyDefaultCSS() {
        $("#channelRack .main table tr td:nth-of-type(4n + 1)").css("border-right", "6px solid #222222");

        $("#channelRack .main table tr td").each(function() {
          let row = $(this).parent().index();
          let col = $(this).index();
          if (channelRack.isAreaSelected(createNoteFromLocation(row, col))) {
            $(this).css('background-color', '#FFFFFF');
          }
        });

        $("#channelRack .main table tr td:nth-of-type(1)").css({
          "position": "sticky",
          "left": "0"
        });

        $("*").attr("draggable", "false");

        $("#channelRack").css({
          "top": "40%",
          "left": "10%"
        });
      }
      

    }

    let mouseIsDown = false;
    window.addEventListener('mouseup', () => mouseIsDown = false);
    window.addEventListener('dragend', () => mouseIsDown = false);
    function channelRackEvents() {
      
        $("#channelRack .main table tr td:nth-of-type(0)").off();
        $("#channelRack .main table tr td:nth-of-type(0)").mousedown(function() {
          const tableName = $(this);
          $(this).innerHTML = '';
          $(this).innerHTML = '<input type="text" placeholder="ins Name">';
          $(this).find("input").change(function() {

          })

          $(this).find("input").onkeydown(function(e) {
            let key = e.key;
            if (key == "Enter") {
              tableName.innerHTML = '';
              getSoundFromRow($(tableName).parent().index()) = $(this).value;
              tableName.innerHTML = $(this).value;
            }
          });
      });

      function channelRackInput(cell) {
        let row = $(cell).parent().index();
        let col = $(cell).index();
        console.log(` clicked ${row} ${col}`);
        if (col <= 0) {
          return;
        }

        let selectedNote = createNoteFromLocation(row, col);

        channelRack.toggleArea(selectedNote);

        if (channelRack.isAreaSelected(selectedNote)) {
          $(cell).css('background-color', '#FFFFFF');
        } else {
          $(cell).css('background-color', '');
        }

        if (col > (channelRack.beatsOnRack - 1) * 4) {
          channelRack.extend();
        }
      } 
      
      $("#channelRack .main table tr td").off();
      $("#channelRack .main table tr td").mousedown(function() {
        mouseIsDown = true;
        channelRackInput(this);
      });

      $("#channelRack .main table tr td").mouseenter(function() {
        if (mouseIsDown) {
          channelRackInput(this);
        }
      });

      $("#channelRack .main").mouseleave(function() {
        mouseIsDown = false;
      });



      $("#channelRack .bottomBar .addSoundButton").click(function() {

      });
    }

    function channelRackPlayAction() {
      if (channelRack.playing) {
        channelRack.pause();
      } else if (channelRack.currentTick < channelRack.trackLength) {
        channelRack.playTrack();
      } else if (channelRack.currentTick >= channelRack.trackLength) {
        channelRack.currentTick = 1;
        channelRack.playTrack();
      }
    }
  
    //Standard Key Binding
    window.onkeydown = keyPressed;
    function keyPressed(event) {
      let keyCode = event.code;
      if (keyCode == "KeyC") {
        constructChannelRack();
        channelRackEvents();
        initializeButtonEvents();
      } else if (keyCode == "Space") {
        channelRackPlayAction();
      }
      console.log("Key Pressed " + keyCode);
    }

    function initializeButtonEvents() {
      console.log("button events initialized");
      $("#channelRack-loopButton").click(function() {
        $(this).blur();
        console.log("loop button clicked");
        channelRack.looping = !channelRack.looping;
        if (channelRack.looping) {
          $(this).addClass("on");
        } else {
          $(this).removeClass("on");
        }
      });

      $('#channelRack_playButton').click(function() {
        channelRackPlayAction();
      });

      $('#channelRack_stopButton').click(function() {
        channelRack.playing = false;
        window.setTimeout(() => channelRack.currentTick = 1, getTickSpeed());
      });

      $('#channelRack_resetButton').click(function() {
        channelRack.restart();
      });

      $('#channelRack-saveButton').click(function() {
        console.log(channelRack.exportRackInfo());
      });

      $("#channelRack .bottomBar .addSoundButton").click(() => appendSound());
    }
  
    constructChannelRack();
    channelRackEvents();
    initializeButtonEvents();

    $("#channel-rack-selection-button").click(function() {
        $(this).blur();
        constructChannelRack();
        channelRackEvents();
        initializeButtonEvents();
    });
}
  
$(window).on('load', program);