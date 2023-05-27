// init playfield
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// init audio player
var audioPlayer = document.getElementById('audioPlayer');
var currentTrackIndex = 0;
var playlist = [];

// time measurement
let startTime; // Variable to store the start time
let elapsedTime = 0; // Variable to store the elapsed time
let isRunning = false; // Variable to indicate whether the timer is currently running

// data
var level = 0;
var gameType = GameType.Pair;
var round = 1;
var difficulty = Difficulty.Introduce; // TODO from file
var gameState = GameState.Start;

var solvedPair = [false, false, false, false];
var helpCounter = 0;

// thinx path to sound files
const gamePath = "games/thinx/thinx/sounds/de/";
var levelDIR = "";

// init the display
var led = [,];
var display = "";

var playButton = new Image();
playButton.src = "gfx/play.png";
var pauseButton = new Image();
pauseButton.src = "gfx/pause.png";

var helpButton = new Image();
helpButton.src = "gfx/help.png";

var startButton = new Image();
var gameMode = new Image();

// hold the background
var backg = new Image();
backg.src = "gfx/thinx.png";

// vars for drag and drop
var move = false;
var moveNo = 0;
var startPos = [0, 0];
var startMouse = [0, 0];

// vars for glow effect
var counter = 0;
var delay = 0;

// set the event listener for the canavas
canvas.addEventListener('touchstart', function (e) {

    //console.log("touchstart")
    handleDownEvent(getTouchPos(canvas, e));

}, false);
canvas.addEventListener('mousedown', function (e) {

    //console.log("mousedown")
    handleDownEvent(getMousePos(canvas, e));

}, false);

canvas.addEventListener('touchmove', function (e) {

    if (move) {
        var mousecoords = getTouchPos(canvas, e);
        moveDrag(mousecoords.x, mousecoords.y);
    }

}, false);
canvas.addEventListener('mousemove', function (e) {

    if (move) {
        var mousecoords = getMousePos(canvas, e);
        moveDrag(mousecoords.x, mousecoords.y);
    }

}, false);

canvas.addEventListener('touchend', function (e) {

    if (move) {
        endDrag();
    }
}, false);
canvas.addEventListener('mouseup', function (e) {

    if (move) {
        endDrag();
    }
}, false);

// set event for the AudioPlayer
audioPlayer.addEventListener('ended', function () {
    playNextTrack();
});

var fields = [];
var stones = [];

// init the fields 
for (i = 0; i < 8; i++) {
    var img = new Image();
    img.src = "gfx/glow1.png";
    fields.push(img);
}

// init the stones 
for (i = 0; i < 8; i++) {
    var img = new Image();
    img.src = "gfx/stone" + (i + 1) + ".png";
    stones.push(img);
}

// disable input
gameState = GameState.Start;

// Retrieving the saved number from local storage
var savedNumber = +localStorage.getItem('yvioLevel_A');
var savedTime = +localStorage.getItem('yvioLevel_A_time');

// restore game to last point
if (savedNumber != null) {
    if (savedNumber == 0) { savedNumber = 1; };
    initLevel(savedNumber);
    elapsedTime = savedTime;

    display = savedNumber.toString();
}
else {
    // new game
    initLevel(1);
    display = "1";
}

// init the level (debug)
//initLevel(6);

// ###########################################################################

function handleDownEvent(mousecoords) {

    if (gameState == GameState.Running) {

        if (checkPosition(mousecoords.x, mousecoords.y, 50, 50)) {
            playHelp();
            return;
        }

        // check for play button
        if (checkPosition(mousecoords.x, mousecoords.y, 50, canvas.height - 50)) {

            stopPlayback();
            const response = confirm("Neues Spiel starten?");

            if (response) {
                // new game
                initLevel(1);
                display = "1";
                // reset timer
                resetTimer();

                gameState = GameState.Start;
                return;
            }        
        }

        // check for pause button
        if (checkPosition(mousecoords.x, mousecoords.y, 160, canvas.height - 50)) {
            gameState = GameState.Pause;
            pauseTimer();
        }

        if (!move) {
            startDrag(mousecoords.x, mousecoords.y)
            return;
        }
    }

    if (gameState == GameState.Pause) {
        // check for pause button
        if (checkPosition(mousecoords.x, mousecoords.y, 120, canvas.height - 50)) {
            gameState = GameState.Running;
            startTimer();
        }
    }

    if (checkPosition(mousecoords.x, mousecoords.y, canvas.width / 2, canvas.height - startButton.height - 10)) {

        if (gameState == GameState.Start ||
            gameState == GameState.Intro ||
            gameState == GameState.Help ||
            gameState == GameState.Solution) {
            if (gameState == GameState.Start) {
                if (level == 1) {
                    playIntro();
                }
                else {
                    playIntroShort();
                }
            }
            else {

                stopPlayback();

                // stop the intro
                if (gameState == GameState.Intro) {

                    level = level - 1;
                    nextLevel();

                    gameState = GameState.Running;

                    startTimer();
                }
                // help is playing - now continue
                if (gameState == GameState.Help) {
                    gameState = GameState.Running;
                }
                // solution - so continue
                if (gameState == GameState.Solution) {

                    nextLevel();
                    gameState = GameState.Running;
                }

                //start the time if paused
                if (!isRunning) {
                    startTimer();
                }
            }
        }
    }

}

