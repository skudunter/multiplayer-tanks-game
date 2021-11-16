var win;
//var tank; // Just this instance of the tank
let tanks = []; // All tanks in the game 
let shots = []; // All shots in the game
var socketID;
var mytankid;
var myTankIndex = -1;
var buzz = undefined;

var socket;
var oldTankx, oldTanky, oldTankHeading;
var fps = 60; // Frames per second
var PlayerName = "";
var DEBUG = 0;
var loopCount = 0.0;  // Keep a running counter to handle animations

// Sounds activated
const soundLib = new sounds();

// Initial Setup
function setup() {

  // Start the audio context on a click/touch event
  userStartAudio().then(function() {
    // Audio context is started - Preload any needed sounds
    soundLib.loadLibSound('saw');
    soundLib.loadLibSound('cannon');
    soundLib.loadLibSound('tankfire');
    soundLib.loadLibSound('dpop');
  });

  // Get the Player
  PlayerName = document.getElementById('playerName').value;
  console.log('Player: ' + PlayerName);

  // Set drawing parmameters
  rectMode(CENTER);
  textAlign(CENTER, CENTER);

  // Set window size and push to the main screen
  // Good DEV size
  win = { width: 600, height: 600 };
  // Good PROD size
//  win = { width: 900, height: 700 };
  var canvas = createCanvas(win.width, win.height);
  canvas.parent('sketch-holder');

  // Set the framerate so everyone is *hopefully* the same
  frameRate(fps); // As low as possible to not tax slow systems

  // Create a socket to the main server
  const server = window.location.hostname + ":" + location.port;
  socket = io.connect(server, {transports: ['polling']});

  // All the socket method handlers
  socket.on('ServerReadyAddNew', ServerReadyAddNew);
  socket.on('ServerNewTankAdd', ServerNewTankAdd);
  socket.on('ServerTankRemove', ServerTankRemove);
  socket.on('ServerMoveTank', ServerMoveTank);
  socket.on('ServerResetAll', ServerResetAll);
  socket.on('ServerMoveShot', ServerMoveShot);
  socket.on('ServerNewShot', ServerNewShot);
  socket.on('ServerBuzzSawNewChaser', ServerBuzzSawNewChaser);
  socket.on('ServerBuzzSawMove', ServerBuzzSawMove);

  // Join (or start) a new game
  socket.on('connect', function(data) {
    socketID = socket.io.engine.id;
    socket.emit('ClientNewJoin', socketID);
  });

  // Create a new Buzz
//  buzz = new Buzzsaw(win.width/2, win.height/2, color('#ffdc49'));
}
  
