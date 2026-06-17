# Gaadiwala

A full-stack cab booking and ride simulation platform built to explore Java Full Stack Development, real-time communication, geospatial calculations, and system design concepts.

Gaadiwala simulates the core experience of modern ride-hailing applications by combining interactive maps, nearest-driver matching, live driver movement, and real-time ride status updates.

---

## Overview

Gaadiwala consists of:

* A React frontend for booking rides and tracking drivers on an interactive map
* A Spring Boot backend that manages ride creation, driver assignment, simulations, and real-time communication
* A simulation engine that orchestrates driver movement and ride state transitions
* WebSocket-based updates that stream driver location and ETA information to the frontend

---

## Architecture

```text
┌─────────────┐
│    Rider    │
└──────┬──────┘
       │
       ▼
┌────────────────────┐
│ React Frontend     │
│ Booking & Tracking │
└─────────┬──────────┘
          │ REST APIs
          ▼
┌────────────────────┐
│ Spring Boot API    │
│ Ride Management    │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Driver Assignment  │
│ Haversine Search   │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Simulation Engine  │
│ Scheduler          │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ WebSocket Broker   │
│ STOMP + SockJS     │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Live Map Updates   │
│ Driver Tracking    │
└────────────────────┘
```

---

## System Flow

```text
Book Ride
    │
    ▼
Find Nearest Driver
    │
    ▼
Driver Assigned
    │
    ▼
Driver Approaching
    │
    ▼
Driver Arrived
    │
    ▼
Trip Started
    │
    ▼
Trip Completed
```

---

## Ride State Machine

```text
SEARCHING
     │
     ▼
DRIVER_FOUND
     │
     ▼
DRIVER_APPROACHING
     │
     ▼
DRIVER_ARRIVED
     │
     ▼
TRIP_STARTED
     │
     ▼
TRIP_COMPLETED
```

---

## Simulation Engine

```text
OSRM Route
     │
     ▼
Coordinate Array
     │
     ▼
Scheduler Tick (1s)
     │
     ▼
Driver Position Update
     │
     ▼
ETA Recalculation
     │
     ▼
WebSocket Broadcast
     │
     ▼
Frontend Animation
```

---

## Technology Stack

### Frontend

* React
* Vite
* React Leaflet
* Tailwind CSS
* StompJS
* SockJS

### Backend

* Java
* Spring Boot
* Spring WebSocket (STOMP)
* Spring Data JPA
* Maven

### Database

* H2 Database
* Hibernate ORM

### External Services

* OpenStreetMap
* OSRM Routing API

---

## Core Features

### Authentication

* User signup and login
* Session persistence

### Ride Booking

* Pickup and destination selection
* Vehicle category selection
* Fare estimation
* Route preview

### Interactive Maps

* Real-time map rendering
* Pickup and destination markers
* Route visualization
* Live driver tracking

### Driver Simulation

* Persistent pool of simulated drivers
* Driver availability management
* Driver assignment lifecycle
* Automatic location updates

### Smart Driver Matching

* Nearest-driver search
* Haversine distance calculations
* Vehicle-based filtering

### Real-Time Communication

* WebSocket updates
* STOMP messaging
* Live ride status changes
* Live ETA updates

### Ride Lifecycle Management

* Driver assignment
* Driver approach simulation
* Pickup handling
* Trip simulation
* Completion handling

### Animation System

* Smooth marker interpolation
* Dynamic marker rotation
* Route progress rendering
* Live status transitions

---

## Simulation Workflow

```text
Create Ride
     │
     ▼
Assign Driver
     │
     ▼
Generate Driver → Pickup Route
     │
     ▼
Simulate Driver Movement
     │
     ▼
Generate Pickup → Destination Route
     │
     ▼
Simulate Trip Movement
     │
     ▼
Release Driver
```

---

## Project Structure

```text
Gaadiwala
│
├── backend
│   ├── controller
│   ├── service
│   ├── repository
│   ├── model
│   ├── websocket
│   ├── scheduler
│   └── config
│
├── frontend
│   ├── components
│   ├── pages
│   ├── hooks
│   ├── services
│   ├── assets
│   └── styles
│
└── README.md
```

---

## Local Development Setup

### Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend runs on:

```text
http://localhost:8080
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

## Learning Objectives

This project was built to explore and gain hands-on experience with:

* Java Full Stack Development
* REST API Design
* Spring Boot Architecture
* Real-Time Communication
* WebSockets and STOMP
* Geospatial Calculations
* Scheduler-Based Systems
* Interactive Mapping
* State Machines
* System Design Concepts
* Frontend and Backend Integration

---

## Project Status

```text
Authentication           ✓
Ride Booking             ✓
Interactive Maps         ✓
Driver Matching          ✓
Ride Simulation          ✓
WebSocket Updates        ✓
Live Driver Tracking     ✓
ETA Calculation          ✓
Animation System         ✓
System Design Concepts   ✓
```

---

## Disclaimer

Gaadiwala was built as a learning project to explore full-stack application development and system design concepts. It is not intended to solve a real-world problem or operate as a production ride-hailing platform.
