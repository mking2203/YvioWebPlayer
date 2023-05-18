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
var level;
var gameType;
var round;
var difficulty; // TODO from file

var gameState = 0;

var solvedPair = [false, false, false, false];
var helpCounter = 0;

// thinx path to sound files
const gamePath = "games/thinx/thinx/sounds/de/";
var levelDIR;

// init the display
var led = [,];
var display = "";

const GameType = {
    Pair: 1,
    Sequence: 2,
    Picture: 0,
    Nothing: -1
}

const GameState = {
    Start: 0,
    Intro: 1,
    Running: 2,
    Solution: 3,
    Help: 4
}

// holds the stone position
var stonePos = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0]
];
// holds the field position
var fieldPos = [
    [225, 90],
    [490, 90],
    [655, 250],
    [650, 500],
    [490, 650],
    [240, 650],
    [75, 500],
    [70, 250]
];

var playButton = new Image();
playButton.src = "gfx/play.png";

var helpButton = new Image();
helpButton.src = "gfx/help.png";

var startButton = new Image();
startButton.src = "gfx/ok_3.png";

var pairsMode = new Image();
pairsMode.src = "gfx/pairs.png";
var chainMode = new Image();
chainMode.src = "gfx/chain.png";
var pictureMode = new Image();
pictureMode.src = "gfx/picture.png";

// hold the background
var backg = new Image();

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

    //console.log("touchend")

    if (move) {
        endDrag();
    }
}, false);
canvas.addEventListener('mouseup', function (e) {

    //console.log("mouseup")

    if (move) {
        endDrag();
    }
}, false);

// set event for the AudioPlayer
audioPlayer.addEventListener('ended', function () {
    playNextTrack();
});

backg.src = "gfx/thinx.png";

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

// init the level
initLevel(1);

// disable input
gameState = GameState.Start;

// Retrieving the saved number from local storage
var savedNumber = localStorage.getItem('yvioLevel_A');

console.log("SAVE: " + savedNumber);

// ###########################################################################

