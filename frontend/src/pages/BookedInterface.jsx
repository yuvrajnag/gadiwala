import { useNavigate, useLocation } from 'react-router-dom';
import { Car, Bus, Key, Train, Package, User, CheckCircle, Send, Loader, ArrowLeft, MapPin } from 'lucide-react';
import { mockDb } from '../mockDb';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import navBarImg from '../assets/nav bar.png';
import logoImg from '../assets/logo.png';
import chatImgAsset from '../assets/chat.png';
import rideDetailsImgAsset from '../assets/ride details.png';
import driverDetailsImgAsset from '../assets/driver details.png';
import scootyAsset from '../assets/scooty.png';

// ─── Custom Map Markers ───
const pickupIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:18px;height:18px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const dropIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:16px;height:16px;background:#ef4444;border:3px solid #fff;border-radius:3px;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

const BookedInterface = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const rideId = location.state?.rideId;

    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [showQuickTips, setShowQuickTips] = useState(true);

    useEffect(() => {
        if (!rideId) {
            // Fallback for testing/direct access
            const allRides = mockDb.rides.getAll();
            if (allRides.length > 0) {
                setRide(allRides[allRides.length - 1]);
                setLoading(false);
            }
            return;
        }

        const loadContent = () => {
            setLoading(true);
            const rideData = mockDb.rides.getById(rideId);
            if (rideData) {
                setRide(rideData);
            }
            setLoading(false);
        };

        loadContent();

        const pollInterval = setInterval(() => {
            const updatedRide = mockDb.rides.getById(rideId);
            if (!updatedRide) return;
            setRide(updatedRide);
            if (updatedRide.status === 'cancelled') {
                alert('Ride cancelled');
                navigate('/booking-interface');
            }
        }, 2000);

        return () => clearInterval(pollInterval);
    }, [rideId, navigate]);

    const quickTips = ["Please come fast", "I'm at the pickup point", "I'm waiting"];

    const handleSendMessage = (text, type = 'bubble') => {
        if (!text.trim()) return;
        setMessages([...messages, { text, sender: 'user', type }]);
        setInputText('');
        if (type === 'plain') setShowQuickTips(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage(inputText, 'bubble');
            setShowQuickTips(false);
        }
    };

    const mainServices = [
        { name: 'booked interface', icon: <Car size={24} />, path: '/booked-interface' },
        { name: 'Bus', icon: <Bus size={24} />, path: '/bus-booking' },
        { name: 'Rentals', icon: <Key size={24} />, path: '/rentals' },
        { name: 'Metro', icon: <Train size={24} />, path: '/metro' },
        { name: 'Courier', icon: <Package size={24} />, path: '/courier' },
    ];

    const driverDetails = ride?.driver_details || {
        name: 'Babu',
        vehicle_name: 'honda activa',
        number_plate: 'TS 08 BH 7960',
        arrival_time: '2mins'
    };

    return (
        <div className="customer-dashboard-new">
            <aside className="sidebar-nav" style={{ backgroundImage: `url("${navBarImg}")` }}>
                <div className="logo-container">
                    <img src={logoImg} alt="Logo" className="nav-logo" />
                </div>
                <div className="nav-items-wrapper">
                    {mainServices.map((service) => (
                        <button key={service.name} className={`nav-btn ${service.name === 'booked interface' ? 'active' : ''}`}
                            onClick={() => navigate(service.path)} title={service.name}>
                            {service.icon}
                        </button>
                    ))}
                </div>
                <div className="bottom-nav-items">
                    <button className="nav-btn" onClick={() => navigate('/profile')} title="Profile">
                        <User size={24} />
                    </button>
                </div>
            </aside>

            <main className="main-content-area booked-interface-main">
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
                        <Loader className="spin" size={40} />
                        <span style={{ marginLeft: '0.625rem' }}>Loading trip details...</span>
                    </div>
                ) : (
                    <div className="booked-final-layout">
                        <div className="left-panel">
                            {/* Dynamic Map Replacement */}
                            <div className="map-view-img" style={{ position: 'relative', overflow: 'hidden', padding: 0 }}>
                                {ride?.pickup_coords && ride?.drop_coords ? (
                                    <MapContainer
                                        center={[ride.pickup_coords.lat, ride.pickup_coords.lng]}
                                        zoom={14}
                                        style={{ width: '100%', height: '100%' }}
                                        zoomControl={false}
                                        attributionControl={false}
                                    >
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                        <Marker position={[ride.pickup_coords.lat, ride.pickup_coords.lng]} icon={pickupIcon} />
                                        <Marker position={[ride.drop_coords.lat, ride.drop_coords.lng]} icon={dropIcon} />
                                        {ride.route_coords && <Polyline positions={ride.route_coords} color="#22c55e" weight={4} opacity={0.8} />}
                                    </MapContainer>
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                        Map data unavailable
                                    </div>
                                )}
                            </div>

                            <div className="dynamic-driver-details" style={{ backgroundImage: `url("${driverDetailsImgAsset}")` }}>
                                <div className="driver-main-header">
                                    <div className="driver-avatar-large"></div>
                                    <div className="driver-meta">
                                        <div className="driver-name-row">
                                            <span className="driver-full-name">{driverDetails.name}</span>
                                            <CheckCircle size={16} className="verified-icon-alt" />
                                        </div>
                                        <div className="driver-rating-row">
                                            <span className="star-icon">★</span>
                                            <span className="rating-value">4.8</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="vehicle-info-row">
                                    <img src={scootyAsset} alt="Vehicle" className="vehicle-large-img" />
                                    <div className="vehicle-details-text">
                                        <div className="vehicle-model">{driverDetails.vehicle_name}</div>
                                        <div className="vehicle-plate">{driverDetails.number_plate}</div>
                                    </div>
                                </div>
                                <div className="status-footer">
                                    <span className="current-status" style={{ color: '#22c55e' }}>Arriving in {driverDetails.arrival_time}</span>
                                </div>
                            </div>
                        </div>

                        <div className="right-panel">
                            <div className="mini-trip-details" style={{ backgroundImage: `url("${rideDetailsImgAsset}")` }}>
                                <h3 className="trip-details-title">Trip details</h3>
                                <div className="mini-location-box">
                                    <div className="mini-location-indicator">
                                        <div className="mini-indicator-dot"></div>
                                        <div className="mini-indicator-line"></div>
                                        <div className="mini-indicator-square"></div>
                                    </div>
                                    <div className="mini-location-inputs">
                                        <div className="mini-location-text">{(ride?.pickup_name || '').split(',')[0]}</div>
                                        <div className="mini-location-divider"></div>
                                        <div className="mini-location-text">{(ride?.drop_name || '').split(',')[0]}</div>
                                    </div>
                                </div>
                                <div className="trip-stats-container">
                                    <div className="trip-stat-row">
                                        <span className="stat-label">OTP</span>
                                        <span className="stat-value otp-badge">{ride?.otp || '7821'}</span>
                                    </div>
                                    <div className="trip-stat-divider"></div>
                                    <div className="trip-stat-row">
                                        <span className="stat-label">Fare</span>
                                        <span className="stat-value">{ride?.fare}</span>
                                    </div>
                                    <div className="trip-stat-divider"></div>
                                    <div className="trip-stat-row">
                                        <span className="stat-label">Distance</span>
                                        <span className="stat-value">{ride?.distance}</span>
                                    </div>
                                </div>
                                <button className="cancel-ride-btn" onClick={() => navigate('/booking-interface')}>Cancel Ride</button>
                            </div>

                            <div className="dynamic-chat-container" style={{ backgroundImage: `url("${chatImgAsset}")` }}>
                                <div className="chat-header">
                                    <div className="driver-avatar-circle"></div>
                                    <div className="driver-info">
                                        <span className="driver-name">{driverDetails.name.toLowerCase()}</span>
                                        <CheckCircle size={14} className="verified-icon" />
                                    </div>
                                </div>
                                <div className="chat-messages-area">
                                    {messages.map((msg, index) => (
                                        <div key={index} className={`message-bubble ${msg.sender}`}>{msg.text}</div>
                                    ))}
                                    {showQuickTips && (
                                        <div className="quick-tips-container">
                                            {quickTips.map((tip, index) => (
                                                <button key={index} className="quick-tip-btn" onClick={() => handleSendMessage(tip, 'plain')}>{tip}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="chat-input-wrapper">
                                    <div className="chat-input-bar">
                                        <input type="text" placeholder="Type your message" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={handleKeyPress} />
                                        <button className="send-msg-btn" onClick={() => handleSendMessage(inputText)}><Send size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default BookedInterface;
