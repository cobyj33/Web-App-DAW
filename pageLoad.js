$("#page-load").show();
$(window).on('load', function() {
    $("#load-prompt").text('Waiting on Audio Context...');
    Tone.loaded()
    .then(() => {
        let fadeTime = 2000;
        let percentage = 1;
        $("#page-load").fadeOut(fadeTime);
        $("#load-prompt").css('color', '');
        let id = window.setInterval(() => {
            $("#load-prompt").text(`Loading... ${percentage}%`);
            $("#load-percentage").css("width", `${++percentage}%`);
        }, fadeTime / 100);

        window.setTimeout(() => window.clearInterval(id), fadeTime);
    })
    .catch(function(error) {
        $("#load-prompt").text(`${error.message}`);
        $("#load-prompt").css('color', 'red');
        console.error(error);
    });
})