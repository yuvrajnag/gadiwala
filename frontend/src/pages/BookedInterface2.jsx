import { useNavigate, useLocation } from 'react-router-dom';
import { Car, Bus, Key, Train, Package, User, CheckCircle, Send, Loader } from 'lucide-react';
import { mockDb } from '../mockDb';
import { useEffect, useState } from 'react';
import navBarImg from '../assets/nav bar.png';
import logoImg from '../assets/logo.png';
import mapImgAsset from '../assets/map.png';
import chatImgAsset from '../assets/chat.png';
import rideDetailsImgAsset from '../assets/ride details.png';
import driverDetailsImgAsset from '../assets/driver details.png';
import scootyAsset from '../assets/scooty.png';

const BookedInterface2 = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const rideId = location.state?.rideId;

    const [ride, setRide] = useState(null);
    const [passenger, setPassenger] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [showQuickTips, setShowQuickTips] = useState(true);

    useEffect(() => {
        if (!rideId) {
            console.log("No rideId found, but bypassing redirect for testing.");
            // navigate('/driver-dashboard');
            // return;
        }

        const loadContent = () => {
            setLoading(true);
            const rideData = mockDb.rides.getById(rideId);

            if (rideData) {
                setRide(rideData);
                if (rideData.passenger_email) {
                    const pData = mockDb.users.getByEmail(rideData.passenger_email);
                    if (pData) setPassenger(pData);
                }
            }
            setLoading(false);
        };

        loadContent();

        // Polling for updates
        const pollInterval = setInterval(() => {
            const updatedRide = mockDb.rides.getById(rideId);
            if (!updatedRide) return;
            
            setRide(updatedRide);

            if (updatedRide.status === 'accepted' && updatedRide.passenger_email && !passenger) {
                const pData = mockDb.users.getByEmail(updatedRide.passenger_email);
                if (pData) setPassenger(pData);
            }

            if (updatedRide.status === 'cancelled') {
                alert('Ride cancelled by passenger');
                navigate('/driver-dashboard');
            }
        }, 2000);

        return () => {
            clearInterval(pollInterval);
        };
    }, [rideId, navigate, passenger]);

    const quickTips = [
        "Arriving in 2 mins",
        "I have arrived",
        "Please be ready"
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
                        <span style={{ marginLeft: '0.625rem' }}>Loading trip details...</span>
                    </div>
                ) : (
                    <div className="booked-final-layout">
                        <div className="left-panel">
                            <img src={mapImgAsset} alt="Map" className="map-view-img" />
                            <div className="dynamic-driver-details driver-pov" style={{ backgroundImage: `url("${driverDetailsImgAsset}")` }}>
                                <div className="driver-details-content-top">
                                    <div className="driver-avatar-large"></div>
                                    <div className="driver-meta-driver">
                                        <div className="driver-name-row">
                                            <span className="driver-full-name">{passenger?.name || passenger?.username || 'Passenger'}</span>
                                            <CheckCircle size={16} className="verified-icon-alt" />
                                        </div>
                                        <div className="driver-phno">
                                            {passenger?.phone || 'Connecting...'}
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    className="arrived-btn-white"
                                    onClick={async () => {
                                        await supabase.from('rides').update({ status: 'arrived' }).eq('id', rideId);
                                    }}
                                >{ride?.status === 'arrived' ? 'Waiting' : 'Arrived'}</button>
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
                                        navigate('/driver-dashboard');
                                    }}
                                >Cancel Ride</button>
                            </div>
                            
                            <div className="dynamic-chat-container" style={{ backgroundImage: `url("${chatImgAsset}")` }}>
                                <div className="chat-header">
                                    <div className="driver-avatar-circle"></div>
                                    <div className="driver-info">
                                        <span className="driver-name">{passenger?.name?.toLowerCase() || passenger?.username?.toLowerCase() || 'passenger'}</span>
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

export default BookedInterface2;
