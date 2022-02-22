function run() {
    var isMouseDown = false;
    let draggingPane = null;
    let isDraggingPane = false;
    let mouseX = 0;
    let mouseY = 0;
    
    $(".dragPane .dragSelector").mousemove(function(e) {
        console.log("moving mouse in selector");
      if (isMouseDown && !isDraggingPane) {
        console.log("Dragging pane");
        isDraggingPane = true;
        dragPane($(this).parent()[0], $(this)[0]);
      }
    });

    function dragPane(pane, selector) {
        if (isMouseDown) {
          pane.style.left = String(mouseX - $(selector).width() / 2) + "px";
          pane.style.top = String(mouseY - $(selector).height() / 2) + "px";
          window.setTimeout(function() { dragPane(pane, selector) }, 10);
          return;
        }
    }
  
    window.onmousedown = function() {
      isMouseDown = true;
    };
  
    window.onmouseup = function() {
      isMouseDown = false;
      isDraggingPane = false;
    };

    window.onmousemove = function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
  
    console.log("Program begun");
  }

$(window).on('load', run);