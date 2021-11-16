
var tankWidth = 20;
var tankHeight = 30;

// A Tank Class
function Tank(startPos, tankColor, newtankid, playerName) {
    this.pos = startPos.copy();
    this.r = 20;
    this.heading = 0;
    this.rotation = 0;
    this.vel = createVector(0, 0);
    this.isBoosting = false;
    this.destroyed = false;
    this.tankColor = tankColor;
    this.tankid = newtankid;
    this.playerName = playerName;

    // For an optional boost feature
    this.boosting = function(b) {
      this.isBoosting = b;
    }
  
    this.boost = function() {
      var force = p5.Vector.fromAngle(this.heading);
      this.vel.add(force);
    }

    // Render - to render the tank to the screen
    this.render = function() {

        push();

        translate(this.pos.x, this.pos.y);
        rotate(this.heading + PI / 2);
        
        if(this.destroyed) {
          // Show destroyed tank
          fill('red');
          ellipse(0, 0, 40, 40);
        }
        else {  // Draw Tank
          if(this.tankid==mytankid)
            stroke('white');
          else
            stroke('gray');
          strokeWeight(2);
          fill(this.tankColor);
          rect(0, 0, tankWidth, tankHeight);
          ellipse(0, -3, 14, 18);
          rect(0, -20, 4, 20);
          strokeWeight(6);
          point(0, 0);
        }
        pop();

        push();
        translate(this.pos.x, this.pos.y);
        fill(this.tankColor);
        textAlign(CENTER);
        if(DEBUG && DEBUG==1)
          text(this.tankid, 0, 30);
        else
          text(this.playerName, 0, 30);
        pop();
    }

    // Moving tank
    this.moveForward = function(a) {
      var force = p5.Vector.fromAngle(this.heading);
      force.mult(a);
      this.vel.add(force);
    }

    this.stopMotion = function() {
      this.vel.x = 0;
      this.vel.y = 0;
      this.vel.z = 0;
    }

    this.setRotation = function(a) {
        this.rotation = a;
    }
    
    this.turn = function() {
        this.heading += this.rotation;
    }

    // Update its forward and backward motion
    this.update = function() {
      if (this.isBoosting) {
        this.boost();
      }
      this.pos.add(this.vel);
    }
}