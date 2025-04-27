# SoundMap - Discover Music Around the World

SoundMap is an interactive web application that displays music orbs on a world map. Each orb represents a different music track with its own genre and rarity level. Users can explore the map, click on orbs to play music, and discover new tracks from around the world.

## Features

- **Interactive World Map**: Navigate a dark-themed world map to discover music orbs
- **Genre-Based Orbs**: Music orbs are color-coded by genre (Rock, Pop, Electronic, HipHop, Jazz, Classical, Indie, Metal)
- **Rarity System**: Tracks have different rarity levels (Common, Uncommon, Rare, Epic, Legendary) with corresponding visual indicators
- **Music Playback**: Click on orbs to play music with volume control
- **Track Information**: View details about the currently playing track

## Technologies Used

- **Leaflet.js**: For the interactive map functionality
- **Howler.js**: For audio playback capabilities
- **Vite**: For fast development and building

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`

## How to Use

1. Navigate the map by dragging and zooming
2. Click on colored orbs to play music from that location
3. Use the play/pause button to control playback
4. Adjust volume using the volume slider
5. View track information in the info panel that appears when a track is playing

## Customization

You can add your own music tracks by editing the `data.js` file. Each track requires the following information:

- Title
- Artist
- Genre
- Rarity level
- Geographic coordinates (latitude and longitude)
- Audio source URL

## License

This project is open source and available under the MIT License.