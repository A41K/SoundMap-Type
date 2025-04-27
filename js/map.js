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
  // Update status message
  updateStatusMessage('Checking location permissions...');
  
  // Check if geolocation is available
  if (!navigator.geolocation) {
    updateStatusMessage('Geolocation is not supported by your browser', 'error');
    useDefaultLocation(map);
    return;
  }
  
  // Check for permissions API support
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' })
      .then(permissionStatus => {
        // Handle initial permission state
        handlePermissionState(permissionStatus.state, map);
        
        // Listen for permission changes
        permissionStatus.onchange = () => {
          handlePermissionState(permissionStatus.state, map);
        };
      })
      .catch(error => {
        console.error('Error checking geolocation permission:', error);
        // Try to get position anyway
        requestGeolocation(map);
      });
  } else {
    // Permissions API not supported, try to get location directly
    requestGeolocation(map);
  }
}

// Handle different permission states
function handlePermissionState(state, map) {
  switch (state) {
    case 'granted':
      updateStatusMessage('Location access granted, finding your position...');
      requestGeolocation(map);
      break;
    case 'prompt':
      updateStatusMessage('Please allow location access when prompted');
      requestGeolocation(map);
      break;
    case 'denied':
      updateStatusMessage('Location access denied. Using default location.', 'error');
      useDefaultLocation(map);
      break;
    default:
      updateStatusMessage('Unknown permission state. Trying to access location...');
      requestGeolocation(map);
  }
}

// Request geolocation with proper error handling
function requestGeolocation(map) {
  // Show loading indicator
  updateStatusMessage('Locating you...');
  
  // Get initial position
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLatLng = [position.coords.latitude, position.coords.longitude];
      
      // Center map on user's location and zoom in
      map.setView(userLatLng, 15);
      
      // Create user marker
      createUserMarker(map, userLatLng);
      
      // Generate music orbs around user
      generateMusicOrbsAroundUser(map, userLatLng, 60);
      
      // Update status message
      updateStatusMessage('Found your location! Discover music around you.', 'success');
      
      // Start watching position
      startPositionWatching(map);
    },
    (error) => {
      console.error('Error getting location:', error);
      
      // Handle specific error codes
      switch(error.code) {
        case error.PERMISSION_DENIED:
          updateStatusMessage('Location access was denied. Please enable location services in your browser settings.', 'error');
          break;
        case error.POSITION_UNAVAILABLE:
          updateStatusMessage('Location information is unavailable. Using default location.', 'error');
          break;
        case error.TIMEOUT:
          updateStatusMessage('Location request timed out. Using default location.', 'error');
          break;
        default:
          updateStatusMessage('An unknown error occurred. Using default location.', 'error');
      }
      
      useDefaultLocation(map);
    },
    { 
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// Start watching position changes
function startPositionWatching(map) {
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
      updateStatusMessage('Lost your location signal. Some features may be limited.', 'warning');
    },
    { 
      enableHighAccuracy: true, 
      maximumAge: 10000,
      timeout: 15000
    }
  );
}

// Use default location when geolocation fails
function useDefaultLocation(map) {
  const defaultLocation = [40.7128, -74.0060]; // New York
  map.setView(defaultLocation, 10);
  
  // Generate some default music orbs
  generateMusicOrbsAroundUser(map, defaultLocation, 20);
}

// Update status message
function updateStatusMessage(message, type = 'info') {
  const statusMessage = document.getElementById('status-message') || createStatusMessage();
  statusMessage.textContent = message;
  
  // Remove all status classes and add the current one
  statusMessage.className = 'status-message';
  statusMessage.classList.add(type);
  
  // Make sure it's visible
  statusMessage.style.display = 'block';
  
  // For success messages, auto-hide after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusMessage.classList.add('fade-out');
      setTimeout(() => {
        statusMessage.style.display = 'none';
      }, 1000);
    }, 5000);
  }
}

// Create status message element if it doesn't exist
function createStatusMessage() {
  const statusMessage = document.createElement('div');
  statusMessage.id = 'status-message';
  statusMessage.className = 'status-message';
  document.body.appendChild(statusMessage);
  return statusMessage;
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
  
  // Calculate distance using Haversine formula instead of relying on map object
  const distance = calculateDistance(currentLatLng, lastGeneratedPosition);
  
  if (distance > MIN_DISTANCE_FOR_NEW_ORBS) {
    lastGeneratedPosition = currentLatLng;
    return true;
  }
  
  return false;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(point1, point2) {
  const R = 6371e3; // Earth's radius in meters
  const lat1 = point1[0] * Math.PI / 180;
  const lat2 = point2[0] * Math.PI / 180;
  const deltaLat = (point2[0] - point1[0]) * Math.PI / 180;
  const deltaLng = (point2[1] - point1[1]) * Math.PI / 180;
  
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
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