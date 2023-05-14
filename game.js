// init playfield
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// init audio player
var audioPlayer = document.getElementById('audioPlayer');
var currentTrackIndex = 0;
var playlist =[];

// data
level = 0;
levelFinished = true;
introStartet = false;
gameStarted = false;
solvedPair = [false,false,false,false];

// debug
level = 1;
levelFinished = false;
introStartet = true;
gameStarted = true;

const GameType = {
	Pair: 0,
	Sequence: 1,
	Picture: 2
}

// start time
var start = Date.now();

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

var helpButton = new Image();
helpButton.src = "gfx/help.png"

var startButton = new Image();
startButton.src = "gfx/ok_3.png"

var pairsMode = new Image();
pairsMode.src = "gfx/pairs.png"
var chainMode = new Image();
chainMode.src = "gfx/chain.png"
var pictureMode = new Image();
pictureMode.src = "gfx/picture.png"

// hold the background
var backg = new Image();

// vars for drag and drop
var move = false;
var moveNo = 0;
var startPos = [0,0];
var startMouse = [0,0];

// vars for glow effect
var counter = 0;
var delay = 0;


canvas.addEventListener('touchstart', function(e) { 
	
	//console.log("touchstart")
	var mousecoords = getTouchPos(canvas, e);
	if(!levelFinished) {
		if (!move)
		{
			startDrag(mousecoords.x,mousecoords.y)
			return;
		}
	}
	
	if(checkPosition(mousecoords.x, mousecoords.y, startButton.x + 50, startButton.y + 50)){
		playIntro();
	}
	
}, false);
canvas.addEventListener('mousedown', function(e) { 

	//console.log("mousedown")
	var mousecoords = getMousePos(canvas, e);
	
	if(!levelFinished) {	
		if (!move)
		{
			startDrag(mousecoords.x,mousecoords.y)
			return;
		}
	}
	
	if(checkPosition(mousecoords.x, mousecoords.y, canvas.width / 2, canvas.height / 2)){
		playIntro();
	}
	
}, false);
 
canvas.addEventListener('touchmove', function(e) {

if(move)
{
	var mousecoords = getTouchPos(canvas, e);
	moveDrag(mousecoords.x, mousecoords.y);
 }

 }, false);
canvas.addEventListener('mousemove', function(e) {
	
if(move)
{
	var mousecoords = getMousePos(canvas, e);
	moveDrag(mousecoords.x, mousecoords.y);
 }

 }, false);

canvas.addEventListener('touchend', function(e) {
	
	//console.log("touchend")

	if(move)
	{
		endDrag();
	}	
 }, false);
canvas.addEventListener('mouseup', function(e) {
	
	//console.log("mouseup")
	
	if(move)
	{
		endDrag();
	}
 }, false);

backg.src = "gfx/thinx.png";
  
var fields = [];
var stones = [];

// init the fields 
for(i=0;i<8;i++){
	var img = new Image();
	img.src = "gfx/glow1.png";
	fields.push(img);
}

// init the stones 
for(i=0;i<8;i++){
	var img = new Image();
	img.src = "gfx/stone" + (i+1) + ".png";
	stones.push(img);
}
	
setStones();

// more dificult if the stones are mixed
shuffle(stones);
shuffle(stonePos);

// ###########################################################################	

// set event for the AudioPlayer
audioPlayer.addEventListener('ended', function() {
  playNextTrack();
});

function playIntro() {
	
	introStartet = true;
	
	// play teh intro (partly)
	playlist =[];
	playlist.push("games/thinx/thinx/sounds/intro.wav");
	playlist.push("games/thinx/thinx/sounds/de/intro/i_01.wav");
	playlist.push("games/thinx/thinx/sounds/de/p/start_0.wav");
							
	stopPlayback();
	playAudio(playlist[currentTrackIndex]);	
}

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

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

function setStones(){
	// calculate the inital stone position
	var radius = 175;
	for (var i = 1; i <= 8; i++) {
		
		var angle = i * Math.PI / 4;
		var x = Math.cos(angle) * radius + 350;
		var y = Math.sin(angle) * radius + 350;
	
		stonePos[i-1][0] = x;
		stonePos[i-1][1] = y;
	}
}

function startDrag(x, y){
	
	for(i=0;i<8;i++){
		// we need to add 50/50 since the position is the upper left corner
		if(checkPosition(x, y, stonePos[i][0] + 50, stonePos[i][1] + 50)){
			
			console.log("Select stone " + (i + 1));
			
			startMouse = [x, y];
			startPos = [stonePos[i][0],stonePos[i][1]]
			
			move = true; 
			moveNo = i;
			return;
		}
	}
}

