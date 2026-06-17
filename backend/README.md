# Gaadiwala - Backend ☕

The backend engine for **Gaadiwala**, a real-time ride-sharing simulation platform. It handles API requests, matches riders to the nearest driver using geographical formulas, and runs an asynchronous ticketing scheduler to update and broadcast simulated driver coordinates.

## 🛠️ Technology Stack

- **Framework**: Spring Boot
- **Database**: H2 Database (File-based)
- **Protocol**: REST APIs & WebSockets (STOMP over SockJS)
- **Build Tool**: Maven

## 🚀 Simulation Engine

The backend runs a scheduled thread pool simulation (`SimulationScheduler.java`) that triggers every few seconds:
- **Approach**: Simulated driver navigates towards pickup coordinates.
- **Waiting**: Driver arrives and waits for passenger setup.
- **En Route**: Driver proceeds to the final drop-off location.
- **WebSockets**: State coordinates are broadcasted live to `/topic/ride/{id}`.

## ⚙️ Running the Backend

1. Build & package:
   ```bash
   mvn clean install
   ```
2. Run development environment:
   ```bash
   mvn spring-boot:run
   ```
   The backend services will be available at `http://localhost:8080`.
