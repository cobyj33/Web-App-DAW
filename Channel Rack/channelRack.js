const selectionColor = "rgb(255, 255, 255)";
let columnSize = 10; //pixels

function program() {
    $("#channelRack").hide();

    function getColumnSize() {
      return $("#channelRack").width() / (beatsVisible * 4);
    }

    const beatsVisible = 6;
  
    channelRack = {
      beatsOnRack: 6, 
      notes: [],
      sounds: [new Sound("Kick", "Sounds/kick.mp3"),
        new Sound("Clap", "Sounds/clap.mp3"),
        new Sound("Snare", "Sounds/snare.mp3"),
        new Sound("HiHat", "Sounds/hihat.mp3")],
      currentTick: 1,
      looping: false,
      playing: false,
      metronome: false,

      get patternLength() {
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
        this.sounds.push(new Sound(soundName, src))
      },

      selectArea: function({sound, tick}) {
        let newNote = new Note(sound, tick);
        newNote.play();
        this.currentTick = 1;
        this.notes.push(newNote);
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
          this.playPattern();
        }
      },

      pause: function() {
        this.playing = false;
      },

      restart: function() {
        this.playing = false;
        setTimeout(function() {
          channelRack.currentTick = 1;
          channelRack.playPattern();
        }, getTickSpeed() + 1);
      },

      playPattern: function() {
        if (this.playing || this.notes.length == 0) {
          return;
        }
        this.playing = true;
        let queue = [...this.notes].sort((a, b) => a.tick - b.tick)
        queue = queue.filter((note) => { return note.tick >= this.currentTick} );
        let maxTime = this.patternLength;
        let tickTime = getTickSpeed();

        let startTime = Date.now();
        let desiredTime = 0;
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
                window.setTimeout(() => channelRack.playPattern(), 0);
              }
              return;
            }
          }

          while (queue[0].tick == currentTick) {
            queue[0].play();
            queue.shift();
            if (queue.length == 0) {
              break;
            }
          }

          let diff = (Date.now() - startTime) - desiredTime;
          console.log(`diff: ${diff}`);
          channelRack.currentTick++;
          desiredTime += tickTime;
          window.setTimeout( () => playbackLoop(), (tickTime - diff));
        }
      },

      getPattern: function() {
        if (this.notes.length == 0) {
          console.log("cannot get empty pattern");
          return;
        }

        let currentPattern = new Pattern(this.notes);
        currentPattern.name = document.getElementById("channel-rack-name-input").value;
        if (currentPattern.name == "") {
          currentPattern.name = `New Pattern #${savedPatterns.patterns.length + 1}`;
        }

        return currentPattern;
      },

      extend: function(extendAmount) {
        this.beatsOnRack += 1;
        const column = document.createElement("td");
        column.classList.add("endOfRack");
        $("#channelRack .main table tr .endOfRack").each(function() {
          this.classList.remove("endOfRack");
        });

        $(column).css("min-width", `${getColumnSize()}px`);
        $("#channelRack .main table tr").each( function() {
          for (let i = 0; i < 4; i++) {
            $(column).clone().appendTo($(this));
          }
        });
        columnSize = getColumnSize();

        $("#channelRack .main table tr td").css("min-width", columnSize + "px");
        $("#channelRack .main table tr td:nth-of-type(4n + 1)").css("border-right", "6px solid #222222");
        channelRackEvents();
      },

      clear: function() {
        this.notes = [];
        $("#channelRack .main table tr td").css("background-color", '');
      }
    }

    function createNoteFromLocation(row, col) {
      return new Note(channelRack.sounds[row], col);
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
      
      $(mainArea).find("table").remove();

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

          if (col >= (channelRack.beatsOnRack - 1) * 4 + 1) {
            // $(currentCol).addClass("endOfRack");
            currentCol.classList.add("endOfRack");
          }


          currentRow.append(currentCol);
        }
      }

      mainArea.append(table);
      let applyDefaultCSS = function() {

        $("#channelRack .main table tr td:nth-of-type(4n + 1)").css("border-right", "6px solid #222222");
        $("#channelRack .main table tr td:nth-of-type(16n + 1)").css("border-right", "6px solid black");

        $("#channelRack .main table tr td").each(function() {
          let row = $(this).parent().index();
          let col = $(this).index();
          if (channelRack.isAreaSelected(createNoteFromLocation(row, col))) {
            $(this).css('background-color', '#FFFFFF');
          }
        });

        $("*").attr("draggable", "false");

        $("#channelRack").css({
          "top": "40%",
          "left": "10%"
        });

        let autoScrollerLeftOffset = columnSize + Number($("#channelRack .main tr td:first").css('border-right-width').slice(0, -2));
        $("#channel-rack-autoscroller-left").css("left", autoScrollerLeftOffset + "px");

        
      }();
      
    }

    let mouseIsDown = false;
    let erasing = false;
    window.addEventListener('mouseup', () => { mouseIsDown = false; erasing = false; });
    window.addEventListener('dragend', () => { mouseIsDown = false; erasing = false; });

    function channelRackEvents() {

        $("#channelRack .main *").off();
        $("#channelRack .main table tr td:nth-of-type(1)").mousedown(function() {
          if ($(this).find("input").length > 0) {
            return;
          }

          let tableColumn = this;
          let rowIndex = $(this).parent().index();

          let inputElement = document.createElement('input');
          inputElement.setAttribute("type", "text");
          inputElement.classList.add("user-input");
          inputElement.style.width = "100px";
          $(this).children().remove();
          $(this).append(inputElement);
          // this.innerHTML = '<input type="text" class="user-input">';
          $(this).find("input").change(function() {
            channelRack.sounds[rowIndex].name = $(this).val();
            $(this).remove();
            const instrumentName = document.createElement("h2");
            instrumentName.innerText = channelRack.sounds[rowIndex].name;
            instrumentName.classList.add("instrumentName");
            $(tableColumn).append(instrumentName);
          });
      });

      function channelRackInput(cell) {
        let row = $(cell).parent().index();
        let col = $(cell).index();
        if (col <= 0) {
          return;
        }

        let selectedNote = createNoteFromLocation(row, col);
        if (erasing) {
          if (channelRack.isAreaSelected(selectedNote)) {
            $(cell).css('background-color', '');
            channelRack.deselectArea(selectedNote);
          }
        } else {
          if (!channelRack.isAreaSelected(selectedNote)) {
            $(cell).css('background-color', '#FFFFFF');
            channelRack.selectArea(selectedNote);
          }
        }
      } 
      
      $("#channelRack .main table tr td").mousedown(function() {
        mouseIsDown = true;
        if ($(this).css("background-color") == "rgb(255, 255, 255)") {
          erasing = true;
        }
        channelRackInput(this);
      });

      $("#channelRack .main table tr td").mouseenter(function() {
        if (mouseIsDown) {
          channelRackInput(this);
        }

        if ($(this).index() > (channelRack.beatsOnRack - 1) * 4) {
          channelRack.extend();
        }
      });

      $("#channelRack .main").mouseleave(function() {
        mouseIsDown = false;
        erasing = false;
      });


      //Auto Scrolling Code 
      let autoScroller = function buildAutoScroller(){
        let scrollPercentage = 0.5;

        let autoScrollingLeft = false;
        let autoScrollingRight = false;
        let scrollDelay = 50;
        let scrollAmount = 10; //px

        function scrollChannelRackLeft() {
          console.log("scroll percentage: " + scrollPercentage);
          let currentLeftScroll = $("#channelRack .main").scrollLeft();
          if (currentLeftScroll - scrollAmount <= 0) {
            $("#channelRack .main").scrollLeft(0);
            $("#channel-rack-autoscroller-left").hide();
            autoScrollingLeft = false;
          } else {
            $("#channelRack .main").scrollLeft(currentLeftScroll - (scrollAmount * scrollPercentage));
          }

          if (autoScrollingLeft) {
            setTimeout( () => scrollChannelRackLeft(), scrollDelay);
          }
        }

        function scrollChannelRackRight() {
          console.log("scroll percentage: " + scrollPercentage);
          let currentLeftScroll = $("#channelRack .main").scrollLeft();
          let maxScrollRight = $("#channelRack .main")[0].scrollWidth - $("#channelRack .main").width();
          if (currentLeftScroll + scrollAmount >= maxScrollRight) {
            channelRack.extend();
          } else {
            $("#channelRack .main").scrollLeft( currentLeftScroll + (scrollAmount * scrollPercentage));
          }

          if (autoScrollingRight) {
            setTimeout( () => scrollChannelRackRight(), scrollDelay);
          }
        }

        $("#channel-rack-autoscroller-right").mouseenter(function() {
          autoScrollingRight = true;
          scrollChannelRackRight();
          $("#channel-rack-autoscroller-left").show();
        });

        $("#channel-rack-autoscroller-right").mouseleave(function() {
          autoScrollingRight = false;
          scrollPercentage = 0.5;
        });

        $("#channel-rack-autoscroller-right").mousemove(function(e) {
          let scrollerOffset = $("#channel-rack-autoscroller-right").offset();
          let distanceFromRight = (e.clientX - scrollerOffset.left);
          scrollPercentage = distanceFromRight / $("#channel-rack-autoscroller-right").width();
        });

        $("#channel-rack-autoscroller-left").mouseenter(function() {
          autoScrollingLeft = true;
          scrollChannelRackLeft();
          $("#channel-rack-autoscroller-right").show();
        });

        $("#channel-rack-autoscroller-left").mouseleave(function() {
          autoScrollingLeft = false;
          scrollPercentage = 0.5;
        });

        $("#channel-rack-autoscroller-left").mousemove(function(e) {
          let scrollerOffset = $("#channel-rack-autoscroller-left").offset();
          let distanceFromLeft = ($("#channel-rack-autoscroller-left").width() - (e.clientX - scrollerOffset.left))
          scrollPercentage = distanceFromLeft / $("#channel-rack-autoscroller-left").width();
        });
      }();


      $("#channelRack .bottomBar .addSoundButton").click(function() {

      });
    }

    function channelRackPlayAction() {
      if (channelRack.playing) {
        channelRack.pause();
      } else if (channelRack.currentTick < channelRack.patternLength) {
        channelRack.playPattern();
      } else if (channelRack.currentTick >= channelRack.patternLength) {
        channelRack.currentTick = 1;
        channelRack.playPattern();
      }
    }
  
    //Standard Key Binding
    window.onkeydown = keyPressed;
    function keyPressed(event) {
      let keyCode = event.code;
      if (keyCode == "Space") {
        channelRackPlayAction();
      }
    }

    function initializeButtonEvents() {
      $("#channelRack button").off();
      $("#channelRack-loopButton").click(function() {
        $(this).blur();
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

      $('#channelRack_clearButton').click(function() {
        channelRack.clear();
      });

      $('#channelRack_stopButton').click(function() {
        channelRack.playing = false;
        window.setTimeout(() => channelRack.currentTick = 1, getTickSpeed());
      });

      $('#channelRack_resetButton').click(function() {
        channelRack.restart();
      });

      $('#channelRack-saveButton').click(function() {
        if (channelRack.getPattern()) {
          savedPatterns.addPattern(channelRack.getPattern());
        }
      });

      $("#channelRack .bottomBar .addSoundButton").click(() => appendSound());

      $("#channelRack .topBar .closeButton").click(function() {
        $("#channelRack").hide();
      });
    }
  
    constructChannelRack();
    channelRackEvents();
    initializeButtonEvents();
    $("#channelRack").hide();

    $("#channel-rack-selection-button").click(function() {
        $(this).blur();
        constructChannelRack();
        channelRackEvents();
        initializeButtonEvents();
    });

    
}
  
$(window).on('load', program);