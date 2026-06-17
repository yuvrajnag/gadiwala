# Gaadiwala - Frontend 🌐

The frontend client for **Gaadiwala**, a real-time ride-sharing and driver-simulation platform. Built using React and Vite, it leverages Leaflet maps and WebSockets to present real-time simulation updates and booking flows.

## 🛠️ Technology Stack

- **Framework**: React 19 (Vite)
- **Mapping**: Leaflet / React-Leaflet
- **Styling**: Tailwind CSS & custom animations
- **Communication**: WebSockets (StompJS / SockJS) for real-time driver coordinates

## ⚙️ Setup & Configuration

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create or configure your `.env` file in the root of the `frontend` folder with your MapMyIndia credentials:
   ```env
   VITE_MAPMYINDIA_CLIENT_ID=your_client_id
   VITE_MAPMYINDIA_CLIENT_SECRET=your_client_secret
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to interact with the application.
