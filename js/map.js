import L from 'leaflet';
import { playMusic, pauseMusic } from './audio.js';

// Event bus for communication between modules
const eventBus = window.eventBus = window.eventBus || {
  events: {},
  emit: function(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  },
  on: function(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
};


// Initialize the map
export function initMap(elementId) {
  // Create a map centered on a neutral location
  const map = L.map(elementId).setView([20, 0], 3);
  
  // Add a dark theme tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);
  
  return map;
}

// Create a music orb on the map
export function createMusicOrb(map, music) {
  // Create a custom icon for the music orb
  const orbSize = getOrbSizeByRarity(music.rarity);
  const orbIcon = L.divIcon({
    className: `music-orb ${music.genre.toLowerCase()}`,
    iconSize: [orbSize, orbSize],
    html: `<div style="width:100%;height:100%;"></div>`
  });
  
  // Create a marker with the custom icon
  const marker = L.marker([music.lat, music.lng], {
    icon: orbIcon,
    title: music.title
  }).addTo(map);
  
  // Add click event to play music
  marker.on('click', () => {
    playMusic(music.audioSrc, music);
    // Use event bus to notify about music selection instead of direct function call
    eventBus.emit('musicSelected', music);
  });
  
  return marker;
}

// Get orb size based on rarity
function getOrbSizeByRarity(rarity) {
  switch(rarity.toLowerCase()) {
    case 'common':
      return 30;
    case 'uncommon':
      return 35;
    case 'rare':
      return 40;
    case 'epic':
      return 45;
    case 'legendary':
      return 50;
    default:
      return 30;
  }
}