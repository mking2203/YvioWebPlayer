// init playfield
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// data
level = 2
solvedPair = [false,false,false,false];

const start = Date.now();

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
	if (!move)
	{
		startDrag(mousecoords.x,mousecoords.y)
		return;
	}
	
}, false);
canvas.addEventListener('mousedown', function(e) { 

	//console.log("mousedown")

	var mousecoords = getMousePos(canvas, e);
	if (!move)
	{
		startDrag(mousecoords.x,mousecoords.y)
		return;
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
 
for(i=0;i<8;i++){
	var img = new Image();
	img.src = "gfx/glow1.png";
	fields.push(img);
}

for(i=0;i<8;i++){
	var img = new Image();
	img.src = "gfx/stone" + (i+1) + ".png";
	stones.push(img);
}
	
setStones();

//shuffle(stones);
//shuffle(stonePos);

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
	
	// pairs level 1
	if (level == 1){
		
		lst.sort()
		
		if(lst.length <= 2){
			for(i=0;i<8;i++){
				
				if(checkPosition(stonePos[moveNo][0] + 50, stonePos[moveNo][1] + 50, fieldPos[i][0] + 50, fieldPos[i][1] + 50)){
					
					console.log("play");
														
					if(lst.length == 2){
						if((lst[0] == 0 && lst[1] == 1) ||
						(lst[0] == 2 && lst[1] == 3) ||
						(lst[0] == 4 && lst[1] == 5) ||
						(lst[0] == 6 && lst[1] == 7)){
							
							if(solvedPair[lst[0]/2] == false){
								solvedPair[lst[0]/2] = true;
								if(solvedPair[0] && solvedPair[1] && solvedPair[2] && solvedPair[3]){
									// last match
									queue_sounds([new Audio("games/thinx/thinx/sounds/de/p/p_01/" + (moveNo + 1) + ".wav"),new Audio("games/thinx/thinx/sounds/de/p/last.wav")]);
									
									level = level + 1;
									setStones();
								}
								else{
									// correct match
									queue_sounds([new Audio("games/thinx/thinx/sounds/de/p/p_01/" + (moveNo + 1) + ".wav"),new Audio("games/thinx/thinx/sounds/de/p/done.wav")]);
								}
								
							}
							else{
								// already done
								queue_sounds([new Audio("games/thinx/thinx/sounds/de/p/p_01/" + (moveNo + 1) + ".wav"),new Audio("games/thinx/thinx/sounds/de/p/ar_done1.wav")])
							}
								
						}
						else {
							// not correct
							queue_sounds([new Audio("games/thinx/thinx/sounds/de/p/p_01/" + (moveNo + 1) + ".wav"),new Audio("games/thinx/thinx/sounds/de/p/badpair2.wav")]);
						}
					}
					else{
						/// one stone
						//queue_sounds([new Audio("games/thinx/thinx/sounds/de/p/p_01/" + (moveNo + 1) + ".wav")]);
						
						// Get references to the audio player and buttons
						var audioPlayer = document.getElementById('audioPlayer');
						
						audioPlayer.pause();
						audioPlayer.currentTime = 0;
						
						audioPlayer.src = "games/thinx/thinx/sounds/de/p/p_01/" + (moveNo + 1) + ".wav";
						audioPlayer.play();
					}
					break;
				}
			}	
		}
		else{
			for(i=0;i<8;i++){
				
				if(checkPosition(stonePos[moveNo][0] + 50, stonePos[moveNo][1] + 50, fieldPos[i][0] + 50, fieldPos[i][1] + 50)){
									
					var audio = new Audio("games/thinx/thinx/sounds/de/p/too_much.wav");
					audio.play();
					
					move = false;
					return;
				}
			}
		}
	}
	
	// chain level 2
	if (level == 2){

		for(i=0;i<8;i++){
			
			if(checkPosition(stonePos[moveNo][0] + 50, stonePos[moveNo][1] + 50, fieldPos[i][0] + 50, fieldPos[i][1] + 50)){
				
				console.log("play");
				
				if(lst.length != 8){
					//queue_sounds([new Audio("games/thinx/thinx/sounds/de/k/k_01/" + (moveNo + 1) + ".wav")]);
					
					// Get references to the audio player and buttons
					var audioPlayer = document.getElementById('audioPlayer');
						
					audioPlayer.pause();
					audioPlayer.currentTime = 0;
						
					audioPlayer.src = "games/thinx/thinx/sounds/de/k/k_01/" + (moveNo + 1) + ".wav";
					audioPlayer.play();
					
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
							
							// correct match
							queue_sounds([new Audio("games/thinx/thinx/sounds/de/k/k_01/" + (moveNo + 1) + ".wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/tipp.wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/1.wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/2.wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/3.wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/4.wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/5.wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/6.wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/7.wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/8.wav")]);
							console.log("correct order");
						
							level = level + 1;
							setStones();
							
						}
						else
						{
							// wrong order
							queue_sounds([new Audio("games/thinx/thinx/sounds/de/k/not_so.wav")]);
							console.log("wrong order");
						}
				}
				
			}
				
		}
	}
	
	// picture level 2
	if (level == 3){

		for(i=0;i<8;i++){
			
			if(checkPosition(stonePos[moveNo][0] + 50, stonePos[moveNo][1] + 50, fieldPos[i][0] + 50, fieldPos[i][1] + 50)){
				
				console.log("play");
				
				// TODO: amout of stones
				if(lst.length != 5 && level < 5){
					queue_sounds([new Audio("games/thinx/thinx/sounds/de/b/b_01/" + (moveNo + 1) + ".wav")]);
				}
				else{
					queue_sounds([new Audio("games/thinx/thinx/sounds/de/b/b_01/" + (moveNo + 1) + ".wav"), new Audio("games/thinx/thinx/sounds/de/b/too_much.wav")]);
				}
				
				// TODO: amout of stones
				if(lst.length == 5){
					
						lst = lst.sort();
						
						// debug
						for(i=0;i<lst.length;i++){
							console.log(lst[i]);
						}
						console.log("--------------------");
					
						// TODO: always 8 elements?
						if(lst[0] == 0 && lst[1] == 1 &&
							lst[2] == 2 && lst[3] == 3 &&
							lst[4] == 4){
							
							// correct match
							queue_sounds([new Audio("games/thinx/thinx/sounds/de/k/k_01/" + (moveNo + 1) + ".wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/tipp.wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/1.wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/2.wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/3.wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/4.wav"),
											new Audio("games/thinx/thinx/sounds/de/k/k_01/5.wav")]);
							console.log("correct order");
						
							level = level + 1;
							setStones();
							
						}
						else
						{
							// wrong order
							queue_sounds([new Audio("games/thinx/thinx/sounds/de/k/not_so.wav")]);
							console.log("wrong order");
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

// This plays a file, and call a callback once it completed (if a callback is set)
function play(audio, callback) {

	audio.play();
	if(callback)
	{
		audio.onended = callback;
	}
}
function queue_sounds(sounds){

    var index = 0;
    function recursive_play()
    {
      if(index+1 === sounds.length)
      {
        play(sounds[index],null);
      }
      else
      {
        play(sounds[index],function(){index++; recursive_play();});
      }
    }
	recursive_play();   
}

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
		if(counter == 30)
		{
			fields[i].src = "gfx/glow2.png"
		}
		if(counter == 50)
		{
			fields[i].src = "gfx/glow3.png"
		}
		if(counter == 70)
		{
			fields[i].src = "gfx/glow2.png"
		}
	}
	
	// draw info and buttons
	ctx.drawImage(helpButton, 10, 10, 75, 75);
	
	var subLevel = Math.trunc((level + 1) / 3);
	subLevel = (level + 1) - (subLevel * 3);
	
	// show mode
	if(subLevel == 1){
			ctx.drawImage(pairsMode, 715, 10, 75, 75);
	}
	if(subLevel == 2){
			ctx.drawImage(chainMode, 715, 10, 75, 75);
	}
	if(subLevel == 3){
			ctx.drawImage(pictureMode, 715, 10, 75, 75);
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

	document.getElementById('topText').innerHTML= 'Level ' + level + " - Time " +
		hours.toLocaleString(undefined, {minimumIntegerDigits:2}) + ":" +
		mins.toLocaleString(undefined, {minimumIntegerDigits:2}) + ":" +
		secs.toLocaleString(undefined, {minimumIntegerDigits:2});
}

setInterval(draw, 10);
