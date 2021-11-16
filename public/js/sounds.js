
// Sound class for playing a sound.  http://soundbible.com is a 
// good free sounrce of mp3 and wav files.  Put both in the sounds
// folder then read directions below to use
class sounds {

    constructor() {
        this.loadedSounds = [];
    }

    // Load a sound - only called from the userStartAudio() function block
    // but must be called to get a sound to work.  All sounds must be unique
    // The sound you pass is the filename without the extension.
    // Put all sounds in the sounds folder in mp3 and wav file types
    loadLibSound(soundName) {
        // Check if already loaded...
        if(this.loadedSounds && this.loadedSounds[soundName])
            return;
        else {
            // Load the new sound
            soundFormats('mp3', 'wav');
            let objSound = loadSound('./sounds/' + soundName + '.mp3');
            var objSoundPack = {
                'soundName': soundName,
                'sound': objSound
            };
            this.loadedSounds[soundName] = objSoundPack;
        }
    }

    // Play a Sound - this sound must have been loaded prior with
    // the loadLibSound function.
    playSound(soundName) {
        var soundActivated = document.getElementById('soundOnOff');
        // Sound is active on this client?
        if(soundActivated.checked) {
            // If loaded and is not playing, play it
            if(this.loadedSounds[soundName] 
                && this.loadedSounds[soundName].sound
                && this.loadedSounds[soundName].sound.isLoaded())
//                && !this.loadedSounds[soundName].sound.isPlaying())
                        this.loadedSounds[soundName].sound.play();

        }
    }
}