function initLevel(selectLevel) {

    // select level
    level = selectLevel;
    round = Math.floor((level - 1) / 3) + 1;
    gameType = level % 3;

    // reset LED display
    display = "";

    // set the stones
    setStones();
    // more dificult if the stones are mixed
    shuffle(stones);
    shuffle(stonePos);

    // set folder
    if (gameType == GameType.Pair) {
        levelDIR = "games/thinx/thinx/sounds/de/p/p_";
    }
    else if (gameType == GameType.Sequence) {
        levelDIR = "games/thinx/thinx/sounds/de/k/k_";
    }
    else if (gameType == GameType.Picture) {
        levelDIR = "games/thinx/thinx/sounds/de/b/b_";
    }
    levelDIR = levelDIR + pad(round, 2) + "/";

    helpCounter = 0;
    solvedPair = [false, false, false, false];

    difficulty = 0;
    if (level > 6) {
        difficulty = Difficulty.Easy;
    }
    if (level > 21) {
        difficulty = Difficulty.Medium;
    }
    if (level > 51) {
        difficulty = Difficulty.Hard;
    }
}

function nextLevel() {
    // fehlende Logik, hier ist erstmal Schluss!
    if (level < 51) {

        level = level + 1;

        if (level > 50) {
            level = level;
        }

        // Saving a number to local storage
        localStorage.setItem('yvioLevel_A', level);
        localStorage.setItem('yvioLevel_A_time', getElapsedTime());

        initLevel(level);
        gameState = GameState.Running;

        difficulty = 0;

        if (level > 6) {
            difficulty = Difficulty.Easy;
        }
        if (level > 21) {
            difficulty = Difficulty.Medium;
        }
        if (level > 51) {
            difficulty = Difficulty.Hard;
        }

        // next difficulty ?
        // TODO from file

        stopPlayback();

        playlist = [];

        // here comes the next
        playlist.push("games/thinx/thinx/sounds/de/quiz_n.wav");

        // if stage reached
        if (level == 7) {
            playlist.push("games/thinx/thinx/sounds/de/reached1.wav");
        }
        if (level == 22) {
            playlist.push("games/thinx/thinx/sounds/de/reached2.wav");
        }
        if (level == 52) {
            playlist.push("games/thinx/thinx/sounds/de/reached3.wav");
        }

        // for pairs
        if (gameType == GameType.Pair) {
            if (difficulty == Difficulty.Introduce) {
                playlist.push("games/thinx/thinx/sounds/de/p/start_0.wav");
            }
            if (difficulty == Difficulty.Easy) {
                playlist.push("games/thinx/thinx/sounds/de/p/start_1.wav");
            }
            if (difficulty == Difficulty.Medium) {
                playlist.push("games/thinx/thinx/sounds/de/p/start_2.wav");
            }
            if (difficulty == Difficulty.Hard) {
                playlist.push("games/thinx/thinx/sounds/de/p/start_3.wav");
            }
        }

        // for sequence
        if (gameType == GameType.Sequence) {
            if (difficulty == Difficulty.Introduce) {
                playlist.push("games/thinx/thinx/sounds/de/k/start_0.wav");
            }
            if (difficulty == Difficulty.Easy) {
                playlist.push("games/thinx/thinx/sounds/de/k/start_1.wav");
            }
            if (difficulty == Difficulty.Medium) {
                playlist.push("games/thinx/thinx/sounds/de/k/start_2.wav");
            }
            if (difficulty == Difficulty.Hard) {
                playlist.push("games/thinx/thinx/sounds/de/k/start_3.wav");
            }
        }

        // for pictures
        if (gameType == GameType.Picture) {
            if (difficulty == Difficulty.Introduce) {
                playlist.push("games/thinx/thinx/sounds/de/b/start_0.wav");
            }
            if (difficulty == Difficulty.Easy) {
                playlist.push("games/thinx/thinx/sounds/de/b/start_1.wav");
            }
            if (difficulty == Difficulty.Medium) {
                playlist.push("games/thinx/thinx/sounds/de/b/start_2.wav");
            }
            if (difficulty == Difficulty.Hard) {
                playlist.push("games/thinx/thinx/sounds/de/b/start_3.wav");
            }
        }

        if (level > 6) {
            if (gameType == GameType.Picture) {
                if (p_StonesCount[round - 1] == 4) { playlist.push("games/thinx/thinx/sounds/de/b/help_c4.wav"); };
                if (p_StonesCount[round - 1] == 5) { playlist.push("games/thinx/thinx/sounds/de/b/help_c5.wav"); };
                if (p_StonesCount[round - 1] == 6) { playlist.push("games/thinx/thinx/sounds/de/b/help_c6.wav"); };
                if (p_StonesCount[round - 1] == 7) { playlist.push("games/thinx/thinx/sounds/de/b/help_c7.wav"); };
                if (p_StonesCount[round - 1] == 8) { playlist.push("games/thinx/thinx/sounds/de/b/help_c8.wav"); };
            }
        }



        playAudio(playlist[currentTrackIndex]);

        display = level.toString();
    }
}

