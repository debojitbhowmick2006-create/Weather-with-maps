# 🌍 Aero Weather 

A sleek, premium weather application featuring an interactive 3D Globe, real-time weather data, and a modern glassmorphism UI. Search for any city or drop a pin anywhere on Earth to get instant weather updates and explore the location.

![Aero Weather Screenshot](https://raw.githubusercontent.com/debojitbhowmick2006-create/Weather-with-maps/main/screenshot.png) *(You can add a screenshot here later)*

## ✨ Features

- **Interactive 3D Earth:** Powered by `Globe.gl` and `Three.js`, the background features a stunning, draggable 3D globe with atmospheric glow and realistic textures.
- **Real-Time Global Weather:** Fetches live temperature, humidity, wind speed, and weather conditions using the free [Open-Meteo API](https://open-meteo.com/).
- **Premium Glassmorphism UI:** Features a sleek dark mode, frosted glass panels (`backdrop-filter`), smooth CSS animations, and a modern typography stack (*Plus Jakarta Sans*).
- **Embedded 2D Mini-Map:** Automatically opens a sleek, dark-themed 2D street map (`Leaflet.js`) inside the weather card so you can see the local geography.
- **Deep-Zoom Animations:** Searching for a city or clicking on the globe triggers a smooth, cinematic camera fly-in to the specific location.
- **Google Maps Integration:** Instantly open any searched or clicked coordinate directly in Google Maps with one click.
- **Geolocation Support:** Instantly find the weather for your current physical location.

## 🚀 Built With

- **Vanilla HTML / CSS / JavaScript** (No build tools required!)
- **[Globe.gl](https://globe.gl/)** & **Three.js** (3D Earth rendering)
- **[Leaflet.js](https://leafletjs.com/)** (2D Mini-Map)
- **[Open-Meteo API](https://open-meteo.com/)** (Weather forecasting & Geocoding)
- **[Nominatim (OpenStreetMap)](https://nominatim.org/)** (Reverse geocoding)
- **CartoDB** (Dark map tiles)

## 🛠️ Usage / Installation

Since this project uses vanilla web technologies and public APIs with no API keys required, you can run it instantly!

### Option 1: Live Server (Recommended)
Use any local HTTP server (like VS Code's "Live Server" extension, Python, or Node's `http-server`) to serve the directory:
```bash
# Using Python 3
python -m http.server 8080

# Using Node.js http-server
npx http-server -p 8080
