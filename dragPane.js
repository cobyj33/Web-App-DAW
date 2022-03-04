function run() {
    var isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let mouseXOffset = 0;
    let mouseYOffset = 0;

    function updateMouse(mouseEvent) {
      mouseX = mouseEvent.clientX;
      mouseY = mouseEvent.clientY;
    }

    function dragPane(pane, selector) {
        if (isMouseDown) {
          let nextX = mouseX - mouseXOffset;
          let nextY = mouseY - mouseYOffset;

          if (nextX > 0 && nextX < window.innerWidth - $(selector).width()) {
            pane.style.left = String(nextX) + "px";
          } else if (nextX < 0) {
            pane.style.left = "0px";
          } else if (nextX > window.innerWidth - $(selector).width()) {
            pane.style.left = String(window.innerWidth - $(selector).width()) + "px";
          }

          if (nextY > 0 && nextY < window.innerHeight - $(selector).height()) {
            pane.style.top = String(nextY) + "px";
          } else if (nextY < 0) {
            pane.style.top = "0px";
          } else if (nextY > window.innerHeight - $(selector).height()) {
            pane.style.top = String(window.innerHeight - $(selector).height()) + "px";
          }

          window.setTimeout(function() { dragPane(pane, selector) }, 10);
          return;
        }
    }

    $(".dragPane .dragSelector").mousedown(function(e) {
      if ($(e.target).is('input, button')) {
        return;
      }


      window.addEventListener('mousemove', updateMouse);
      updateMouse(e);
      isMouseDown = true;
      let offset = $(this).parent().offset();
      mouseXOffset = Math.abs(offset.left - $(window).scrollLeft() - mouseX);
      mouseYOffset = Math.abs(offset.top - $(window).scrollTop() - mouseY);

      dragPane($(this).parent()[0], $(this)[0]);
    });

    window.addEventListener('mouseup', function() {
      isMouseDown = false;
      window.removeEventListener('mousemove', updateMouse);
    });
  
  }

$(window).on('load', run);