function playIntro() {

    stopPlayback();

    gameState = GameState.Intro;

    playlist = [];
    playlist.push("games/thinx/thinx/sounds/intro.wav");
    playlist.push(gamePath + "intro/i_01.wav");
    playlist.push(gamePath + "intro/i_02.wav");
    playlist.push(gamePath + "p/start_0.wav");

    playAudio(playlist[currentTrackIndex]);
}

function playIntroShort() {

    stopPlayback();

    gameState = GameState.Intro;

    playlist = [];
    playlist.push("games/thinx/thinx/sounds/intro.wav");

    playAudio(playlist[currentTrackIndex]);
}

function playHelp() {

    pauseTimer();
    gameState = GameState.Help;

    stopPlayback();

    playlist = [];
    var listPlay = "";

    if (gameType == GameType.Pair) {
        listPlay = quiz_help_pair_l0[helpCounter];
    }
    else if (gameType == GameType.Sequence) {
        listPlay = quiz_help_sequ_l0[helpCounter];
    }
    else if (gameType == GameType.Picture) {
        listPlay = quiz_help_mix_l0[helpCounter];
    }

    var parts = listPlay.split("|");

    for (i = 0; i < parts.length; i++) {
        if (parts[i] == "%1") { playlist.push(levelDIR + "1.wav"); };
        if (parts[i] == "%2") { playlist.push(levelDIR + "2.wav"); };
        if (parts[i] == "%3") { playlist.push(levelDIR + "3.wav"); };
        if (parts[i] == "%4") { playlist.push(levelDIR + "4.wav"); };
        if (parts[i] == "%5") { playlist.push(levelDIR + "5.wav"); };
        if (parts[i] == "%6") { playlist.push(levelDIR + "6.wav"); };
        if (parts[i] == "%7") { playlist.push(levelDIR + "7.wav"); };
        if (parts[i] == "%8") { playlist.push(levelDIR + "8.wav"); };
        if (parts[i] == "%tip") { playlist.push(levelDIR + "tipp.wav"); };
        if (parts[i].startsWith("??")) { playlist.push(parts[i].replace("??", gamePath)); };
    }

    // play help
    playAudio(playlist[currentTrackIndex]);

    // select next help file
    if (helpCounter < 2) {
        helpCounter++;
    }
    else {
        helpCounter = 0;
    }
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

function arrayRotate(arr) {
    arr.push(arr.shift());
    return arr;
}

function setStones() {
    // calculate the inital stone position
    var radius = 175;
    for (var i = 1; i <= 8; i++) {

        var angle = i * Math.PI / 4;
        var x = Math.cos(angle) * radius + 350;
        var y = Math.sin(angle) * radius + 350;

        stonePos[i - 1][0] = x;
        stonePos[i - 1][1] = y;
    }
}

function startDrag(x, y) {

    for (i = 0; i < 8; i++) {
        // we need to add 50/50 since the position is the upper left corner
        if (checkPosition(x, y, stonePos[i][0] + 50, stonePos[i][1] + 50)) {

            console.log("Select stone " + (i + 1));

            startMouse = [x, y];
            startPos = [stonePos[i][0], stonePos[i][1]]

            move = true;
            moveNo = i;
            return;
        }
    }
}

function moveDrag(x, y) {

    var dif_x = x - startMouse[0];
    var dif_y = y - startMouse[1];

    stonePos[moveNo][0] = startPos[0] + dif_x;
    stonePos[moveNo][1] = startPos[1] + dif_y;
}

function endDrag() {

    // end drag & drop
    move = false;

    // moveNo is the actual stone, now check if stone has placed
    var stoneOnField = false;

    for (i = 0; i < 8; i++) {

        if (checkPosition(stonePos[moveNo][0] + 50, stonePos[moveNo][1] + 50, fieldPos[i][0] + 50, fieldPos[i][1] + 50)) {
            console.log("Stone " + (moveNo + 1) + " has been placed on field " + (i + 1));
            stoneOnField = true;
        }
    }

    // get stones on the fields
    lst = getStonesOnFields();

    // clear LED display
    display = "";

    console.log("--------------------");

    // debug - show stones
    for (i = 0; i < lst.length; i++) {
        console.log(lst[i]);
    }

    console.log("--------------------");
    console.log("Level " + level + " / Round " + round);

    // pairs level 1,4,...
    if (gameType == GameType.Pair) {

        if (stoneOnField) {

            // sort stones
            lst.sort()

            // do we have one or two stones?
            if (getCountStones(lst) <= 2) {

                // correct count of stones
                if (getCountStones(lst) == 2) {
                    if ((lst[6] == 1 && lst[7] == 2) ||
                        (lst[6] == 3 && lst[7] == 4) ||
                        (lst[6] == 5 && lst[7] == 6) ||
                        (lst[6] == 7 && lst[7] == 8)) {

                        if (solvedPair[(lst[7] / 2) - 1] == false) {
                            solvedPair[(lst[7] / 2) - 1] = true;
                            if (solvedPair[0] && solvedPair[1] && solvedPair[2] && solvedPair[3]) {

                                gameState = GameState.Solution;

                                display = "+";
                                stopPlayback();

                                // last match
                                playlist = [];
                                playlist.push(levelDIR + (moveNo + 1) + ".wav");
                                playlist.push("games/thinx/thinx/sounds/de/p/last.wav");

                                if (moveNo % 2) {
                                    playlist.push(levelDIR + (moveNo) + ".wav");
                                    playlist.push(levelDIR + (moveNo + 1) + ".wav");
                                }
                                else {
                                    playlist.push(levelDIR + (moveNo + 1) + ".wav");
                                    playlist.push(levelDIR + (moveNo + 2) + ".wav");
                                }
                                playlist.push(levelDIR + "tipp.wav");

                                playAudio(playlist[currentTrackIndex]);
                            }
                            else {
                                // correct match					
                                display = "+";

                                playlist = [];
                                playlist.push(levelDIR + (moveNo + 1) + ".wav");
                                playlist.push("games/thinx/thinx/sounds/de/p/done.wav");

                                if (moveNo % 2) {
                                    playlist.push(levelDIR + (moveNo) + ".wav");
                                    playlist.push(levelDIR + (moveNo + 1) + ".wav");
                                }
                                else {
                                    playlist.push(levelDIR + (moveNo + 1) + ".wav");
                                    playlist.push(levelDIR + (moveNo + 2) + ".wav");
                                }

                                stopPlayback();
                                playAudio(playlist[currentTrackIndex]);
                            }
                        }
                        else {

                            // already done					
                            display = "+";

                            playlist = [];
                            playlist.push(levelDIR + (moveNo + 1) + ".wav");
                            playlist.push("games/thinx/thinx/sounds/de/p/ar_done1.wav");

                            stopPlayback();
                            playAudio(playlist[currentTrackIndex]);
                        }
                    }
                    else {
                        // not correct					
                        display = "-";

                        playlist = [];
                        playlist.push(levelDIR + (moveNo + 1) + ".wav");
                        playlist.push("games/thinx/thinx/sounds/de/pause1.wav");
                        playlist.push("games/thinx/thinx/sounds/de/p/badpair2.wav");

                        stopPlayback();
                        playAudio(playlist[currentTrackIndex]);
                    }
                }
                else {
                    // one stone	               
                    playOneAudioFile(levelDIR + (moveNo + 1) + ".wav");
                }
            }
            // too much stones ...
            else {
                playOneAudioFile("games/thinx/thinx/sounds/de/p/too_much.wav");
                display = "-";

                return;
            }
        }
    }

    // chain level 2, 5, 8, ...
    if (gameType == GameType.Sequence) {

        if (stoneOnField) {

            // not enough stones on the field
            if (getCountStones(lst) != 8) {

                playOneAudioFile(levelDIR + (moveNo + 1) + ".wav");

                lst.sort();

                // TODO: find a good solution to show if correct even e.g. two stones on the board
                var ok = true;
                if (getCountStones(lst) > 1) {
                    for (j = 0; j < getCountStones(lst) - 1; j++) {
                        console.log("test " + lst[j] + " / " + lst[j + 1]);
                        if (lst[j] + 1 != lst[j + 1]) {
                            ok = false;
                        }
                    }
                }

                // in the start round we show this on each stone
                if (difficulty == 0) {
                    if (ok) { display = "+"; }
                    else { display = "-"; }
                }
            }

            // we have all stones
            if (getCountStones(lst) == 8) {

                while (lst[0] != 1) {
                    lst = arrayRotate(lst);
                }

                // debug
                for (i = 0; i < lst.length; i++) {
                    console.log(lst[i]);
                }
                console.log("--------------------");

                // TODO: always 8 elements?
                if ((lst[0] == 1 && lst[1] == 2 &&
                    lst[2] == 3 && lst[3] == 4 &&
                    lst[4] == 5 && lst[5] == 6 &&
                    lst[6] == 7 && lst[7] == 8) ||
                    (lst[0] == 1 && lst[1] == 8 &&
                        lst[2] == 7 && lst[3] == 6 &&
                        lst[4] == 5 && lst[5] == 4 &&
                        lst[6] == 3 && lst[7] == 2)) {

                    console.log("correct order");

                    gameState = GameState.Solution;
                    display = "+";

                    playlist = [];
                    playlist.push("games/thinx/thinx/sounds/de/success3.wav");

                    var solution = ks[round - 1];
                    var sols = solution.split("|");
                    console.log(sols)

                    playlist.push(levelDIR + "tipp.wav");

                    for (i = 0; i < sols.length; i++) {
                        if (sols[i] == "%1") { playlist.push(levelDIR + "1.wav"); };
                        if (sols[i] == "%2") { playlist.push(levelDIR + "2.wav"); };
                        if (sols[i] == "%3") { playlist.push(levelDIR + "3.wav"); };
                        if (sols[i] == "%4") { playlist.push(levelDIR + "4.wav"); };
                        if (sols[i] == "%5") { playlist.push(levelDIR + "5.wav"); };
                        if (sols[i] == "%6") { playlist.push(levelDIR + "6.wav"); };
                        if (sols[i] == "%7") { playlist.push(levelDIR + "7.wav"); };
                        if (sols[i] == "%8") { playlist.push(levelDIR + "8.wav"); };
                        if (sols[i].startsWith("??")) { playlist.push(sols[i].replace("??", gamePath)); };
                    }

                    stopPlayback();
                    playAudio(playlist[currentTrackIndex]);
                }
                else {
                    // wrong order
                    display = "-";

                    playlist = [];
                    playlist.push(levelDIR + (moveNo + 1) + ".wav");
                    playlist.push("games/thinx/thinx/sounds/de/pause2.wav");
                    playlist.push("games/thinx/thinx/sounds/de/k/not_so.wav");

                    stopPlayback();
                    playAudio(playlist[currentTrackIndex]);

                    console.log("wrong order");
                }
            }
        }
    }

    // picture level 3, 6, 9, ...
    if (gameType == GameType.Picture) {

        if (stoneOnField) {

            // sort stones
            lst.sort()

            // not finished yet, show hint
            if (getCountStones(lst) < p_StonesCount[round - 1]) {

                var checkOK = true;
                for (i = 0; i < 8; i++) {
                    if (lst[i] > p_StonesCount[round - 1]) {
                        checkOK = false;
                    }
                }

                if (difficulty == 0) {
                    if (checkOK) {
                        display = "+";
                    }
                    else {
                        display = "-";
                    }
                }

                stopPlayback();
                playOneAudioFile(levelDIR + (moveNo + 1) + ".wav");
            }

            // too much stones on the fields
            if (getCountStones(lst) > p_StonesCount[round - 1]) {

                display = "-";

                stopPlayback();

                playlist = [];
                playlist.push(levelDIR + (moveNo + 1) + ".wav");
                playlist.push("games/thinx/thinx/sounds/de/pause1.wav");
                playlist.push("games/thinx/thinx/sounds/de/b/too_much.wav");

                playAudio(playlist[currentTrackIndex]);
            }

            if (getCountStones(lst) == p_StonesCount[round - 1]) {

                var checkOK = true;
                var no = 1;

                for (i = 8 - p_StonesCount[round - 1]; i < 8; i++) {
                    if (lst[i] != no) {
                        checkOK = false;
                    }
                    no++;
                }

                if (checkOK) {

                    display = "+";
                    console.log("correct combination");

                    gameState = GameState.Solution;

                    // correct match

                    stopPlayback();

                    playlist = [];
                    playlist.push(levelDIR + (moveNo + 1) + ".wav");
                    playlist.push("games/thinx/thinx/sounds/de/all_done.wav");

                    playlist.push(levelDIR + "tipp.wav");

                    var solution = bs[round - 1];
                    var sols = solution.split("|");
                    console.log(sols)

                    for (i = 0; i < sols.length; i++) {
                        if (sols[i] == "%1") { playlist.push(levelDIR + "1.wav"); };
                        if (sols[i] == "%2") { playlist.push(levelDIR + "2.wav"); };
                        if (sols[i] == "%3") { playlist.push(levelDIR + "3.wav"); };
                        if (sols[i] == "%4") { playlist.push(levelDIR + "4.wav"); };
                        if (sols[i] == "%5") { playlist.push(levelDIR + "5.wav"); };
                        if (sols[i] == "%6") { playlist.push(levelDIR + "6.wav"); };
                        if (sols[i] == "%7") { playlist.push(levelDIR + "7.wav"); };
                        if (sols[i] == "%8") { playlist.push(levelDIR + "8.wav"); };
                        if (sols[i].startsWith("??")) { playlist.push(sols[i].replace("??", gamePath)); };
                    }

                    playAudio(playlist[currentTrackIndex]);
                }
                else {

                    display = "-";

                    // wrong order
                    console.log("wrong combination");

                    stopPlayback();

                    playlist = [];
                    playlist.push(levelDIR + (moveNo + 1) + ".wav");
                    playlist.push("games/thinx/thinx/sounds/de/pause2.wav");
                    playlist.push("games/thinx/thinx/sounds/de/b/not_so.wav");

                    playAudio(playlist[currentTrackIndex]);
                }

            }

        }
    }
}

function getMousePos(canvas, evt) {

    var valX = evt.clientX - canvas.offsetLeft;
    var valY = evt.clientY - canvas.offsetTop;

    return {
        x: valX,
        y: valY
    };
}

function getTouchPos(canvas, evt) {

    var valX = evt.targetTouches[0].pageX - canvas.offsetLeft;
    var valY = evt.targetTouches[0].pageY - canvas.offsetTop;

    return {
        x: valX,
        y: valY
    };
}

function checkPosition(sx, sy, tx, ty) {

    if (sx > tx - 50 && sy > ty - 50 && sx < tx + 50 && sy < ty + 50) {
        return true;
    }

    return false;
}

function getStonesOnFields() {

    lst = [0, 0, 0, 0, 0, 0, 0, 0];

    for (i = 0; i < 8; i++) {

        for (j = 0; j < 8; j++) {

            if (checkPosition(fieldPos[i][0], fieldPos[i][1], stonePos[j][0], stonePos[j][1])) {
                lst[i] = j + 1;
            }
        }
    }

    return lst
}

function getCountStones(lst) {

    var cnt = 0;

    for (i = 0; i < 8; i++) {
        if (lst[i] != 0) {
            cnt++;
        }
    }


    return cnt;
}

function playOneAudioFile(file) {

    stopPlayback()

    playlist = [];
    playlist.push(file);
    playAudio(playlist[currentTrackIndex]);
}

function playAudio(file) {

    console.log("play:" + file);
    audioPlayer.src = file;
    audioPlayer.play();
}

function playNextTrack() {

    currentTrackIndex++;
    console.log("play track ended");

    if (currentTrackIndex < playlist.length) {
        var nextTrack = playlist[currentTrackIndex];
        playAudio(nextTrack);

    } else {

        if (gameState == GameState.Intro) {
            gameState = GameState.Running;

            if (!isRunning) {
                startTimer();
            }
        }

        if (gameState == GameState.Help) {
            gameState = GameState.Running;

            if (!isRunning) {
                startTimer();
            }
        }

        console.log("playlist ended");
        stopPlayback();

        if (gameState == GameState.Solution) {
            nextLevel();
        }
    }
}

function stopPlayback() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    currentTrackIndex = 0;
}

