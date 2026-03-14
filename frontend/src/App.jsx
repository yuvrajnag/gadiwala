import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import BookingInterface from './pages/BookingInterface';
import BookedInterface from './pages/BookedInterface';
import BookedInterface2 from './pages/BookedInterface2';
import DriverDashboard from './pages/DriverDashboard';
import './App.css';

// Simple placeholder components for sub-pages
const Placeholder = ({ title }) => (
  <div className="placeholder-page">
    <h1>{title}</h1>
    <p>This is a placeholder for the {title} page.</p>
    <button onClick={() => window.history.back()}>Go Back</button>
  </div>
);

function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Customer Routes */}
        <Route path="/booking-interface" element={<BookingInterface />} />
        <Route path="/booked-interface" element={<BookedInterface />} />
        <Route path="/ride" element={<Navigate to="/booked-interface" replace />} />
        <Route path="/bus-booking" element={<Placeholder title="Bus Booking" />} />
        <Route path="/rentals" element={<Placeholder title="Rentals" />} />
        <Route path="/metro" element={<Placeholder title="Metro" />} />
        <Route path="/courier" element={<Placeholder title="Courier" />} />
        <Route path="/profile" element={<Placeholder title="Profile" />} />

        {/* Driver Routes */}
        <Route path="/booked-interface2" element={<BookedInterface2 />} />
        <Route path="/driver-dashboard" element={<DriverDashboard />} />
        <Route path="/activity" element={<Placeholder title="Activity" />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
