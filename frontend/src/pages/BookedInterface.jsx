import { useNavigate, useLocation } from 'react-router-dom';
import { Car, Bus, Key, Train, Package, User, CheckCircle, Send, Loader, ArrowLeft, MapPin, X, Star, CreditCard, Banknote, AlertTriangle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useWebSocket } from '../hooks/useWebSocket';
import AnimatedDriverMarker from '../components/AnimatedDriverMarker';

import navBarImg from '../assets/nav bar.png';
import logoImg from '../assets/logo.png';
import chatImgAsset from '../assets/chat.png';
import rideDetailsImgAsset from '../assets/ride details.png';
import driverDetailsImgAsset from '../assets/driver details.png';
import maheshAvatar from '../assets/mahesh.png';

// Vehicle assets (same as BookingInterface mode selection)
import bikeAsset from '../assets/bike.png';
import scootyAsset from '../assets/scooty.png';
import autoAsset from '../assets/auto.png';
import cabNonAcAsset from '../assets/cab non ac.png';
import cabPremiumAsset from '../assets/cab premium.png';
import cabXlAsset from '../assets/cab xl.png';

// Map vehicle_type to asset image
const vehicleAssetMap = {
    'bike': bikeAsset,
    'scooty': scootyAsset,
    'auto': autoAsset,
    'cab-non-ac': cabNonAcAsset,
    'cab-premium': cabPremiumAsset,
    'cab-xl': cabXlAsset,
};

const getVehicleAsset = (vehicleType) => vehicleAssetMap[vehicleType] || scootyAsset;

// ─── Uber Pins with Address Labels ───
const createUberPin = (color, addressText, isSquare = false) => {
    const borderRad = isSquare ? '2px' : '50%';
    const addressLabel = addressText ? addressText.split(',')[0] : '';
    return L.divIcon({
        className: 'uber-pin-marker',
        html: `
            <div style="display: flex; align-items: center; white-space: nowrap; pointer-events: none;">
                <div style="width: 12px; height: 12px; background: ${color}; border: 3px solid #000; border-radius: ${borderRad}; box-shadow: 0 2px 6px rgba(0,0,0,0.4); flex-shrink: 0;"></div>
                <div style="margin-left: 8px; background: #000; color: #fff; font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.35); text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(255,255,255,0.15);">
                    ${addressLabel}
                </div>
            </div>
        `,
        iconSize: [200, 24],
        iconAnchor: [6, 6]
    });
};

// ─── Auto-fit map bounds ───
const FitBounds = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords && coords.length >= 2) {
            const bounds = L.latLngBounds(coords);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }, [coords, map]);
    return null;
};

// ─── Animated Polyline that draws itself ───
const AnimatedPolyline = ({ positions, color, weight, opacity, onComplete, duration = 2000 }) => {
    const [visiblePositions, setVisiblePositions] = useState([]);
    const animRef = useRef(null);

    useEffect(() => {
        if (!positions || positions.length < 2) return;
        
        const totalPoints = positions.length;
        const startTime = performance.now();

        const animate = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const idx = Math.floor(progress * (totalPoints - 1)) + 1;
            setVisiblePositions(positions.slice(0, Math.min(idx, totalPoints)));

            if (progress < 1) {
                animRef.current = requestAnimationFrame(animate);
            } else {
                setVisiblePositions(positions);
                if (onComplete) onComplete();
            }
        };

        animRef.current = requestAnimationFrame(animate);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [positions, duration]);

    if (visiblePositions.length < 2) return null;
    return <Polyline positions={visiblePositions} color={color} weight={weight} opacity={opacity} />;
};