function handleDownEvent(mousecoords) {

    console.log("gamestate "  + gameState);

    if (gameState == GameState.Running) {

        if (checkPosition(mousecoords.x, mousecoords.y, 50, 50)) {
            playHelp();
            return;
        }

        if (!move) {
            startDrag(mousecoords.x, mousecoords.y)

            return;
        }
    }

    if (checkPosition(mousecoords.x, mousecoords.y, canvas.width / 2, canvas.height - startButton.height - 10)) {

        if (gameState == GameState.Start) {
            playIntro();
        }
        else {
            stopPlayback();

            if (gameState == GameState.Intro) {
                gameState = GameState.Running;

                startTimer();
            }

            if (gameState == GameState.Help) {
                gameState = GameState.Running;
            }

            if (gameState == GameState.Solution) {

                nextLevel();
                gameState = GameState.Running;

            }

            if (!isRunning) {
                startTimer();
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
}

function nextLevel() {
    // fehlende Logik, hier ist erstmal Schluss!
    if (level < 51) {

        level = level + 1;
        initLevel(level);

        // Saving a number to local storage
        localStorage.setItem('yvioLevel_A', level);

        gameState = GameState.Running;
    }
}

function playIntro() {

    console.log("play intro");

    stopPlayback();

    gameState = GameState.Intro;

    playlist = [];
    playlist.push("games/thinx/thinx/sounds/intro.wav");
    playlist.push(gamePath + "intro/i_01.wav");
    playlist.push(gamePath + "intro/i_02.wav");
    playlist.push(gamePath + "p/start_0.wav");

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
    //console.log(parts)

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

    // get stones on the fields
    lst = getStonesOnFields();

    // clear LED display
    display = "";

    // debug - show stones
    for (i = 0; i < lst.length; i++) {
        console.log(lst[i]);
    }

    console.log("--------------------");
    console.log("Level " + level + " / Round " + round);

    // pairs level 1,4,...
    if (gameType == GameType.Pair) {

        // sort stones
        lst.sort()

        // do we have one or two stones?
        if (lst.length <= 2) {

            for (i = 0; i < 8; i++) {

                if (checkPosition(stonePos[moveNo][0] + 50, stonePos[moveNo][1] + 50, fieldPos[i][0] + 50, fieldPos[i][1] + 50)) {

                    if (lst.length == 2) {
                        if ((lst[0] == 0 && lst[1] == 1) ||
                            (lst[0] == 2 && lst[1] == 3) ||
                            (lst[0] == 4 && lst[1] == 5) ||
                            (lst[0] == 6 && lst[1] == 7)) {

                            if (solvedPair[lst[0] / 2] == false) {
                                solvedPair[lst[0] / 2] = true;
                                if (solvedPair[0] && solvedPair[1] && solvedPair[2] && solvedPair[3]) {

                                    gameState = GameState.Solution;

                                    display = "+";

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

                                    playlist.push("games/thinx/thinx/sounds/de/quiz_n.wav");
                                    if (level == 1) {
                                        playlist.push("games/thinx/thinx/sounds/de/k/start_0.wav");
                                    }

                                    stopPlayback();
                                    playAudio(playlist[currentTrackIndex]);
                                }
                                else {
                                    // correct match					
                                    display = "+";

                                    playlist = [];
                                    playlist.push(levelDIR + (moveNo + 1) + ".wav");
                                    playlist.push("games/thinx/thinx/sounds/de/p/done.wav");

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
                        /// one stone	
                        display = "-";
                        playOneAudioFile(levelDIR + (moveNo + 1) + ".wav");
                    }
                    break;
                }
            }
        }
        // too much stones ...
        else {
            for (i = 0; i < 8; i++) {

                if (checkPosition(stonePos[moveNo][0] + 50, stonePos[moveNo][1] + 50, fieldPos[i][0] + 50, fieldPos[i][1] + 50)) {

                    playOneAudioFile("games/thinx/thinx/sounds/de/p/too_much.wav");
                    display = "-";

                    move = false;
                    return;
                }
            }
        }
    }

    // chain level 2, 5, 8, ...
    if (gameType == GameType.Sequence) {

        for (i = 0; i < 8; i++) {

            if (checkPosition(stonePos[moveNo][0] + 50, stonePos[moveNo][1] + 50, fieldPos[i][0] + 50, fieldPos[i][1] + 50)) {

                if (lst.length != 8) {

                    console.log("not enough stones");
                    playOneAudioFile(levelDIR + (moveNo + 1) + ".wav");

                    lst.sort();

                    var ok = true;
                    if (lst.length > 1) {
                        for (j = 0; j < lst.length - 1; j++) {
                            console.log("test " + lst[j]);
                            console.log("test " + lst[j + 1]);
                            if (lst[j] + 1 != lst[j + 1]) {
                                ok = false;
                            }
                        }
                    }
                    if (ok) { display = "+"; }
                    else { display = "-"; }

                }

                if (lst.length == 8) {

                    while (lst[0] != 0) {
                        lst = arrayRotate(lst);
                    }

                    // debug
                    for (i = 0; i < lst.length; i++) {
                        console.log(lst[i]);
                    }
                    console.log("--------------------");

                    // TODO: always 8 elements?
                    if ((lst[0] == 0 && lst[1] == 1 &&
                        lst[2] == 2 && lst[3] == 3 &&
                        lst[4] == 4 && lst[5] == 5 &&
                        lst[6] == 6 && lst[7] == 7) ||
                        (lst[0] == 0 && lst[1] == 7 &&
                            lst[2] == 6 && lst[3] == 5 &&
                            lst[4] == 4 && lst[5] == 3 &&
                            lst[6] == 2 && lst[7] == 1)) {

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

                        playlist.push("games/thinx/thinx/sounds/de/quiz_n.wav");
                        if (level == 2) {
                            playlist.push("games/thinx/thinx/sounds/de/b/start_0.wav");
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
    }

    // picture level 3, 6, 9, ...
    if (gameType == GameType.Picture) {

        for (i = 0; i < 8; i++) {

            if (checkPosition(stonePos[moveNo][0] + 50, stonePos[moveNo][1] + 50, fieldPos[i][0] + 50, fieldPos[i][1] + 50)) {

                // TODO: amout of stones		
                var cnt = [5, 6, 4, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 4, 5, 5, 8, 8, 8, 8, 8, 8, 8, 8];

                if (lst.length < cnt[round - 1]) {

                    stopPlayback();

                    playOneAudioFile(levelDIR + (moveNo + 1) + ".wav");
                    break;
                }

                if (lst.length > cnt[round - 1]) {

                    stopPlayback();

                    playlist = [];
                    playlist.push(levelDIR + (moveNo + 1) + ".wav");
                    playlist.push("games/thinx/thinx/sounds/de/b/too_much.wav");

                    playAudio(playlist[currentTrackIndex]);

                    break;
                }

                if (lst.length == cnt[round - 1]) {

                    lst = lst.sort();

                    // debug
                    for (i = 0; i < lst.length; i++) {
                        console.log(lst[i]);
                    }
                    console.log("--------------------");

                    var checkOK = true;
                    for (i = 0; i < cnt[round - 1]; i++) {
                        if (lst[i] != i) {
                            checkOK = false;
                        }
                    }

                    if (checkOK) {

                        console.log("correct order");

                        gameState = GameState.Solution;

                        // correct match

                        stopPlayback();

                        playlist = [];
                        playlist.push(levelDIR + (moveNo + 1) + ".wav");
                        playlist.push("games/thinx/thinx/sounds/de/all_done.wav");

                        //playlist.push(levelDIR + "tipp.wav");

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

                        // next difficulty
                        // TODO from file
                        if (level == 6) {
                            playlist.push("games/thinx/thinx/sounds/de/reached1.wav");
                        }
                        if (level == 21) {
                            playlist.push("games/thinx/thinx/sounds/de/reached2.wav");
                        }
                        if (level == 51) {
                            playlist.push("games/thinx/thinx/sounds/de/reached3.wav");
                        }

                        playlist.push("games/thinx/thinx/sounds/de/quiz_n.wav");

                        playAudio(playlist[currentTrackIndex]);

                        break;
                    }
                    else {
                        // wrong order
                        console.log("wrong order");

                        stopPlayback();

                        playlist = [];
                        playlist.push(levelDIR + (moveNo + 1) + ".wav");
                        playlist.push("games/thinx/thinx/sounds/de/pause2.wav");
                        playlist.push("games/thinx/thinx/sounds/de/b/not_so.wav");

                        playAudio(playlist[currentTrackIndex]);

                        break;
                    }
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
    lst = []

    for (i = 0; i < 8; i++) {

        for (j = 0; j < 8; j++) {

            if (checkPosition(fieldPos[i][0], fieldPos[i][1], stonePos[j][0], stonePos[j][1])) {
                lst.push(j);
            }
        }
    }

    return lst
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

    // draw help
    if (gameState == GameState.Running) {
        ctx.drawImage(helpButton, 10, 10, 75, 75);
    }

    // draw play
    ctx.drawImage(playButton, 10, canvas.height - 85, 75, 75);

    // draw led
    var topX = canvas.width / 2 - 55;
    var topY = canvas.height / 2 - 55;

    // background led
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

    topX = canvas.width / 2 - 75;
    topY = canvas.height / 2 - 75;

    for (var i = 0; i < 12; i++) {
        for (var j = 0; j < 12; j++) {

            var val;

            val = ascii[0][j];

            if (display == "-") { val = ascii[1][j]; }
            if (display == "+") { val = ascii[2][j]; }

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
                ctx.fillStyle = 'orange';
            }
            else {
                ctx.fillStyle = 'grey';
            }

            ctx.arc(topX + (i * 14), topY + (j * 14), 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }
    }

    // draw start button
    ctx.drawImage(startButton, canvas.width / 2 - (startButton.width / 2), canvas.height - startButton.height - 10);

    if (gameState == GameState.Running) {;
        // show mode
        if (gameType == GameType.Pair) {
            ctx.drawImage(pairsMode, 715, 10, 75, 75);
        }
        if (gameType == GameType.Sequence) {
            ctx.drawImage(chainMode, 715, 10, 75, 75);
        }
        if (gameType == GameType.Picture) {
            ctx.drawImage(pictureMode, 715, 10, 75, 75);
        }
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

    if (gameState == GameState.Running) {

        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";

        var tm = hours.toLocaleString(undefined, { minimumIntegerDigits: 2 }) + ":" +
            mins.toLocaleString(undefined, { minimumIntegerDigits: 2 }) + ":" +
            secs.toLocaleString(undefined, { minimumIntegerDigits: 2 });

        ctx.fillText("Level " + level + " - Time " + tm, canvas.width / 2, 30);
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    var diff = "Einführung";

    if (level > 51) {
        diff = "Schwer";
    }
    else if (level > 21) {
        diff = "Mittel";
    }
    else if (level > 6) {
        diff = "Einfach";
    }

    ctx.fillText(diff, canvas.width - 60, canvas.height - 20);

}

setInterval(draw, 10);