function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

function getBit(number, bitPosition) {
    return (number & (1 << bitPosition)) === 0 ? 0 : 1;
}

function startTimer() {
    if (!isRunning) {
        startTime = new Date(); // Set the start time to the current time
        isRunning = true; // Set the timer state to running
    }
}

function pauseTimer() {
    if (isRunning) {
        const currentTime = new Date(); // Get the current time
        const elapsed = currentTime - startTime; // Calculate the elapsed time
        elapsedTime += elapsed; // Add the elapsed time to the total elapsed time
        isRunning = false; // Set the timer state to not running
    }
}

function resetTimer() {
    startTime = null; // Reset the start time
    elapsedTime = 0; // Reset the elapsed time
    isRunning = false; // Set the timer state to not running
}

function getElapsedTime() {
    let totalElapsed = elapsedTime;

    if (isRunning) {
        const currentTime = new Date(); // Get the current time
        const elapsed = currentTime - startTime; // Calculate the elapsed time since start
        totalElapsed += elapsed; // Add the elapsed time since start to the total elapsed time
    }

    return totalElapsed;
}

// ###########################################################################	

function draw() {

    // delete field
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw background
    ctx.drawImage(backg, 0, 0, canvas.width, canvas.height);

    // counter for glow effect
    counter++;
    if (counter > 90) {
        counter = 1;
    }

    // set gfx accordingly
    for (i = 0; i < 8; i++) {
        if (counter == 10) {
            fields[i].src = "gfx/glow1.png"
        }
        else if (counter == 30) {
            fields[i].src = "gfx/glow2.png"
        }
        else if (counter == 50) {
            fields[i].src = "gfx/glow3.png"
        }
        else if (counter == 70) {
            fields[i].src = "gfx/glow2.png"
        }

        if (gameState != GameState.Running) {
            fields[i].src = "gfx/glow1.png"
        }
    }

    // draw play and help button
    if (gameState == GameState.Running) {
        // draw help
        ctx.drawImage(helpButton, 10, 10, 75, 75);
        // draw play
        ctx.drawImage(playButton, 10, canvas.height - 85, 75, 75);

    }
    // draw pause button
    if (gameState == GameState.Running || gameState == GameState.Pause) {
        // draw pause
        ctx.drawImage(pauseButton, 120, canvas.height - 85, 75, 75);
    }

    // draw led field
    var topX = canvas.width / 2 - 55;
    var topY = canvas.height / 2 - 55;

    // background led area
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.arc(topX + 55, topY + 55, 110, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = 'black';
    ctx.arc(topX + 55, topY + 55, 100, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // draw led's
    topX = canvas.width / 2 - 75;
    topY = canvas.height / 2 - 75;

    for (var i = 0; i < 12; i++) { // vertical
        for (var j = 0; j < 12; j++) { // horizontal

            var val = 0;

            // single display
            if (display.length == 1) {

                var no = 0
                if (display == "-") { no = 39; }
                if (display == "+") { no = 33; }
                if (display == "1") { no = 51; }
                if (display == "2") { no = 54; }
                if (display == "3") { no = 57; }
                if (display == "4") { no = 60; }
                if (display == "5") { no = 63; }
                if (display == "6") { no = 66; }
                if (display == "7") { no = 69; }
                if (display == "8") { no = 72; }
                if (display == "9") { no = 75; }

                if (no != 0) {
                    var val1 = [];

                    for (var i1 = 0; i1 < 3; i1++) {
                        val1.push((asciiArray[no + i1] & 0x3f80) >> 7);
                        val1.push(asciiArray[no + i1] & 0x007f);
                    }
                    for (var i1 = 0; i1 < 6; i1++) {
                        val1[i1] = val1[i1] << 3;
                    }

                    if (j >= 3 && j < 9) {
                        val = val1[j - 3];
                    }
                }
            }

            // two digit display
            if (display.length == 2) {

                var no = 0
                if (display[0] == "-") { no = 39; }
                if (display[0] == "+") { no = 33; }
                if (display[0] == "0") { no = 48; }
                if (display[0] == "1") { no = 51; }
                if (display[0] == "2") { no = 54; }
                if (display[0] == "3") { no = 57; }
                if (display[0] == "4") { no = 60; }
                if (display[0] == "5") { no = 63; }
                if (display[0] == "6") { no = 66; }
                if (display[0] == "7") { no = 69; }
                if (display[0] == "8") { no = 72; }
                if (display[0] == "9") { no = 75; }

                if (no != 0) {
                    var val1 = [];

                    for (var i1 = 0; i1 < 3; i1++) {
                        val1.push((asciiArray[no + i1] & 0x3f80) >> 7);
                        val1.push(asciiArray[no + i1] & 0x007f);
                    }
                    for (var i1 = 0; i1 < 6; i1++) {
                        val1[i1] = val1[i1] << 3;
                    }
                    if (j >= 1 && j < 7) {
                        val = val1[j - 1];
                    }
                }

                no = 0
                if (display[1] == "-") { no = 39; }
                if (display[1] == "+") { no = 33; }
                if (display[1] == "0") { no = 48; }
                if (display[1] == "1") { no = 51; }
                if (display[1] == "2") { no = 54; }
                if (display[1] == "3") { no = 57; }
                if (display[1] == "4") { no = 60; }
                if (display[1] == "5") { no = 63; }
                if (display[1] == "6") { no = 66; }
                if (display[1] == "7") { no = 69; }
                if (display[1] == "8") { no = 72; }
                if (display[1] == "9") { no = 75; }

                if (no != 0) {
                    var val1 = [];

                    for (var i1 = 0; i1 < 3; i1++) {
                        val1.push((asciiArray[no + i1] & 0x3f80) >> 7);
                        val1.push(asciiArray[no + i1] & 0x007f);
                    }
                    for (var i1 = 0; i1 < 6; i1++) {
                        val1[i1] = val1[i1] << 3;
                    }
                    if (j >= 6 && j < 12) {
                        val = val1[j - 6];
                    }
                }
            }

            // take out missing led's
            if (i == 0 && j == 0) { continue; }
            if (i == 0 && j == 1) { continue; }
            if (i == 0 && j == 2) { continue; }
            if (i == 0 && j == 3) { continue; }

            if (i == 0 && j == 8) { continue; }
            if (i == 0 && j == 9) { continue; }
            if (i == 0 && j == 10) { continue; }
            if (i == 0 && j == 11) { continue; }

            if (i == 1 && j == 0) { continue; }
            if (i == 1 && j == 1) { continue; }

            if (i == 1 && j == 10) { continue; }
            if (i == 1 && j == 11) { continue; }

            if (i == 2 && j == 0) { continue; }
            if (i == 2 && j == 11) { continue; }

            if (i == 3 && j == 0) { continue; }
            if (i == 3 && j == 11) { continue; }

            //

            if (i == 11 && j == 0) { continue; }
            if (i == 11 && j == 1) { continue; }
            if (i == 11 && j == 2) { continue; }
            if (i == 11 && j == 3) { continue; }

            if (i == 11 && j == 8) { continue; }
            if (i == 11 && j == 9) { continue; }
            if (i == 11 && j == 10) { continue; }
            if (i == 11 && j == 11) { continue; }

            if (i == 10 && j == 0) { continue; }
            if (i == 10 && j == 1) { continue; }

            if (i == 10 && j == 10) { continue; }
            if (i == 10 && j == 11) { continue; }

            if (i == 9 && j == 0) { continue; }
            if (i == 9 && j == 11) { continue; }

            if (i == 8 && j == 0) { continue; }
            if (i == 8 && j == 11) { continue; }


            ctx.beginPath();

            if (getBit(val, i)) {
                ctx.fillStyle = '#FFEB3B';
            }
            else {
                ctx.fillStyle = 'grey';
            }

            ctx.arc(topX + (j * 14), topY + (i * 14), 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }
    }

    // show ok button
    if (gameState == GameState.Start ||
        gameState == GameState.Intro ||
        gameState == GameState.Help ||
        gameState == GameState.Solution) {

        // draw start button
        if (counter < 45) {
            startButton.src = "gfx/ok_2.png";
        }
        else {
            startButton.src = "gfx/ok_3.png";
        }
        ctx.drawImage(startButton, canvas.width / 2 - (75 / 2), canvas.height - startButton.height - 10, 75, 75);
    }

    // show mode
    if (gameState == GameState.Running) {
        if (gameType == GameType.Pair) {
            gameMode.src = "gfx/pairs.png";
        }
        if (gameType == GameType.Sequence) {
            gameMode.src = "gfx/chain.png";
        }
        if (gameType == GameType.Picture) {
            gameMode.src = "gfx/picture.png";
        }
        ctx.drawImage(gameMode, 715, 10, 75, 75);
    }

    // draw fields
    for (var i = 0; i < 8; i++) {
        ctx.drawImage(fields[i], fieldPos[i][0], fieldPos[i][1], 75, 75);
    }

    // draw stones
    for (i = 0; i < 8; i++) {
        ctx.drawImage(stones[i], stonePos[i][0], stonePos[i][1], 100, 100);
    }

    // get the elapsed time
    var secs = Math.round(getElapsedTime() / 1000, 0);

    var hours = secs / 3600;
    hours = Math.trunc(hours);

    secs = secs - (hours * 3600);

    var mins = secs / 60;
    mins = Math.trunc(mins);

    secs = secs - (mins * 60);

    // draw time info
    if (gameState == GameState.Running) {

        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";

        var tm = hours.toLocaleString(undefined, { minimumIntegerDigits: 2 }) + ":" +
            mins.toLocaleString(undefined, { minimumIntegerDigits: 2 }) + ":" +
            secs.toLocaleString(undefined, { minimumIntegerDigits: 2 });

        ctx.fillText("Level " + level + " - Time " + tm, canvas.width / 2, 30);
    }

    //draw difficulty
    ctx.font = "18px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    var diff = "Einführung";
    if (difficulty == Difficulty.Hard) {
        diff = "Schwer";
    }
    else if (difficulty == Difficulty.Medium) {
        diff = "Mittel";
    }
    else if (difficulty == Difficulty.Easy) {
        diff = "Einfach";
    }
    ctx.fillText(diff, canvas.width - 60, canvas.height - 20);
}

setInterval(draw, 10);
