const radialKey = "KeyE";
const default_Z_Index = 10000;
var mouseX = 0;
var mouseY = 0;

const standardContentSize = 200;
const contentGap = 20;

function contentSize() {
    return Math.min(standardContentSize, window.innerWidth * 0.25, window.innerHeight * 0.25);
}

function updateMouse(mouseEvent) {
        mouseX = mouseEvent.clientX;
        mouseY = mouseEvent.clientY;
    }

function onload() {
    hideContent("#radial-menu")
    let isOpen = false;

    let sizeElements = function() {
        let nodes = $("#radial-menu").children();
        if (nodes.length == 0 ) {
            return;
        }

        let increment = 100 / nodes.length;

        for (let i = 0; i < nodes.length; i++) {
            $(nodes[i]).css({
                "width": `${increment * (i + 1)}%`,
                "height": `${increment * (i + 1)}%`,
                "z-index": `${default_Z_Index + (nodes.length - i)}`
            });

            if ($(nodes[i]).find(".content").length == 0) {
                const content = document.createElement("div");
                content.classList.add("content");
                $(nodes[i]).append(content);
            }
        }

    }();

    function testRadialMenuRequest(keyEvent) {
        if (keyEvent.code == radialKey) {
            if (!$('input').is(":focus")) {
                openRadialMenu();
            }
        }
    }

    
    function openRadialMenu() {
        if (!isOpen) {
            isOpen = true;
            $("#radial-menu").css( {
                "width": "200px",
                "height": "200px",
                "left": `${mouseX - 100}px` ,
                "top": `${mouseY - 100}px`,
            });

            window.addEventListener('keyup', (keyEvent) => {
                if (keyEvent.code == radialKey) {
                    closeRadialMenu();
                }
            });
        }   
    }

    function closeRadialMenu() {
        if (isOpen) {
            isOpen = false;
            hideContent("#radial-menu");
            $("#radial-menu .selected").removeClass("selected");
            $("#radial-menu").css( {
                "width": "0px",
                "height": "0px",
            });
            window.removeEventListener('keyup', closeRadialMenu);
        }
    }

    function loadContent(selection) {
        let leftOffset = $("#radial-menu").offset().left + $("#radial-menu").width() + contentGap;
        let topOffset = $("#radial-menu").offset().top + $("#radial-menu").height() + contentGap;

        if (leftOffset + contentSize() > window.innerWidth) {
            leftOffset = $("#radial-menu").offset().left - contentSize() - contentGap;
        }

        if (topOffset + contentSize() > window.innerHeight) {
            topOffset = $("#radial-menu").offset().top - contentSize() - contentGap;
            if (topOffset < 0) {
                topOffset = $("#radial-menu").offset().top + ( $("#radial-menu").height() - contentSize()) / 2;
            }
        }

        $(selection).find(".content").css({
            "width": `${contentSize()}px`,
            "height": `${contentSize()}px`,
            "left": `${leftOffset}px` ,
            "top": `${topOffset}px`,
            "border": "",
            "padding": "",
            "margin": "",
        });

        let openQuickSelect = function() {
            let quickSelectMenu = document.getElementById("quick-select");
            
            while (quickSelectMenu.firstChild) {
                quickSelectMenu.removeChild(quickSelectMenu.lastChild);
            }
            
            for (let i = 0; i < savedPatterns.length; i++) {
                const button = document.createElement('button');
                button.classList.add('windowSelectionButton');
                button.innerText = savedPatterns.patterns[i].name;
                if (selectedPattern == savedPatterns.patterns[i]) {
                    button.classList.add("selected-pattern");
                }
                $(quickSelectMenu).append(button);
            }

            $(quickSelectMenu).css({
                "height": `${Math.min(contentSize() + $(quickSelectMenu).children().length * 20, 300)}px`
            })

            $("#quick-select button").click(function() {
                selectedPattern = savedPatterns.patterns[$(this).index()];
                $("#quick-select button").removeClass("selected-pattern");
                $(this).addClass("selected-pattern");
            });
        };


        if ($(selection).find("#quick-select").length > 0) {
            openQuickSelect();
        }
    }

    function hideContent(selection) {
        $(selection).find(".content").css({
            "width": "0px",
            "height": "0px",
            "border": "0px",
            "padding": "0px",
            "margin": "0px"
        });
    }

    $(".radial-menu-selection").mouseenter(function() {
        if ($(".radial-menu-selection.selected").length > 0) {
            return;
        }
        loadContent(this);
    });

    $(".radial-menu-selection").mousedown(function() {
        //basically, if clicked inside the radial menu
        if (mouseX > $("#radial-menu").offset().left && mouseX < $("#radial-menu").offset().left + $("#radial-menu").width() && 
        mouseY > $("#radial-menu").offset().top && mouseY < $("#radial-menu").offset().top + $("#radial-menu").height()) {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
                hideContent(this);
            } else {
                hideContent(".radial-menu-selection.selected");
                $(".radial-menu-selection.selected").removeClass("selected");
                this.classList.add("selected");
                loadContent(this);
            }
        }
    });


    $(".radial-menu-selection").mouseleave(function() {
        if (!$(this).hasClass("selected")) {
            hideContent(this);
        }
    });

    
    window.addEventListener('keydown', testRadialMenuRequest);
}

$(window).on('load', onload);
window.addEventListener('mousemove', updateMouse);