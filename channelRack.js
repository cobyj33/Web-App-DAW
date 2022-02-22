const selectionColor = "rgb(255, 255, 255)";
let columnSize = 10; //pixels

function program() {
    console.log("Hello");
    $("#channelRack").hide();
    $("#channelRack .closeBar .closeButton").click(function() {
      $("#channelRack").hide();
    });
  
    channelRackInfo = {
      visibleBeats: 6, //In measures
      notes: [],
      sounds: [createSound("Kick", "kick.mp3"),
        createSound("clap", "clap.mp3"),
        createSound("snare", "snare.mp3"),
        createSound("HiHat", "hihat.mp3"),
        createSound("Rest", "")],
      currentTick: -1,
      looping: false,
      playing: false,
      metronome: false,

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

      playTrack: function() {
        let queue = [...this.notes].sort((a, b) => a.tick - b.tick)
        console.log(queue); 
        let tickTime = getTickSpeed();
        playbackLoop(0)

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

        function playbackLoop(tick) { 
          $(`#channelRack table tr td:nth-of-type(${tick + 2})`).each(function() { showPlayLine( $(this) )});
          $(`#channelRack table tr td:nth-of-type(${tick + 1})`).each(function() { removePlayLine( $(this) )});
          
          console.log(`tick: ${tick} tickTime: ${tickTime}`);
          if (tick > channelRackInfo.visibleBeats * 4 || queue.length == 0) {
            if (tick % 4 != 0) {
              tick++;
              window.setTimeout( () => playbackLoop(tick), tickTime);
              return;
            } else {
              $(`#channelRack table tr td`).each(function() { removePlayLine( $(this) )});
              if(channelRackInfo.looping) {
                window.setTimeout(() => channelRackInfo.playTrack(), 0);
              }
              return;
            }
          }

          while (queue[0].tick - 1 == tick) {
            console.log("playing sound");
            queue[0].play();
            queue.shift();
            console.log(`queue length: ${queue.length}`);
            if (queue.length == 0) {
              break;
            }
          }

          tick++;
          window.setTimeout( () => playbackLoop(tick), tickTime);
        }
      },

      exportRackInfo: function() {

        track = {
          notes: [...channelRackInfo.notes],
          startingBeat: 0,
          get trackLength() {
            let max = 0;
            for (let i = 0; i < notes.length; i++) {
              if (notes[i].tick > max)
                max = notes[i].tick;
            }
            return max;
          },

          play: function() {
            let tickTime = getTickSpeed();
            let queue = [...this.notes].sort((a, b) => a.tick - b.tick);
            let trackLength = this.trackLength;
            playbackLoop(0);

            function playbackLoop(currentTick) {
              if (currentTick > trackLength || queue.length == 0)
                return;
              
              while (queue[0].tick == currentTick) {
                console.log("playing sound");
                queue[0].play();
                queue.shift();
                if (queue.length == 0) {
                  break;
                }
              }
              
              currentTick++;
              window.setTimeout( () => playbackLoop(currentTick), tickTime);
            }
          }
        }

        return track;
      },

      extend: function(extendAmount) {
        this.visibleBeats += 1;
        const column = document.createElement("td");
        column.classList.add("endOfRack");
        $("#channelRack .main table tr").each( function() {
          for (let i = 0; i < 4; i++) {
            $(column).clone().appendTo($(this));
          }
        });
        columnSize = $("#channelRack").width() / (this.visibleBeats * 4);
        console.log(`column size: ${columnSize}`);

        $("#channelRack .main table tr td").css("min-width", columnSize + "px");
        $(`#channelRack .main table tr td:nth-of-type(n + ${(this.visibleBeats - 2) * 4 + 1})`).removeClass("endOfRack");
        $("#channelRack .main table tr td:nth-of-type(4n + 1)").css("border-right", "6px solid #222222");
        channelRackEvents();
      }
    }

    function createNoteFromLocation(row, col) {
      return createNote(channelRackInfo.sounds[row], col);
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
      columnSize = $("#channelRack").width() / (channelRackInfo.visibleBeats * 4);
  
      for (let row = 0; row < channelRackInfo.sounds.length; row++) {
        let currentRow = tablerow.cloneNode(true);
        table.append(currentRow);
        for (let col = 0; col < channelRackInfo.visibleBeats * 4 + 1; col++) {
          let currentCol = tablecol.cloneNode(true);
          $(currentCol).css("min-width", columnSize + "px");
          
          if (col == 0) {
            const instrumentName = document.createElement("h2");
            instrumentName.innerText = channelRackInfo.sounds[row].name;
            instrumentName.classList.add("instrumentName");
            currentCol.append(instrumentName);
          }

          if (col >= (channelRackInfo.visibleBeats - 1) * 4) {
            // $(currentCol).addClass("endOfRack");
            currentCol.classList.add("endOfRack");
          }


          currentRow.append(currentCol);
        }
      }
      mainArea.append(table);
      $("#channelRack .main table tr td:nth-of-type(4n + 1)").css("border-right", "6px solid #222222");
      $("#channelRack .main table tr td").each(function() {
        let row = $(this).parent().index();
        let col = $(this).index();
        if (channelRackInfo.isAreaSelected(createNoteFromLocation(row, col))) {
          $(this).css('background-color', '#FFFFFF');
        }
      });

    }

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
      
      $("#channelRack .main table tr td").off();
      $("#channelRack .main table tr td").mousedown(function() {
        let row = $(this).parent().index();
        let col = $(this).index();
        console.log(` clicked ${row} ${col}`);
        if (col <= 0) {
          return;
        }

        let selectedNote = createNoteFromLocation(row, col);

        channelRackInfo.toggleArea(selectedNote);

        if (channelRackInfo.isAreaSelected(selectedNote)) {
          $(this).css('background-color', '#FFFFFF');
        } else {
          $(this).css('background-color', '');
        }

        if (col > (channelRackInfo.visibleBeats - 1) * 4) {
          channelRackInfo.extend();
        }
        
      });

      $("#channelRack .bottomBar .addSoundButton").click(function() {

      });
    }
  
    //Standard Key Binding
    function keyPressed(event) {
      let keyCode = event.code;
      if (keyCode == "KeyC") {
        constructChannelRack();
        channelRackEvents();
        initializeButtonEvents();
      } else if (keyCode == "Space") {
        channelRackInfo.playTrack();
      }
      console.log("Key Pressed " + keyCode);
    }
  
    window.onkeydown = function(event) {
      keyPressed(event);
    }

    function initializeButtonEvents() {
      console.log("button events initialized");
      $("#channelRack-loopButton").click(function() {
        $(this).blur();
        console.log("loop button clicked");
        channelRackInfo.looping = !channelRackInfo.looping;
        if (channelRackInfo.looping) {
          $(this).addClass("on");
        } else {
          $(this).removeClass("on");
        }
      });

      $('#channelRack_playButton').click(function() {

      });

      $('#channelRack_stopButton').click(function() {

      });

      $('#channelRack_resetButton').click(function() {

      });

      $('#channelRack-saveButton').click(function() {
        console.log(channelRackInfo.exportRackInfo());
      });

      $("#channelRack .bottomBar .addSoundButton").click(() => appendSound());
    }
  
    constructChannelRack();
    channelRackEvents();
    initializeButtonEvents();

    $("#channel-rack-selection-button").click(function() {
        $(this).blur();
        console.log("i hate javascript");
        constructChannelRack();
        channelRackEvents();
        initializeButtonEvents();
    });
}
  
$(window).on('load', program);