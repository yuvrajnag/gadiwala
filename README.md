# Gaadiwala 🚗💨

Gaadiwala is a real-time ride-sharing and driver-simulation platform. It consists of a React-based frontend mapping interface and a Spring Boot-based backend that simulates real-time driver movement, manages ride statuses, and coordinates matching between riders and drivers.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), React-Leaflet (Map integration), WebSockets (StompJS) for real-time tracking, Tailwind CSS.
- **Backend**: Java Spring Boot, Spring WebSocket (STOMP), Spring Data JPA, H2 Database (in-memory/file).

## 🚀 Key Features

- **Interactive Map**: View live locations of drivers and request pickups/destinations.
- **Smart Vehicle Matching**: Dynamically find and assign the nearest available driver using the **Haversine formula** depending on the selected vehicle class (Bike, Auto, Cab, etc.).
- **Live Movement Simulation**: Simulated drivers move along routing steps, sending real-time position updates to the client via WebSockets.
- **Dynamic Simulation Phases**:
  - `APPROACH`: Driver travels to the rider's pickup point.
  - `WAITING`: Driver waits for the rider at the pickup location.
  - `EN_ROUTE`: Driver transports the rider to the destination.
  - `COMPLETED`: Ride finishes, and driver is freed.

## 📂 Project Structure

- `backend/`: Spring Boot Java project handling APIs, WebSockets, and driver/ride simulation state.
- `frontend/`: React Vite application containing maps, booking cards, and the real-time simulation UI.

---

## 💻 Setup Instructions

### 1. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Build the project using Maven:
   ```bash
   mvn clean install
   ```
3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
   The server will start at `http://localhost:8080`.

### 2. Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.
