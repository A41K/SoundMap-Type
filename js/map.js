import L from 'leaflet';
import { playMusic, pauseMusic } from './audio.js';
import { getRandomMusic } from './data.js';

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

// User location marker
let userMarker = null;
let userCircle = null;

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
  
  // Initialize user location tracking
  initUserLocationTracking(map);
  
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

// Initialize user location tracking
function initUserLocationTracking(map) {
  // Check if geolocation is available
  if (navigator.geolocation) {
    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLatLng = [position.coords.latitude, position.coords.longitude];
        
        // Center map on user's location and zoom in
        map.setView(userLatLng, 15);
        
        // Create user marker
        createUserMarker(map, userLatLng);
        
        // Generate music orbs around user
        generateMusicOrbsAroundUser(map, userLatLng, 30); // Generate 20 orbs
      },
      (error) => {
        console.error('Error getting location:', error);
        // If location access is denied, use a default location
        const defaultLocation = [40.7128, -74.0060]; // New York
        map.setView(defaultLocation, 10);
      },
      { enableHighAccuracy: true }
    );
    
    // Watch for position changes
    navigator.geolocation.watchPosition(
      (position) => {
        const userLatLng = [position.coords.latitude, position.coords.longitude];
        
        // Update user marker
        updateUserMarker(map, userLatLng);
        
        // Check if we need to generate more orbs
        if (shouldGenerateMoreOrbs(userLatLng)) {
          generateMusicOrbsAroundUser(map, userLatLng, 5); // Generate 5 more orbs
        }
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  }
}

// Create user marker on the map
function createUserMarker(map, latLng) {
  // Create user position marker
  const userIcon = L.divIcon({
    className: 'user-marker',
    iconSize: [20, 20],
    html: `<div style="width:100%;height:100%;background-color:#1DB954;border-radius:50%;border:2px solid white;"></div>`
  });
  
  userMarker = L.marker(latLng, {
    icon: userIcon,
    zIndexOffset: 1000 // Make sure user is on top
  }).addTo(map);
  
  // Add a circle to show approximate range
  userCircle = L.circle(latLng, {
    radius: 300, // 300 meters radius
    color: '#1DB954',
    fillColor: '#1DB954',
    fillOpacity: 0.1,
    weight: 1
  }).addTo(map);
}

// Update user marker position
function updateUserMarker(map, latLng) {
  if (userMarker && userCircle) {
    userMarker.setLatLng(latLng);
    userCircle.setLatLng(latLng);
  } else {
    createUserMarker(map, latLng);
  }
}

// Last generated position
let lastGeneratedPosition = null;
const MIN_DISTANCE_FOR_NEW_ORBS = 200; // meters

// Check if we should generate more orbs based on distance moved
function shouldGenerateMoreOrbs(currentLatLng) {
  if (!lastGeneratedPosition) {
    lastGeneratedPosition = currentLatLng;
    return true;
  }
  
  // Calculate distance between last generation point and current position
  const distance = map.distance(currentLatLng, lastGeneratedPosition);
  
  if (distance > MIN_DISTANCE_FOR_NEW_ORBS) {
    lastGeneratedPosition = currentLatLng;
    return true;
  }
  
  return false;
}

// Generate random music orbs around a position
function generateMusicOrbsAroundUser(map, centerLatLng, count) {
  for (let i = 0; i < count; i++) {
    // Generate a random position within 500 meters
    const randomLatLng = getRandomLatLngAround(centerLatLng, 500);
    
    // Get a random music entry
    const randomMusic = getRandomMusic();
    
    // Override the location with our random one
    const musicWithLocation = {
      ...randomMusic,
      lat: randomLatLng[0],
      lng: randomLatLng[1]
    };
    
    // Create the orb
    createMusicOrb(map, musicWithLocation);
  }
}

// Generate a random position around a center point
function getRandomLatLngAround(centerLatLng, radiusInMeters) {
  // Convert radius from meters to degrees (approximate)
  const radiusInDegrees = radiusInMeters / 111000; // 111000 meters = 1 degree (approximate)
  
  // Generate random angle and distance
  const randomAngle = Math.random() * Math.PI * 2; // Random angle in radians
  const randomDistance = Math.random() * radiusInDegrees; // Random distance within radius
  
  // Calculate offset
  const latOffset = randomDistance * Math.cos(randomAngle);
  const lngOffset = randomDistance * Math.sin(randomAngle) / Math.cos(centerLatLng[0] * Math.PI / 180);
  
  // Return new position
  return [
    centerLatLng[0] + latOffset,
    centerLatLng[1] + lngOffset
  ];
}