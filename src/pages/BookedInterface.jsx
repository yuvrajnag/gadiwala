import { useNavigate, useLocation } from 'react-router-dom';
import { Car, Bus, Key, Train, Package, User, CheckCircle, Send, Loader } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useEffect, useState } from 'react';
import navBarImg from '../assets/nav bar.png';
import centerImg from '../assets/center.png';
import logoImg from '../assets/logo.png';
import mapImgAsset from '../assets/map.png';
import chatImgAsset from '../assets/chat.png';
import rideDetailsImgAsset from '../assets/ride details.png';
import driverDetailsImgAsset from '../assets/driver details.png';
import scootyAsset from '../assets/scooty.png';

const BookedInterface = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const rideId = location.state?.rideId;

    const [ride, setRide] = useState(null);
    const [driver, setDriver] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [showQuickTips, setShowQuickTips] = useState(true);

    useEffect(() => {
        if (!rideId) {
            navigate('/booking-interface');
            return;
        }

        const fetchFullProfile = async (email) => {
            if (!email) return null;
            console.log('Attempting profile fetch (ilike) for:', email);
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .ilike('email', email)
                .single();
            if (error) {
                console.error('Profile fetch failed:', error.message);
                return null;
            }
            return data;
        };

        const loadContent = async () => {
            setLoading(true);
            const { data: rideData, error: rideError } = await supabase
                .from('rides')
                .select('*')
                .eq('id', rideId)
                .single();

            if (!rideError && rideData) {
                setRide(rideData);
                if (rideData.driver_email) {
                    const dData = await fetchFullProfile(rideData.driver_email);
                    if (dData) setDriver(dData);
                }
            }
            setLoading(false);
        };

        loadContent();

        const subscription = supabase
            .channel(`ride-sync-${rideId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` }, async (payload) => {
                const updatedRide = payload.new;
                console.log('Sync update received:', updatedRide.status);
                setRide(updatedRide);

                if (updatedRide.status === 'accepted' && updatedRide.driver_email && !driver) {
                    const dData = await fetchFullProfile(updatedRide.driver_email);
                    if (dData) setDriver(dData);
                }

                if (updatedRide.status === 'cancelled') {
                    alert('Ride cancelled by driver');
                    navigate('/booking-interface');
                }
            })
            .subscribe();

        // Polling fallback every 5 seconds if driver is still missing but ride is accepted
        const pollInterval = setInterval(async () => {
            if (ride?.status === 'accepted' && ride?.driver_email && !driver) {
                console.log('Polling fallback: checking driver profile again...');
                const dData = await fetchFullProfile(ride.driver_email);
                if (dData) setDriver(dData);
            }
        }, 5000);

        return () => {
            supabase.removeChannel(subscription);
            clearInterval(pollInterval);
        };
    }, [rideId, navigate, ride?.status, ride?.driver_email, driver]);

    const quickTips = [
        "Please come fast",
        "I'm at the pickup point",
        "I'm waiting"
    ];

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

    return (
        <div className="customer-dashboard-new">
            <aside className="sidebar-nav" style={{ backgroundImage: `url("${navBarImg}")` }}>
                <div className="logo-container">
                    <img src={logoImg} alt="Logo" className="nav-logo" />
                </div>

                <div className="nav-items-wrapper">
                    {mainServices.map((service) => (
                        <button
                            key={service.name}
                            className={`nav-btn ${service.name === 'booked interface' ? 'active' : ''}`}
                            onClick={() => navigate(service.path)}
                            title={service.name}
                        >
                            {service.icon}
                        </button>
                    ))}
                </div>

                <div className="bottom-nav-items">
                    <button
                        className="nav-btn"
                        onClick={() => navigate('/profile')}
                        title="Profile"
                    >
                        <User size={24} />
                    </button>
                </div>
            </aside>

            <main className="main-content-area booked-interface-main">
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
                        <Loader className="spin" size={40} />
                        <span style={{ marginLeft: '10px' }}>Loading trip details...</span>
                    </div>
                ) : (
                    <div className="booked-final-layout">
                        <div className="left-panel">
                            <img src={mapImgAsset} alt="Map" className="map-view-img" />
                            <div className="dynamic-driver-details" style={{ backgroundImage: `url("${driverDetailsImgAsset}")` }}>
                                <div className="driver-main-header">
                                    <div className="driver-avatar-large"></div>
                                    <div className="driver-meta">
                                        <div className="driver-name-row">
                                            <span className="driver-full-name">{driver?.name || driver?.username || 'Driver'}</span>
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
                                        <div className="vehicle-model">{driver?.vehicle_model || ride?.vehicle_type || 'Vehicle'}</div>
                                        <div className="vehicle-plate">{driver?.vehicle_plate || (ride?.status === 'accepted' ? 'Loading' : '')}</div>
                                    </div>
                                </div>

                                <div className="status-footer">
                                    <span className="current-status" style={{ textTransform: 'capitalize' }}>{ride?.status}</span>
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
                                        <span className="stat-value otp-badge">{ride?.otp || '----'}</span>
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

                                <button 
                                    className="cancel-ride-btn"
                                    onClick={async () => {
                                        await supabase.from('rides').update({ status: 'cancelled' }).eq('id', rideId);
                                        navigate('/booking-interface');
                                    }}
                                >Cancel Ride</button>
                            </div>
                            
                            <div className="dynamic-chat-container" style={{ backgroundImage: `url("${chatImgAsset}")` }}>
                                <div className="chat-header">
                                    <div className="driver-avatar-circle"></div>
                                    <div className="driver-info">
                                        <span className="driver-name">{driver?.name?.toLowerCase() || driver?.username?.toLowerCase() || 'driver'}</span>
                                        <CheckCircle size={14} className="verified-icon" />
                                    </div>
                                </div>

                                <div className="chat-messages-area">
                                    {messages.map((msg, index) => (
                                        <div key={index} className={`message-bubble ${msg.sender}`}>
                                            {msg.text}
                                        </div>
                                    ))}
                                    {showQuickTips && (
                                        <div className="quick-tips-container">
                                            {quickTips.map((tip, index) => (
                                                <button 
                                                    key={index} 
                                                    className="quick-tip-btn"
                                                    onClick={() => handleSendMessage(tip, 'plain')}
                                                >
                                                    {tip}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="chat-input-wrapper">
                                    <div className="chat-input-bar">
                                        <input 
                                            type="text" 
                                            placeholder="Type your message" 
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                        />
                                        <button 
                                            className="send-msg-btn"
                                            onClick={() => handleSendMessage(inputText)}
                                        >
                                            <Send size={18} />
                                        </button>
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
