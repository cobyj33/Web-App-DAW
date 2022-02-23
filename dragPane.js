function run() {
    var isMouseDown = false;
    let draggingPane = null;
    let isDraggingPane = false;
    let mouseX = 0;
    let mouseY = 0;
    let mouseXOffset = 0;
    let mouseYOffset = 0;
    
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
          pane.style.left = String(mouseX - mouseXOffset) + "px";
          pane.style.top = String(mouseY - mouseYOffset) + "px";
          window.setTimeout(function() { dragPane(pane, selector) }, 10);
          return;
        }
    }

    $(".dragPane .dragSelector").mousedown(function(e) {
      isMouseDown = true;
      let offset = $(this).parent().offset();
      console.log($(this)[0].style.left);
      mouseXOffset = e.clientX - offset.left;
      mouseYOffset = e.clientY - offset.top;
    });

    window.addEventListener('mouseup', function() {
      isMouseDown = false;
      isDraggingPane = false;
    });

    window.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
  
    console.log("Program begun");
  }

$(window).on('load', run);