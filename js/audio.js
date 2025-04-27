import { Howl, Howler } from 'howler';

// Current playing sound
let currentSound = null;
let currentMusic = null;

// Initialize audio system
export function initAudio() {
  // Set default volume
  Howler.volume(0.8);
}

// Play music from source
export function playMusic(src, musicData) {
  // If there's already music playing, stop it
  if (currentSound) {
    currentSound.stop();
  }
  
  // Create a new Howl instance
  currentSound = new Howl({
    src: [src],
    html5: true,
    autoplay: true,
    loop: true,
    volume: Howler.volume()
  });
  
  // Store current music data
  currentMusic = musicData;
  
  return currentSound;
}

// Pause currently playing music
export function pauseMusic() {
  if (currentSound) {
    currentSound.pause();
  }
}

// Resume currently playing music
export function resumeMusic() {
  if (currentSound) {
    currentSound.play();
  }
}

// Set volume (0-1)
export function setVolume(volume) {
  Howler.volume(volume);
}

// Get current playing music data
export function getCurrentMusic() {
  return currentMusic;
}