// Draw the screen and process the position updates
function draw() {
    background(0);

    // Loop counter
    if(loopCount > 359*10000)
      loopCount = 0;
    else
      loopCount++;

    // Process shots
    for (var i = shots.length - 1; i >= 0; i--) {
      shots[i].render();
      shots[i].update();
      if (shots[i].offscreen()) {
        shots.splice(i, 1);
      }
      else {
        let shotData = { x: shots[i].pos.x, y: shots[i].pos.y, 
          shotid: shots[i].shotid };
        socket.emit('ClientMoveShot', shotData);
      }
    }
    // Process all the tanks by iterating through the tanks array
    if(tanks && tanks.length > 0) {
      for (var t = 0; t < tanks.length; t++) {
        if(tanks[t].tankid==mytankid) {
          tanks[t].render();
          tanks[t].turn();
          tanks[t].update();

          // Check for off screen and don't let it go any further
          if(tanks[t].pos.x < 0)
            tanks[t].pos.x = 0;
          if(tanks[t].pos.x > win.width)
            tanks[t].pos.x = win.width;
          if(tanks[t].pos.y < 0)
            tanks[t].pos.y = 0;
          if(tanks[t].pos.y > win.height)
            tanks[t].pos.y = win.height;
            
        }
        else {  // Only render if within 150 pixels
//          var dist = Math.sqrt( Math.pow((tanks[myTankIndex].pos.x-tanks[t].pos.x), 2) + Math.pow((tanks[myTankIndex].pos.y-tanks[t].pos.y), 2) );
//          if(dist < 151)
            tanks[t].render();
        }
      }
      
      // Temporary Buzzsaw
      if(buzz) {
        buzz.render(this.loopCount);
        buzz.update(tanks[myTankIndex]);
        buzz.checkBuzzShot();
      }
    }

      // To keep this program from being too chatty => Only send server info if something has changed
      if(tanks && tanks.length > 0 && myTankIndex > -1
        && (oldTankx!=tanks[myTankIndex].pos.x || oldTanky!=tanks[myTankIndex].pos.y || oldTankHeading!=tanks[myTankIndex].heading)) {
        let newTank = { x: tanks[myTankIndex].pos.x, y: tanks[myTankIndex].pos.y, 
          heading: tanks[myTankIndex].heading, tankColor: tanks[myTankIndex].tankColor, 
          tankid: tanks[myTankIndex].tankid };
        socket.emit('ClientMoveTank', newTank);
        oldTankx = tanks[myTankIndex].pos.x;
        oldTanky = tanks[myTankIndex].pos.y;
        oldTankHeading = tanks[myTankIndex].heading;
      }
    }
    

  // Handling pressing a Keys
  function keyPressed() {

    if(!tanks || myTankIndex < 0)
      return;

    // Can not be a destroyed tank!
    if (tanks[myTankIndex].destroyed)
      return;

    if (key == ' ') {                       // Fire Shell
      const shotid = random(0, 50000);
      shots.push(new Shot(shotid, tanks[myTankIndex].tankid, tanks[myTankIndex].pos, 
        tanks[myTankIndex].heading, tanks[myTankIndex].tankColor));
      let newShot = { x: tanks[myTankIndex].pos.x, y: tanks[myTankIndex].pos.y, heading: tanks[myTankIndex].heading, 
        tankColor: tanks[myTankIndex].tankColor, shotid: shotid, tankid: tanks[myTankIndex].tankid };
      socket.emit('ClientNewShot', newShot);
      // Play a shot sound
      soundLib.playSound('tankfire');

      return;
    } else if (keyCode == RIGHT_ARROW) {  // Move Right
      tanks[myTankIndex].setRotation(0.1);
    } else if (keyCode == LEFT_ARROW) {   // Move Left
      tanks[myTankIndex].setRotation(-0.1);
    } else if (keyCode == UP_ARROW) {     // Move Forward
      tanks[myTankIndex].moveForward(1.0);
    } else if (keyCode == DOWN_ARROW) {   // Move Back
      tanks[myTankIndex].moveForward(-1.0);
    }


  }

  // Release Key
  function keyReleased() {
    if(!tanks || myTankIndex < 0)
      return;

    //    if(keyCode == RIGHT_ARROW || keyCode == LEFT_ARROW)
    tanks[myTankIndex].setRotation(0.0);
//    if(keyCode == UP_ARROW || keyCode == DOWN_ARROW)
    tanks[myTankIndex].stopMotion();
  }

  
  //  ***** Socket communication handlers ******

  function ServerReadyAddNew(data) {
    console.log('Server Ready');

    // Reset the tanks
    tanks = [];
    mytankid = undefined;
    myTankIndex = -1;

    // Create the new tank
    // Make sure it's starting position is at least 20 pixels from the border of all walls
    let startPos = createVector(Math.floor(Math.random()*(win.width-40)+20), Math.floor(Math.random()*(win.height-40)+20));
    let startColor = color(Math.floor(Math.random()*255), Math.floor(Math.random()*255), Math.floor(Math.random()*255));
    let newTank = { x: startPos.x, y: startPos.y, heading: 0, tankColor: startColor, tankid: socketID, playername: PlayerName };


    // Create the new tank and add it to the array
    mytankid = socketID;
    myTankIndex = tanks.length;
    var newTankObj = new Tank(startPos, startColor, mytankid, PlayerName)
    tanks.push(newTankObj);

    // Send this new tank to the server to add to the list
    socket.emit('ClientNewTank', newTank);
  }

    // Server got new tank -- add it to the list
    function ServerNewTankAdd(data) {
      if(DEBUG && DEBUG==1)
        console.log('New Tank: ' + data);
      
      // Add any tanks not yet in our tank array
      var tankFound = false;
      if(tanks !== undefined) {
        for(var d=0; d < data.length; d++) {
          var foundIndex = -1;
          for(var t=0; t < tanks.length; t++) {
            // If found a match, then stop looking
            if(tanks[t].tankid == data[d].tankid) {
              tankFound = true;
              foundIndex = t;
              break;
            }
          }
          if(!tankFound && foundIndex < 0)
          {
            // Add this tank to the end of the array
            let startPos = createVector(Number(data[d].x), Number(data[d].y));
            let c = color(data[d].tankColor.levels[0], data[d].tankColor.levels[1], data[d].tankColor.levels[2]);
            let newTankObj = new Tank(startPos, c, data[d].tankid, data[d].playername);
            tanks.push(newTankObj);
          }
          tankFound = false;
        }
      }
  
    }

    function ServerTankRemove(socketid) {
//      console.log('Remove Tank: ' + socketid);

      if(!tanks || myTankIndex < 0)
      return;

      for (var i = tanks.length - 1; i >= 0; i--) {
        if(tanks[i].tankid == socketid) {
          tanks[i].destroyed = true;
          return;
        }
      }
    }

    function ServerMoveTank(data) {

      if(DEBUG && DEBUG==1)
        console.log('Move Tank: ' + JSON.stringify(data));

      if(!tanks || !tanks[myTankIndex] || !data || !data.tankid || tanks[myTankIndex].tankid == data.tankid)
        return;

      for (var i = tanks.length - 1; i >= 0; i--) {
        if(tanks[i].tankid == data.tankid) {
            tanks[i].pos.x = Number(data.x);
            tanks[i].pos.y = Number(data.y);
            tanks[i].heading = Number(data.heading);
            break;
          }
      }
    }

    function ServerNewShot(data) {
      // First check if this shot is already in our list
      if(shots !== undefined) {
        for(var i=0; i < shots.length; i++) {
          if(shots[i].shotid == data.shotid) {
            return; // dont add it
          }
        }
      }
  
      // Add this shot to the end of the array
      let c = color(data.tankColor.levels[0], data.tankColor.levels[1], data.tankColor.levels[2]);
      shots.push(new Shot(data.shotid, data.tankid, createVector(data.x, data.y), data.heading, c));
    }

    function ServerMoveShot(data) {

      if(DEBUG && DEBUG==1)
        console.log('Move Shot: ' + data);

      for (var i = shots.length - 1; i >= 0; i--) {
        if(shots[i].shotid == data.shotid) {
          shots[i].pos.x = Number(data.x);
          shots[i].pos.y = Number(data.y);
          break;
        }
      }
    }

    // Handle a restart command
    function Restart() {
      socket.emit('ClientResetAll');
    }

    // The call to reload all pages
    function ServerResetAll(data) {
      console.log('Reset System');
      document.forms[0].submit();
//      location.reload();
    }

/************  Buzz Saw  ***************/

  // Set the new target for Buzz
  function ServerBuzzSawNewChaser(data) {
  if(buzz) {
      buzz.setTarget(data);
  }
}

// Set the position of the Buzz saw
function ServerBuzzSawMove(data) {
  if(buzz) {
    buzz.position.x = data.x;
    buzz.position.y = data.y;
    buzz.velocity.x = data.xvel;
    buzz.velocity.y = data.yvel;
  }
}
