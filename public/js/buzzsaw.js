

// Buzzsaw class
class Buzzsaw {
    constructor(sposX, sposY, color) {
        this.acceleration = createVector(0, 0);
        this.velocity = p5.Vector.random2D();
        this.position = createVector(sposX, sposY);
        this.r = 3.0;
        this.maxspeed = 3;    // Maximum speed
        this.maxforce = 0.02; // Maximum steering force
        this.color = color;
        this.buzzSound = undefined;
        this.targetTankIndex = -1;
    }

    // Forces go into acceleration
    applyForce(force) {
        this.acceleration.add(force);
    }
    
    // Allow the target to be set
    setTarget(targetTankID) {
        // Find the target tank ID
        for(var i = 0; i < tanks.length; i++) {
            if(tanks[i].tankid == targetTankID) {
                this.targetTankIndex = i;

                // Warn the user they are the target!
                if(targetTankID==mytankid)
                    soundLib.playSound('dpop');

                return;
            }
        }
        this.targetTankIndex = -1;
    }


    // Method to update location
    update() {
        // If target is designated and it's me calculate it!
//        if(this.targetTankIndex > -1
//             && this.targetTankIndex == myTankIndex) {
            
            let target = tanks[myTankIndex];
            // Update the steering toward the target
            let steeringForce = this.seek(target.pos);
            this.acceleration.add(steeringForce);
            // Update velocity
            this.velocity.add(this.acceleration);
            // Limit speed
            this.velocity.limit(this.maxspeed);
            this.position.add(this.velocity);
            // Reset acceleration to 0 each cycle
            this.acceleration.mult(0);

            if(dist(this.position.x, this.position.y, target.pos.x, target.pos.y) < 20.0)
                soundLib.playSound('saw');
            
            
            // Send out position to all other clients (via server)
            // only if I'm the follower and only every x frames
            if(this.targetTankIndex > -1
                && this.targetTankIndex == myTankIndex
                && loopCount%1000) {
                // Make a simple json object to send
                let newPos = { x: this.position.x, y: this.position.y,
                    xvel: this.velocity.x, yvel: this.velocity.y };
                socket.emit('ClientBuzzSawMove', newPos);
            }

    }

    // Render the shot to the screen
    render(loopCount) {
        push();
            translate(this.position.x,this.position.y);
            rotate(loopCount);
            fill(this.color);
            stroke(200);
            rect(0,0, 16, 16);
        pop();
    }

    // A method that calculates and applies a steering force towards a target
    // STEER = DESIRED MINUS VELOCITY
    seek(target) {
        if(!target)
            return;
        let desired = p5.Vector.sub(target, this.position); // A vector pointing from the location to the target
        // Normalize desired and scale to maximum speed
        desired.normalize();
        desired.mult(this.maxspeed);
        // Steering = Desired minus Velocity
        let steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxforce); // Limit to maximum steering force
        return steer;
    }

    checkBuzzShot() {
        for(var i=0; i < shots.length; i++) {
            if(dist(this.position.x, this.position.y, shots[i].pos.x, shots[i].pos.y) < 20) {
                socket.emit('ClientBuzzSawHit');
                return;
            }

        }
    }
}