function moveDrag(x, y){
	
	var dif_x = x - startMouse[0];
	var dif_y = y - startMouse[1];

	stonePos[moveNo][0] = startPos[0] + dif_x;
	stonePos[moveNo][1] = startPos[1] + dif_y;
 }

function endDrag(){
	
	lst = getStonesOnFields();
	
	// debug
	for(i=0;i<lst.length;i++){
		console.log(lst[i]);
	}
	console.log("--------------------");
	
	var subLevel = level % 3;
	var round = Math.floor((level-1) / 3) + 1;
	
	console.log("Round " + round);
	
	// pairs level 1,4,...
	if (subLevel == 1) {
		
		var pDIR = "games/thinx/thinx/sounds/de/p/p_";
		pDIR = pDIR + pad(round, 2) + "/";
		
		console.log(pDIR);
		
		lst.sort()
		
		if(lst.length <= 2){
			for(i=0;i<8;i++){
				
				if(checkPosition(stonePos[moveNo][0] + 50, stonePos[moveNo][1] + 50, fieldPos[i][0] + 50, fieldPos[i][1] + 50)){
					
					console.log("play " + moveNo);
														
					if(lst.length == 2){
						if((lst[0] == 0 && lst[1] == 1) ||
						(lst[0] == 2 && lst[1] == 3) ||
						(lst[0] == 4 && lst[1] == 5) ||
						(lst[0] == 6 && lst[1] == 7)){
							
							if(solvedPair[lst[0]/2] == false){
								solvedPair[lst[0]/2] = true;
								if(solvedPair[0] && solvedPair[1] && solvedPair[2] && solvedPair[3]){
									
									levelFinished = true;
									
									// last match
									playlist =[];
									playlist.push("games/thinx/thinx/sounds/de/p/last.wav");
									
									if(moveNo % 2) {
										playlist.push(pDIR + (moveNo) + ".wav");
										playlist.push(pDIR + (moveNo + 1) + ".wav");
									}
									else {
										playlist.push(pDIR + (moveNo + 1) + ".wav");
										playlist.push(pDIR + (moveNo + 2) + ".wav");
									}
									
									playlist.push("games/thinx/thinx/sounds/de/quiz_n.wav");
									if(level == 1) {
										playlist.push("games/thinx/thinx/sounds/de/k/start_0.wav");
									}
							
									stopPlayback();
									playAudio(playlist[currentTrackIndex]);
								}
								else{
									// correct match
									playlist =[];
									playlist.push(pDIR + (moveNo + 1) + ".wav");
									playlist.push("games/thinx/thinx/sounds/de/p/done.wav");
							
									stopPlayback();
									playAudio(playlist[currentTrackIndex]);
								}
								
							}
							else{
								// already done
								playlist =[];
								playlist.push(pDIR + (moveNo + 1) + ".wav");
								playlist.push("games/thinx/thinx/sounds/de/p/ar_done1.wav");
							
								stopPlayback();
								playAudio(playlist[currentTrackIndex]);
							}						
						}
						else {
							// not correct
							playlist =[];
							playlist.push(pDIR + (moveNo + 1) + ".wav");
							playlist.push("games/thinx/thinx/sounds/de/pause1.wav");
							playlist.push("games/thinx/thinx/sounds/de/p/badpair2.wav");
							
							stopPlayback();
							playAudio(playlist[currentTrackIndex]);
						}
					}
					else{
						/// one stone					
						playOneAudioFile(pDIR + (moveNo + 1) + ".wav");
					}
					break;
				}
			}	
		}
		else{
			for(i=0;i<8;i++){
				
				if(checkPosition(stonePos[moveNo][0] + 50, stonePos[moveNo][1] + 50, fieldPos[i][0] + 50, fieldPos[i][1] + 50)){
									
					playOneAudioFile("games/thinx/thinx/sounds/de/p/too_much.wav");
					
					move = false;
					return;
				}
			}
		}
	}
	
	// chain level 2, 5, 8, ...
	if (subLevel == 2){
		
		var kDIR = "games/thinx/thinx/sounds/de/k/k_";
		kDIR = kDIR + pad(round, 2) + "/";
		
		console.log(pDIR);

		for(i=0;i<8;i++){
			
			if(checkPosition(stonePos[moveNo][0] + 50, stonePos[moveNo][1] + 50, fieldPos[i][0] + 50, fieldPos[i][1] + 50)){
				
				console.log("play");
				
				if(lst.length != 8){
					
					console.log("not enough stones");									
					playOneAudioFile(kDIR + (moveNo + 1) + ".wav");		
				}
				
				if(lst.length == 8){
					
					while(lst[0] != 0)
					{
						lst = arrayRotate(lst);
					}
					
					// debug
					for(i=0;i<lst.length;i++){
						console.log(lst[i]);
					}
					console.log("--------------------");
				
					// TODO: always 8 elements?
					if((lst[0] == 0 && lst[1] == 1 &&
						lst[2] == 2 && lst[3] == 3 &&
						lst[4] == 4 && lst[5] == 5 &&
						lst[6] == 6 && lst[7] == 7) ||
					   (lst[0] == 0 && lst[1] == 7 &&
						lst[2] == 6 && lst[3] == 5 &&
						lst[4] == 4 && lst[5] == 3 &&
						lst[6] == 2 && lst[7] == 1)){
							
						console.log("correct order");
						
						levelFinished = true;
																	
						playlist =[];
						playlist.push("games/thinx/thinx/sounds/de/all_done.wav");
						
						playlist.push(kDIR + "tipp.wav");
						playlist.push(kDIR + "1.wav");
						playlist.push(kDIR + "2.wav");
						playlist.push(kDIR + "3.wav");
						playlist.push(kDIR + "4.wav");
						playlist.push(kDIR + "5.wav");
						playlist.push(kDIR + "6.wav");
						playlist.push(kDIR + "7.wav");
						playlist.push(kDIR + "8.wav");
						
						playlist.push("games/thinx/thinx/sounds/de/quiz_n.wav");	
						if(level == 2) {
							playlist.push("games/thinx/thinx/sounds/de/b/start_0.wav");
						}

						stopPlayback();
						playAudio(playlist[currentTrackIndex]);							
					}
					else
					{
						// wrong order
											
						playlist =[];
						playlist.push(kDIR + (moveNo + 1) + ".wav");
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
	if (subLevel == 0){
		
		var bDIR = "games/thinx/thinx/sounds/de/b/b_";
		bDIR = bDIR + pad(round, 2) + "/";

		for(i=0;i<8;i++){
			
			if(checkPosition(stonePos[moveNo][0] + 50, stonePos[moveNo][1] + 50, fieldPos[i][0] + 50, fieldPos[i][1] + 50)){				
							
				// TODO: amout of stones		
				var cnt = [5,6,4,5,5,5,5,5,5,4,4,5,5,5,4,5,5,8,8,8,8,8,8,8,8];
				
				if(lst.length < cnt[round-1]){
					
					stopPlayback();
					
					playOneAudioFile(bDIR + (moveNo + 1) + ".wav");		
					break;
				}
				
				if(lst.length > cnt[round-1]) {
					
					stopPlayback();
					
					playlist =[];
					playlist.push(bDIR + (moveNo + 1) + ".wav");
					playlist.push("games/thinx/thinx/sounds/de/b/too_much.wav");						
					
					playAudio(playlist[currentTrackIndex]);
					
					break;
				}
				
				if(lst.length == cnt[round-1]){
					
					lst = lst.sort();
					
					// debug
					for(i=0;i<lst.length;i++){
						console.log(lst[i]);
					}
					console.log("--------------------");
					
					var checkOK = true;
					for(i=0;i<cnt[round-1];i++){
						if(lst[i] != i) {
							checkOK = false;
						}
					}
				
					if(checkOK){
						
						console.log("correct order");	
						
						levelFinished = true;
						
						// correct match
						
						stopPlayback();
						
						playlist =[];
						playlist.push(bDIR + (moveNo + 1) + ".wav");
						playlist.push("games/thinx/thinx/sounds/de/all_done.wav");
						playlist.push(bDIR + "tipp.wav");
						
						if(level == 6) {
							playlist.push("games/thinx/thinx/sounds/de/reached1.wav");
						}
						if(level == 21) {
							playlist.push("games/thinx/thinx/sounds/de/reached2.wav");
						}
						if(level == 51) {
							playlist.push("games/thinx/thinx/sounds/de/reached3.wav");
						}

						playlist.push("games/thinx/thinx/sounds/de/quiz_n.wav");
												
						playAudio(playlist[currentTrackIndex]);	

						break;
					}
					else
					{
						// wrong order
						console.log("wrong order");
						
						stopPlayback();
						
						playlist =[];
						playlist.push(bDIR + (moveNo + 1) + ".wav");
						playlist.push("games/thinx/thinx/sounds/de/pause2.wav");
						playlist.push("games/thinx/thinx/sounds/de/b/not_so.wav");
						
						playAudio(playlist[currentTrackIndex]);	

						break;						
					}
				}
				
			}
				
		}
	}
	
	move = false;
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

function checkPosition(sx, sy, tx ,ty){

	if(sx > tx - 50 && sy > ty - 50 && sx < tx + 50 && sy < ty + 50)
	{
		return true;
	}

	return false;
}

function getStonesOnFields(){
	lst = []
	
	for(i=0;i<8;i++){
		
		for(j=0;j<8;j++){
			
			if(checkPosition(fieldPos[i][0], fieldPos[i][1], stonePos[j][0], stonePos[j][1])){	
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
		console.log("playlist ended");
		stopPlayback();
		
		if(levelFinished)
		{
			if(level == 0) {
				start = Date.now();
			}
			
			// fehlende Logik, hier ist erstmal Schluss!
			if(level < 51) {
			
				level = level + 1;
				setStones();
				
				// more dificult if the stones are mixed
				shuffle(stones);
				shuffle(stonePos);
				
				levelFinished = false;
				gameStarted = true;
				
				solvedPair = [false,false,false,false];
			}
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

// ###########################################################################	

function draw() {
	// delete field
    ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	// draw background
	ctx.drawImage(backg, 0, 0, canvas.width,canvas.height);
	
	// counter for glow effect
	counter++;
	if(counter>90)
	{
		counter = 1;
	}
	
	// set gfx accordingly
	for(i=0;i<8;i++){
		if(counter == 10)
		{
			fields[i].src = "gfx/glow1.png"
		}
		else if(counter == 30)
		{
			fields[i].src = "gfx/glow2.png"
		}
		else if(counter == 50)
		{
			fields[i].src = "gfx/glow3.png"
		}
		else if(counter == 70)
		{
			fields[i].src = "gfx/glow2.png"
		}
		
		if(levelFinished)
		{
			fields[i].src = "gfx/glow1.png"
		}
	}
	
	// draw info and buttons
	ctx.drawImage(helpButton, 10, 10, 75, 75);
	
	if(!introStartet) {
		// draw start button
		ctx.drawImage(startButton, canvas.width / 2 - (startButton.width / 2), canvas.height / 2 - (startButton.height / 2));
	}
	
	if(gameStarted) {
		var subLevel = level % 3;
		// show mode
		if(subLevel == 1){
				ctx.drawImage(pairsMode, 715, 10, 75, 75);
		}
		if(subLevel == 2){
				ctx.drawImage(chainMode, 715, 10, 75, 75);
		}
		if(subLevel == 0){
				ctx.drawImage(pictureMode, 715, 10, 75, 75);
		}
	}
	
	// draw fields
	for (var i = 0; i < 8; i++)
	{
		ctx.drawImage(fields[i], fieldPos[i][0], fieldPos[i][1], 75, 75);
	}
	
	// draw stones
	for(i=0;i<8;i++){
	ctx.drawImage(stones[i], stonePos[i][0], stonePos[i][1], 100 , 100);
	}
		
	// measure game time and display it
	const end = Date.now();
	diff = (end - start) / 1000;
	secs = Math.trunc( diff );
	
	hours = secs / 3600;
	hours = Math.trunc( hours );
	
	secs = secs - (hours * 3600);
	
	mins = secs / 60;
	mins = Math.trunc( mins );
	
	secs = secs - (mins * 60);

	if(gameStarted) {	
	
		ctx.font = "30px Arial";
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		
		var tm = hours.toLocaleString(undefined, {minimumIntegerDigits:2}) + ":" +
					mins.toLocaleString(undefined, {minimumIntegerDigits:2}) + ":" +
					secs.toLocaleString(undefined, {minimumIntegerDigits:2});
		
		ctx.fillText("Level " + level + " - Time " + tm, canvas.width / 2, 30);
	}

	ctx.font = "18px Arial";
	ctx.fillStyle = "white";
	ctx.textAlign = "center";
	
	var diff = "Einführung";
		
	if(level > 51) {
		diff = "Schwer";
	}
	else if(level > 21) {
		diff = "Mittel";
	}
	else if(level > 6) {
		diff = "Einfach";
	}

	ctx.fillText(diff, canvas.width - 60, canvas.height - 20);

}

setInterval(draw, 10);