const BookedInterface = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const rideId = location.state?.rideId;

    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [showQuickTips, setShowQuickTips] = useState(true);
    const [liveStatus, setLiveStatus] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [progress, setProgress] = useState(0);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [rating, setRating] = useState(5);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    
    // Map animation phase: 'approach' → 'trip'
    const [mapPhase, setMapPhase] = useState('approach');
    const [approachRoute, setApproachRoute] = useState([]);
    const [tripRoute, setTripRoute] = useState([]);
    const [approachDone, setApproachDone] = useState(false);

    useEffect(() => {
        if (liveStatus === 'TRIP_COMPLETED') {
            setShowCompletionModal(true);
        }
        // When trip starts, switch map to trip phase
        if (liveStatus === 'TRIP_STARTED' || liveStatus === 'TRIP_COMPLETED') {
            setMapPhase('trip');
        }
    }, [liveStatus]);

    const handleConfirmCancel = () => {
        setShowCancelModal(false);
        navigate('/booking-interface');
    };

    const onMessageReceived = (msg) => {
        if (msg.status) {
            setLiveStatus(msg.status);
        }

        if (msg.driverLat && msg.driverLng) {
            setDriverLocation({ lat: msg.driverLat, lng: msg.driverLng });
        }

        if (msg.progress !== undefined) {
            setProgress(msg.progress);
        }

        if (msg.eta !== undefined || msg.progress !== undefined) {
            setRide(prev => {
                let arrivalText = prev?.driver_details?.arrival_time || 'Calculating...';
                if (msg.eta !== undefined) {
                    if (msg.eta <= 0) {
                        arrivalText = 'Arriving now';
                    } else if (msg.eta < 60) {
                        arrivalText = `${msg.eta} secs`;
                    } else {
                        arrivalText = `${Math.ceil(msg.eta / 60)} min`;
                    }
                }

                return {
                    ...prev,
                    driver_details: {
                        ...prev?.driver_details,
                        arrival_time: arrivalText
                    }
                };
            });
        }
    };

    const { connected } = useWebSocket(rideId, onMessageReceived);

    useEffect(() => {
        if (!rideId) {
            navigate('/booking-interface');
            return;
        }

        const fetchRide = async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8080/rides/${rideId}`);
                if (res.ok) {
                    const data = await res.json();
                    
                    // Transform backend Ride model to frontend format
                    const mappedRide = {
                        ...data,
                        pickup_coords: { lat: data.pickupLat, lng: data.pickupLng },
                        drop_coords: { lat: data.dropLat, lng: data.dropLng },
                        route_coords: [],
                        driver_details: {
                            name: 'Searching...',
                            vehicle_name: '',
                            number_plate: '',
                            arrival_time: 'Calculating...'
                        }
                    };
                    
                    if (data.simulatedDriver) {
                         setDriverLocation({ lat: data.simulatedDriver.latitude, lng: data.simulatedDriver.longitude });
                         mappedRide.driver_details = {
                             name: data.simulatedDriver.name,
                             vehicle_name: data.simulatedDriver.vehicle_name || data.simulatedDriver.vehicleName || '',
                             number_plate: data.simulatedDriver.license_plate || data.simulatedDriver.licensePlate || '',
                             arrival_time: 'Calculating...'
                         };

                         // Fetch approach route: driver → pickup
                         if (data.simulatedDriver.latitude && data.simulatedDriver.longitude && data.pickupLat && data.pickupLng) {
                             fetchRouteOSRM(
                                 data.simulatedDriver.latitude, data.simulatedDriver.longitude,
                                 data.pickupLat, data.pickupLng,
                                 (coords) => setApproachRoute(coords)
                             );
                         }
                    }

                    // Fetch trip route: pickup → drop
                    if (data.pickupLat && data.pickupLng && data.dropLat && data.dropLng) {
                        fetchRouteOSRM(
                            data.pickupLat, data.pickupLng,
                            data.dropLat, data.dropLng,
                            (coords) => {
                                setTripRoute(coords);
                                setRide(prev => ({ ...prev, route_coords: coords }));
                            }
                        );
                    }
                    
                    setRide(mappedRide);
                    setLiveStatus(data.status);
                }
            } catch (err) {
                 console.error('Fetch ride error:', err);
            }
            setLoading(false);
        };

        fetchRide();
    }, [rideId, navigate]);

    const fetchRouteOSRM = async (lat1, lng1, lat2, lng2, callback) => {
        try {
            const res = await fetch(`http://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`);
            if (res.ok) {
                const rData = await res.json();
                if (rData.routes && rData.routes.length > 0) {
                    const coords = rData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    callback(coords);
                }
            }
        } catch (err) {
            console.error('Fetch route OSRM error:', err);
        }
    };

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

    const driverDetails = {
        name: ride?.driver_details?.name || 'Mahesh',
        vehicle_name: ride?.driver_details?.vehicle_name || 'Honda Activa',
        number_plate: ride?.driver_details?.number_plate || 'TS09 EX 1234',
        arrival_time: ride?.driver_details?.arrival_time || '2mins'
    };

    const currentVehicleAsset = getVehicleAsset(ride?.vehicleType || ride?.vehicle_type);

    // Determine which route coords to show based on map phase
    const getDisplayRoute = () => {
        if (mapPhase === 'approach' && approachRoute.length > 1) return approachRoute;
        if (mapPhase === 'trip' && tripRoute.length > 1) return tripRoute;
        // Fallback: show trip route if approach not available
        if (tripRoute.length > 1) return tripRoute;
        return [];
    };

    // Compute fit bounds coords
    const getFitCoords = () => {
        const fitCoords = [];
        if (ride?.pickup_coords) fitCoords.push([ride.pickup_coords.lat, ride.pickup_coords.lng]);
        if (ride?.drop_coords) fitCoords.push([ride.drop_coords.lat, ride.drop_coords.lng]);
        if (driverLocation) fitCoords.push([driverLocation.lat, driverLocation.lng]);
        return fitCoords;
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
                            {/* Dynamic Map */}
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
                                         {getFitCoords().length >= 2 && <FitBounds coords={getFitCoords()} />}
                                         <Marker position={[ride.pickup_coords.lat, ride.pickup_coords.lng]} icon={createUberPin('#22c55e', ride?.pickup_name)} />
                                         <Marker position={[ride.drop_coords.lat, ride.drop_coords.lng]} icon={createUberPin('#ef4444', ride?.drop_name, true)} />
                                         
                                         {/* Phase 1: Approach route (driver → pickup) - animated draw */}
                                         {mapPhase === 'approach' && approachRoute.length > 1 && !approachDone && (
                                             <AnimatedPolyline
                                                 positions={approachRoute}
                                                 color="#22c55e"
                                                 weight={4}
                                                 opacity={0.9}
                                                 duration={2500}
                                                 onComplete={() => setApproachDone(true)}
                                             />
                                         )}
                                         {mapPhase === 'approach' && approachDone && approachRoute.length > 1 && (
                                             <>
                                                 {(() => {
                                                     const traveledIndex = Math.floor(progress * approachRoute.length);
                                                     const traveled = traveledIndex > 0 ? approachRoute.slice(0, traveledIndex + 1) : [];
                                                     const remaining = approachRoute.slice(traveledIndex);
                                                     return (
                                                         <>
                                                             {traveled.length > 1 && <Polyline positions={traveled} color="#22c55e" weight={4} opacity={0.25} />}
                                                             {remaining.length > 1 && <Polyline positions={remaining} color="#22c55e" weight={4} opacity={0.9} className="active-route-line" />}
                                                         </>
                                                     );
                                                 })()}
                                             </>
                                         )}

                                         {/* Phase 2: Trip route (pickup → drop) */}
                                         {mapPhase === 'trip' && tripRoute.length > 1 && (
                                             (() => {
                                                 const traveledIndex = Math.floor(progress * tripRoute.length);
                                                 const traveled = traveledIndex > 0 ? tripRoute.slice(0, traveledIndex + 1) : [];
                                                 const remaining = tripRoute.slice(traveledIndex);
                                                 return (
                                                     <>
                                                         {traveled.length > 1 && <Polyline positions={traveled} color="#22c55e" weight={4} opacity={0.25} />}
                                                         {remaining.length > 1 && <Polyline positions={remaining} color="#22c55e" weight={4} opacity={0.9} className="active-route-line" />}
                                                     </>
                                                 );
                                             })()
                                         )}

                                        {driverLocation && (
                                            <AnimatedDriverMarker position={driverLocation} vehicleImg={currentVehicleAsset} />
                                        )}
                                    </MapContainer>
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                        Map data unavailable
                                    </div>
                                )}
                            </div>

                            <div className="dynamic-driver-details" style={{ backgroundImage: `url("${driverDetailsImgAsset}")` }}>
                                <div className="driver-main-header">
                                    {/* Driver avatar with mahesh.png */}
                                    <div className="driver-avatar-large" style={{
                                        backgroundImage: `url("${maheshAvatar}")`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        border: '2px solid #333'
                                    }}></div>
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
                                    <img src={currentVehicleAsset} alt="Vehicle" className="vehicle-large-img" />
                                    <div className="vehicle-details-text">
                                        <div className="vehicle-model">{driverDetails.vehicle_name}</div>
                                        <div className="vehicle-plate">{driverDetails.number_plate}</div>
                                    </div>
                                </div>
                                 <div className="status-footer">
                                     <span key={`${liveStatus}-${driverDetails.arrival_time}`} className="current-status animate-fade-in" style={{ color: '#22c55e' }}>
                                         {liveStatus === 'DRIVER_APPROACHING' ? `Arriving in ${driverDetails.arrival_time}` :
                                          liveStatus === 'DRIVER_ARRIVED' ? `Arrived! OTP: ${ride?.otp}` :
                                          liveStatus === 'TRIP_STARTED' ? `Enroute. Dropping in ${driverDetails.arrival_time}` :
                                          liveStatus === 'TRIP_COMPLETED' ? 'Trip Completed!' :
                                          `Searching for driver...`}
                                     </span>
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
                                 <button className="cancel-ride-btn" onClick={() => setShowCancelModal(true)}>Cancel Ride</button>
                            </div>

                            <div className="dynamic-chat-container" style={{ backgroundImage: `url("${chatImgAsset}")` }}>
                                <div className="chat-header">
                                    <div className="driver-avatar-circle" style={{
                                        backgroundImage: `url("${maheshAvatar}")`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}></div>
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

             {/* ─── Ride Completed Modal ─── */}
             {showCompletionModal && (
                 <div className="modal-overlay" style={{ zIndex: 9999 }}>
                     <div className="premium-modal-card">
                         <div className="premium-modal-header">
                             <div className="premium-icon-badge">
                                 <CheckCircle size={24} />
                             </div>
                             <div>
                                 <h3 className="premium-modal-title">Ride Completed</h3>
                                 <p className="premium-modal-subtitle">Hope you had a great trip with {driverDetails.name}!</p>
                             </div>
                         </div>

                         <div className="premium-receipt">
                             <h4 className="premium-receipt-title">Trip Summary</h4>
                             <div className="premium-receipt-row">
                                 <span>Driver</span>
                                 <span>{driverDetails.name}</span>
                             </div>
                             <div className="premium-receipt-row">
                                 <span>Vehicle</span>
                                 <span>{driverDetails.vehicle_name} ({driverDetails.number_plate})</span>
                             </div>
                             <div className="premium-receipt-row">
                                 <span>Fare</span>
                                 <span>{ride?.fare}</span>
                             </div>
                             <div className="premium-receipt-row">
                                 <span>Distance</span>
                                 <span>{ride?.distance}</span>
                             </div>
                             <div className="premium-receipt-row total">
                                 <span>Total Paid</span>
                                 <span>{ride?.fare}</span>
                             </div>
                         </div>

                         <div style={{ marginBottom: '1.5rem' }}>
                             <span className="premium-payment-label">Rate your experience</span>
                             <div className="star-rating-container">
                                 {[1, 2, 3, 4, 5].map((star) => (
                                     <span
                                         key={star}
                                         onClick={() => setRating(star)}
                                         className="star-rating-btn"
                                         style={{ color: star <= rating ? '#ffffff' : '#27272a' }}
                                     >
                                         ★
                                     </span>
                                 ))}
                             </div>
                         </div>

                         <div style={{ marginBottom: '1.5rem' }}>
                             <span className="premium-payment-label">Payment Method</span>
                             <div className="premium-btn-group">
                                 <button
                                     className={`premium-selector-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                                     onClick={() => setPaymentMethod('cash')}
                                 >
                                     <Banknote size={16} /> Cash
                                 </button>
                                 <button
                                     className={`premium-selector-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
                                     onClick={() => setPaymentMethod('upi')}
                                 >
                                     <CreditCard size={16} /> UPI
                                 </button>
                             </div>
                         </div>

                         <button
                             className="premium-action-btn primary"
                             onClick={() => { setShowCompletionModal(false); navigate('/booking-interface'); }}
                         >
                             Finish & Return Home
                         </button>
                     </div>
                 </div>
             )}

             {/* ─── Cancel Ride Modal ─── */}
             {showCancelModal && (
                 <div className="modal-overlay" style={{ zIndex: 9999 }}>
                     <div className="premium-modal-card cancel-card">
                         <div className="premium-modal-header">
                             <div className="premium-icon-badge cancel-badge">
                                 <AlertTriangle size={24} />
                             </div>
                             <div>
                                 <h3 className="premium-modal-title">Cancel Ride?</h3>
                                 <p className="premium-modal-subtitle">Please select a reason for cancellation</p>
                             </div>
                         </div>

                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                             {[
                                 "Driver is taking too long",
                                 "Driver asked to cancel",
                                 "My plans changed",
                                 "Incorrect pickup location",
                                 "Found another ride"
                             ].map((reason) => (
                                 <div
                                     key={reason}
                                     onClick={() => setSelectedReason(reason)}
                                     className={`premium-cancel-option ${selectedReason === reason ? 'active' : ''}`}
                                 >
                                     <span>{reason}</span>
                                     <div
                                         style={{
                                             width: '16px',
                                             height: '16px',
                                             borderRadius: '50%',
                                             border: '2px solid',
                                             borderColor: selectedReason === reason ? '#ffffff' : '#52525b',
                                             background: selectedReason === reason ? '#ffffff' : 'transparent',
                                             boxShadow: selectedReason === reason ? '0 0 8px rgba(255, 255, 255, 0.2)' : 'none',
                                             transition: 'all 0.2s ease',
                                             display: 'flex',
                                             alignItems: 'center',
                                             justifyContent: 'center'
                                         }}
                                     >
                                         {selectedReason === reason && (
                                             <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#000000' }}></div>
                                         )}
                                     </div>
                                 </div>
                             ))}
                         </div>

                         <div className="premium-btn-group">
                             <button
                                 className="premium-action-btn outline"
                                 onClick={() => setShowCancelModal(false)}
                                 style={{ flex: 1 }}
                             >
                                 Keep Ride
                             </button>
                             <button
                                 className="premium-action-btn secondary"
                                 onClick={handleConfirmCancel}
                                 disabled={!selectedReason}
                                 style={{ flex: 1 }}
                             >
                                 Cancel Ride
                             </button>
                         </div>
                     </div>
                 </div>
             )}
         </div>
     );
 };

export default BookedInterface;
