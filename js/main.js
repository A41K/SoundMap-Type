import { initMap, createMusicOrb } from './map.js';
import { initAudio, playMusic, pauseMusic, setVolume } from './audio.js';
import { musicData } from './data.js';

// Get reference to the event bus
const eventBus = window.eventBus = window.eventBus || {};

// Initialize the map
const map = initMap('map');

// Initialize audio system
initAudio();

// Create initial music orbs on the map (these will be supplemented by dynamically generated orbs)
// Only create a subset of the predefined orbs to avoid cluttering the map
musicData.slice(0, 10).forEach(music => {
  createMusicOrb(map, music);
});

// Add status message for user
const statusMessage = document.createElement('div');
statusMessage.id = 'status-message';
statusMessage.className = 'status-message';
statusMessage.textContent = 'Locating you and generating music orbs nearby...';
document.body.appendChild(statusMessage);

// Hide status message after 5 seconds
setTimeout(() => {
  statusMessage.classList.add('fade-out');
  setTimeout(() => {
    statusMessage.remove();
  }, 1000);
}, 5000);

// Handle play/pause button
const togglePlayButton = document.getElementById('toggle-play');
togglePlayButton.addEventListener('click', () => {
  if (togglePlayButton.textContent === 'Pause') {
    pauseMusic();
    togglePlayButton.textContent = 'Play';
  } else {
    playMusic();
    togglePlayButton.textContent = 'Pause';
  }
});

// Handle volume control
const volumeSlider = document.getElementById('volume');
volumeSlider.addEventListener('input', () => {
  const volume = volumeSlider.value / 100;
  setVolume(volume);
});

// Listen for music selection events
eventBus.on('musicSelected', showMusicInfo);

// Function to show music info panel
function showMusicInfo(music) {
  const musicInfoPanel = document.getElementById('music-info');
  const songTitle = document.getElementById('song-title');
  const artist = document.getElementById('artist');
  const genre = document.getElementById('genre');
  const rarityValue = document.getElementById('rarity-value');
  
  songTitle.textContent = music.title;
  artist.textContent = music.artist;
  genre.textContent = `Genre: ${music.genre}`;
  
  // Set rarity with appropriate class
  rarityValue.textContent = music.rarity;
  rarityValue.className = music.rarity.toLowerCase();
  
  // Show the panel
  musicInfoPanel.classList.remove('hidden');
}

// Function to hide music info panel
function hideMusicInfo() {
  const musicInfoPanel = document.getElementById('music-info');
  musicInfoPanel.classList.add('hidden');
}