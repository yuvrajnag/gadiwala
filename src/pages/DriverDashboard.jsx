import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Activity, User, LogOut, LayoutDashboard, Sun, Clock, Star, TrendingUp, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../supabaseClient';

import dOcenter from '../assets/d_ocenter.png';
import dIcenter from '../assets/d_icenter.png';
import statsImg from '../assets/stats.png';
import weatherImg from '../assets/weather.png';
import distanceImg from '../assets/distance.png';

// --- Custom Map Markers ---
const pickupIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:14px;height:14px;background:#10b981;border:2px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(16,185,129,0.5);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

const dropIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:12px;height:12px;background:#ef4444;border:2px solid #fff;border-radius:2px;box-shadow:0 0 10px rgba(239,68,68,0.5);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

const DriverDashboard = () => {

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        navigate('/');
    };

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={32} />, path: '/driver-dashboard' },
        { name: 'Activity', icon: <Activity size={32} />, path: '/activity' },
        { name: 'Profile', icon: <User size={32} />, path: '/profile' },
    ];

    const [showPassword, setShowPassword] = useState(false);
    const [vehicleType, setVehicleType] = useState('');
    const [vehicleTypeOpen, setVehicleTypeOpen] = useState(false);
    const profileInputRef = useRef(null);
    const vehicleInputRef = useRef(null);
    const [profileImg, setProfileImg] = useState(null);
    const [vehicleImg, setVehicleImg] = useState(null);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [availableRides, setAvailableRides] = useState([]);
    const [currentExpandedRide, setCurrentExpandedRide] = useState(null);
    const [profile, setProfile] = useState({
        name: '', email: '', phone: '', password: '', 
        vehicleModel: '', vehiclePlate: '', vehicleType: 'Bike/Scooty', experience: ''
    });

    // Persistent state for profile completion to prevent reappearing form
    const [isSaved, setIsSaved] = useState(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.profileCompleted || false;
    });

    const vehicleTypes = ['Bike/Scooty', 'Auto', 'Car', 'Luxury Car', 'Big Car'];

    const boxInput = {
        background: '#1a1a1a',
        border: '1px solid #3a3a3a',
        borderRadius: '5px',
        color: '#fff',
        fontSize: '0.82rem',
        padding: '5px 8px',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    };

    const boxInputSm = {
        background: '#1a1a1a',
        border: '1px solid #3a3a3a',
        borderRadius: '5px',
        color: '#fff',
        fontSize: '0.78rem',
        padding: '4px 7px',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    };

    const labelStyle = { fontSize: '0.82rem', color: '#ccc', whiteSpace: 'nowrap', marginBottom: '3px', display: 'block' };
    const labelStyleSm = { fontSize: '0.78rem', color: '#ccc', whiteSpace: 'nowrap', marginBottom: '2px', display: 'block' };

    const iStyle = {
        flex: 1,
        background: '#1a1a1a',
        border: '1px solid #3a3a3a',
        borderRadius: '6px',
        color: '#fff',
        fontSize: '1.1rem',
        padding: '12px 16px',
        outline: 'none',
        minWidth: 0,
    };

    const iStyleSm = {
        background: '#1a1a1a',
        border: '1px solid #3a3a3a',
        borderRadius: '6px',
        color: '#fff',
        fontSize: '1.05rem',
        padding: '10px 14px',
        outline: 'none',
        minWidth: 0,
    };

    useEffect(() => {
        const fetchRides = async () => {
            console.log('Driver Hub: Fetching available rides...');
            const { data, error } = await supabase
                .from('rides')
                .select('*')
                .eq('status', 'searching');
            
            if (error) {
                console.error('Fetch error:', error);
            } else {
                console.log('Available rides found:', data.length);
                setAvailableRides(data || []);
            }
        };

        fetchRides();

        // Subscription for rides
        const subscription = supabase
            .channel('public:rides')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rides' }, (payload) => {
                console.log('New ride record inserted:', payload.new);
                if (payload.new.status === 'searching') {
                    setAvailableRides(prev => [payload.new, ...prev]);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides' }, (payload) => {
                console.log('Ride record updated:', payload.new);
                if (payload.new.status !== 'searching') {
                    setAvailableRides(prev => prev.filter(r => r.id !== payload.new.id));
                } else {
                    setAvailableRides(prev => {
                        const exists = prev.find(r => r.id === payload.new.id);
                        if (exists) return prev.map(r => r.id === payload.new.id ? payload.new : r);
                        return [payload.new, ...prev];
                    });
                }
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rides' }, (payload) => {
                console.log('Ride record deleted:', payload.old.id);
                setAvailableRides(prev => prev.filter(r => r.id !== payload.old.id));
            })
            .subscribe((status) => {
                console.log('Supabase Realtime status:', status);
            });

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const handleAcceptRide = async (rideId) => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user || !user.email) return alert('Please login first');

        try {
            let success = false;
            try {
                const response = await fetch(`http://localhost:8080/rides/${rideId}/accept?driverEmail=${user.email}`, {
                    method: 'POST'
                });
                if (response.ok) success = true;
            } catch (backendErr) {
                console.warn('Backend unavailable, accepting via Supabase directly:', backendErr);
            }

            if (!success) {
                const { error } = await supabase
                    .from('rides')
                    .update({ status: 'accepted', driver_email: user.email })
                    .eq('id', rideId);
                
                if (error) {
                    console.error('Direct acceptance error:', error);
                    alert('Failed to accept ride. Please try again.');
                    return;
                }
            }

            // Remove from available list locally immediately for better UX
            setAvailableRides(prev => prev.filter(r => r.id !== rideId));
            
            navigate('/booked-interface2', { state: { rideId } });
        } catch (err) {
            console.error('Accept ride error:', err);
            alert('Failed to connect to server');
        }
    };

    const handleSaveProfile = async () => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user) return alert('Please sign in');

        // Validation
        const requiredFields = ['name', 'phone', 'password', 'vehicleModel', 'vehiclePlate', 'experience'];
        const missingFields = requiredFields.filter(field => !profile[field]);
        
        if (missingFields.length > 0) {
            alert(`Please fill all fields: ${missingFields.join(', ')}`);
            return;
        }

        const { error } = await supabase
            .from('drivers')
            .update({
                name: profile.name,
                phone: profile.phone,
                password: profile.password,
                vehicle_model: profile.vehicleModel,
                vehicle_plate: profile.vehiclePlate,
                vehicle_type: profile.vehicleType,
                experience: profile.experience
            })
            .eq('email', user.email);

        if (error) {
            console.error('Update profile error details:', error);
            alert(`Failed to save profile: ${error.message}`);
        } else {
            // Update local storage too
            const updatedUser = { ...user, ...profile, profileCompleted: true };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setIsSaved(true);
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const localUser = JSON.parse(userStr);
            console.log('Initializing Driver Hub for:', localUser.email);
            
            const fetchFreshProfile = async () => {
                setIsLoadingProfile(true);
                const { data, error } = await supabase
                    .from('drivers')
                    .select('*')
                    .eq('email', localUser.email || localUser.username)
                    .single();
                
                if (data && !error) {
                    console.log('Driver profile data:', data);
                    const profileData = {
                        name: data.name || data.username || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        password: data.password || '',
                        vehicleModel: data.vehicle_model || '',
                        vehiclePlate: data.vehicle_plate || '',
                        vehicleType: data.vehicle_type || 'Bike/Scooty',
                        experience: data.experience || ''
                    };
                    setProfile(profileData);
                    
                    // If profile is missing driver-specific fields, show the form
                    const isNewDriver = !data.vehicle_model || !data.vehicle_plate || !data.experience;
                    const completed = !isNewDriver;
                    setIsSaved(completed);

                    // Sync local storage
                    const updatedUser = { ...localUser, ...profileData, profileCompleted: completed };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } else {
                    console.warn('Profile fetch note:', error?.message);
                    // If no profile found at all, treat as new
                    setIsSaved(false);
                }
                setIsLoadingProfile(false);
            };
            fetchFreshProfile();
        } else {
            navigate('/');
        }
    }, [navigate]);

    return (
        <div className="dashboard-container">
            {/* Black background hero with centered images */}
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 0,
            }}>
                {/* Outer image: fills screen with 20px padding on all sides */}
                <div style={{
                    position: 'relative',
                    width: 'calc(100% - 40px)',
                    height: 'calc(100% - 40px)',
                    margin: '20px',
                    overflow: 'hidden',
                }}>
                    <img
                        src={dOcenter}
                        alt="outer"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'fill',
                            display: 'block',
                        }}
                    />

                    {/* Expanded Map Overlay */}
                    {isMapExpanded && (
                        <div className="expanded-map-overlay">
                            <div className="map-close-btn-g" onClick={() => setIsMapExpanded(false)}>
                                <X size={24} />
                            </div>
                            <MapContainer 
                                center={[17.42, 78.62]} 
                                zoom={12} 
                                style={{ height: '100%', width: '100%' }}
                                attributionControl={false}
                            >
                                <TileLayer 
                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                                />
                                <Marker position={[17.3984, 78.5562]} icon={pickupIcon} />
                                <Marker position={[17.4334, 78.6946]} icon={dropIcon} />
                                <Polyline 
                                    positions={[[17.3984, 78.5562], [17.41, 78.60], [17.4334, 78.6946]]} 
                                    color="#93c5fd" 
                                    weight={8} 
                                    opacity={1}
                                />
                            </MapContainer>
                        </div>
                    )}


                    {/* ── Title overlay — sits at top of d_ocenter ── */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        paddingTop: '26px',
                        color: '#fff',
                        fontFamily: 'sans-serif',
                        pointerEvents: 'none',
                        transition: 'opacity 0.8s ease, transform 0.8s ease',
                        opacity: isSaved ? 0 : 1,
                        transform: isSaved ? 'translateY(-20px)' : 'translateY(0)',
                    }}>
                        <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
                            Complete your profile
                        </h1>
                        <p style={{ margin: '5px 0 0', fontSize: '0.82rem', color: '#666', fontStyle: 'italic' }}>
                            Lets get your driver account ready for the road!
                        </p>
                    </div>

                    {/* ── NEW Dashboard Title Overlay ── */}
                    <div style={{
                        position: 'absolute',
                        top: '30px', left: '10%', right: '10%',
                        color: '#fff',
                        fontFamily: 'sans-serif',
                        fontSize: '2.0rem',
                        fontWeight: 700,
                        opacity: isSaved ? 1 : 0,
                        transform: isSaved ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s',
                        pointerEvents: 'none',
                    }}>
                        Driver Hub Welcome, Shanmukh
                    </div>

                    {/* ── Verification Form View (Contains d_icenter + content) ── */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '10%',
                        width: '80%',
                        height: '100%',
                        transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease',
                        transform: isSaved ? 'translateY(110%)' : 'translateY(0)',
                        opacity: isSaved ? 0 : 1,
                        pointerEvents: isSaved ? 'none' : 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                    }}>
                        {/* The d_icenter image that slides with the content */}
                        <img
                            src={dIcenter}
                            alt="inner"
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                                zIndex: 0
                            }}
                        />

                        {/* Content overlay */}
                        <div style={{
                            position: 'relative',
                            zIndex: 1,
                            width: '100%',
                            height: '80%',
                            boxSizing: 'border-box',
                            padding: '0 40px 24px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            gap: '48px',
                            color: '#fff',
                            fontFamily: 'sans-serif',
                        }}>

                            {/* Top 3px separator — spans full d_icenter width, edge to edge */}
                            <div style={{ width: 'calc(100% + 80px)', height: '3px', backgroundColor: '#2a2a2a', flexShrink: 0, marginLeft: '-40px' }} />

                            {/* ── Profile upload row ── */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '26px' }}>
                                <input
                                    ref={profileInputRef}
                                    type="file"
                                    accept="image/jpg,image/jpeg,image/png"
                                    style={{ display: 'none' }}
                                    onChange={e => setProfileImg(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null)}
                                />
                                <div
                                    onClick={() => profileInputRef.current.click()}
                                    style={{
                                        width: '110px', height: '110px',
                                        border: '1.5px solid #444', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, cursor: 'pointer', overflow: 'hidden',
                                        background: '#111',
                                    }}
                                >
                                    {profileImg
                                        ? <img src={profileImg} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                    }
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '2.2rem', fontWeight: 700 }}>Upload your image</p>
                                    <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#666' }}>
                                        Upload profile photo, format : jpg,png,jpeg.&nbsp; MAX upto 10mb
                                    </p>
                                </div>
                            </div>

                            {/* ── Personal details — inline label+input rows in 2 columns ── */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '40px', rowGap: '32px' }}>

                                {/* Name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <label style={{ fontSize: '1.15rem', color: '#ccc', whiteSpace: 'nowrap', flexShrink: 0, minWidth: '120px' }}>Name :</label>
                                    <input 
                                        style={iStyle} 
                                        type="text" 
                                        placeholder="Enter your name" 
                                        value={profile.name}
                                        onChange={e => setProfile({...profile, name: e.target.value})}
                                    />
                                </div>

                                {/* Email */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <label style={{ fontSize: '1.15rem', color: '#ccc', whiteSpace: 'nowrap', flexShrink: 0, minWidth: '120px' }}>Email :</label>
                                    <input 
                                        style={iStyle} 
                                        type="email" 
                                        placeholder="Enter your email" 
                                        value={profile.email}
                                        disabled
                                    />
                                </div>

                                {/* Password */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <label style={{ fontSize: '1.15rem', color: '#ccc', whiteSpace: 'nowrap', flexShrink: 0, minWidth: '120px' }}>Password :</label>
                                    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                                        <input
                                            style={{ ...iStyle, paddingRight: '32px', width: '100%', boxSizing: 'border-box' }}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter password"
                                            value={profile.password}
                                            onChange={e => setProfile({...profile, password: e.target.value})}
                                        />
                                        <span
                                            onClick={() => setShowPassword(p => !p)}
                                            style={{
                                                position: 'absolute', right: '9px', top: '50%',
                                                transform: 'translateY(-50%)', cursor: 'pointer',
                                                color: '#777', display: 'flex', alignItems: 'center',
                                            }}
                                        >
                                            {showPassword
                                                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            }
                                        </span>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <label style={{ fontSize: '1.15rem', color: '#ccc', whiteSpace: 'nowrap', flexShrink: 0, minWidth: '120px' }}>Phno :</label>
                                    <span style={{
                                        padding: '9px 11px',
                                        border: '1px solid #3a3a3a', borderRadius: '6px',
                                        fontSize: '0.92rem', backgroundColor: '#1a1a1a',
                                        color: '#aaa', flexShrink: 0,
                                    }}>+91</span>
                                    <input
                                        style={{ ...iStyle, flex: 1 }}
                                        type="tel"
                                        maxLength={10}
                                        placeholder="10-digit number"
                                        value={profile.phone}
                                        onChange={e => setProfile({...profile, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10)})}
                                    />
                                </div>
                            </div>

                            {/* ── Dotted Vehicle Details divider ── */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ flex: 1, borderTop: '1.5px dashed #333' }} />
                                <span style={{ fontSize: '1.3rem', fontWeight: 600, color: '#bbb', whiteSpace: 'nowrap' }}>
                                    Vechile Details
                                </span>
                                <div style={{ flex: 1, borderTop: '1.5px dashed #333' }} />
                            </div>

                            {/* ── Vehicle section ── */}
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

                                {/* Vehicle image upload */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, width: '200px' }}>
                                    <span style={{ fontSize: '0.95rem', color: '#777', textAlign: 'center' }}>Upload your vehicle image</span>
                                    <input
                                        ref={vehicleInputRef}
                                        type="file"
                                        accept="image/jpg,image/jpeg,image/png"
                                        style={{ display: 'none' }}
                                        onChange={e => setVehicleImg(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null)}
                                    />
                                    <div
                                        onClick={() => vehicleInputRef.current.click()}
                                        style={{
                                            width: '200px', height: '195px',
                                            backgroundColor: '#0d0d0d',
                                            border: '1px solid #2a2a2a', borderRadius: '14px',
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            gap: '12px', cursor: 'pointer', overflow: 'hidden',
                                        }}
                                    >
                                        {vehicleImg
                                            ? <img src={vehicleImg} alt="vehicle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <>
                                                <div style={{
                                                    width: '50px', height: '50px',
                                                    border: '1.5px solid #888', borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                                                        <polyline points="16 16 12 12 8 16" />
                                                        <line x1="12" y1="12" x2="12" y2="21" />
                                                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                                                    </svg>
                                                </div>
                                                <span style={{ fontSize: '0.7rem', color: '#555', textAlign: 'center', padding: '0 16px' }}>
                                                    Chose a file or drag and drop it here
                                                </span>
                                            </>
                                        }
                                    </div>
                                </div>

                                {/* Vehicle fields + Save */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '40px', rowGap: '32px' }}>

                                        {/* Custom Vehicle Type dropdown — inline */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <label style={{ fontSize: '1.1rem', color: '#ccc', whiteSpace: 'nowrap', flexShrink: 0, minWidth: '120px' }}>Vechile Type :</label>
                                            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                                                <div
                                                    onClick={() => setVehicleTypeOpen(o => !o)}
                                                    style={{
                                                        ...iStyle,
                                                        display: 'flex', alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        cursor: 'pointer', userSelect: 'none',
                                                        color: profile.vehicleType ? '#fff' : '#555',
                                                    }}
                                                >
                                                    <span>{profile.vehicleType || 'Select'}</span>
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5"
                                                        style={{ transform: vehicleTypeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                                                        <polyline points="6 9 12 15 18 9" />
                                                    </svg>
                                                </div>
                                                {vehicleTypeOpen && (
                                                    <div style={{
                                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                                        backgroundColor: '#141414',
                                                        border: '1px solid #3a3a3a',
                                                        borderRadius: '6px',
                                                        zIndex: 999,
                                                        overflow: 'hidden',
                                                        boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                                                        marginTop: '2px',
                                                    }}>
                                                        {vehicleTypes.map(type => (
                                                            <div
                                                                key={type}
                                                                onClick={() => { setProfile({...profile, vehicleType: type}); setVehicleTypeOpen(false); }}
                                                                style={{
                                                                    padding: '9px 12px',
                                                                    fontSize: '0.88rem',
                                                                    color: profile.vehicleType === type ? '#fff' : '#aaa',
                                                                    backgroundColor: profile.vehicleType === type ? '#2a2a2a' : 'transparent',
                                                                    cursor: 'pointer',
                                                                    borderBottom: '1px solid #222',
                                                                    transition: 'background 0.15s',
                                                                }}
                                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#222'}
                                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = profile.vehicleType === type ? '#2a2a2a' : 'transparent'}
                                                            >
                                                                {type}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Vechile name — inline */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <label style={{ fontSize: '1.1rem', color: '#ccc', whiteSpace: 'nowrap', flexShrink: 0, minWidth: '120px' }}>Vechile name :</label>
                                            <input 
                                                style={{ ...iStyle, flex: 1 }} 
                                                type="text" 
                                                placeholder="e.g. Honda Activa" 
                                                value={profile.vehicleModel}
                                                onChange={e => setProfile({...profile, vehicleModel: e.target.value})}
                                            />
                                        </div>

                                        {/* Number plate — inline */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <label style={{ fontSize: '1.1rem', color: '#ccc', whiteSpace: 'nowrap', flexShrink: 0, minWidth: '120px' }}>Number plate :</label>
                                            <input 
                                                style={{ ...iStyle, flex: 1 }} 
                                                type="text" 
                                                placeholder="e.g. MH12AB1234" 
                                                value={profile.vehiclePlate}
                                                onChange={e => setProfile({...profile, vehiclePlate: e.target.value})}
                                            />
                                        </div>

                                        {/* Years of exp — inline */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <label style={{ fontSize: '1.1rem', color: '#ccc', whiteSpace: 'nowrap', flexShrink: 0, minWidth: '120px' }}>Years of exp :</label>
                                            <input 
                                                style={{ ...iStyle, flex: 1 }} 
                                                type="number" 
                                                min="0" 
                                                placeholder="e.g. 3" 
                                                value={profile.experience || ''}
                                                onChange={e => setProfile({...profile, experience: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    {/* Disable save until all fields are filled */}
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={!profile.name || !profile.phone || !profile.password || !profile.vehicleModel || !profile.vehiclePlate || !profile.experience}
                                        style={{
                                            width: '100%', padding: '18px 0',
                                            background: (!profile.name || !profile.phone || !profile.password || !profile.vehicleModel || !profile.vehiclePlate || !profile.experience) 
                                                ? '#333' 
                                                : 'linear-gradient(to bottom, #e0e0e0, #999)',
                                            border: 'none', borderRadius: '8px',
                                            color: (!profile.name || !profile.phone || !profile.password || !profile.vehicleModel || !profile.vehiclePlate || !profile.experience)
                                                ? '#666'
                                                : '#111', 
                                            fontSize: '1.2rem', fontWeight: 700,
                                            cursor: (!profile.name || !profile.phone || !profile.password || !profile.vehicleModel || !profile.vehiclePlate || !profile.experience)
                                                ? 'not-allowed'
                                                : 'pointer',
                                            transition: 'all 0.3s'
                                        }}>
                                        Save
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* ── NEW Dashboard View ── */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        padding: '80px 10% 20px',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        opacity: isSaved ? 1 : 0,
                        pointerEvents: isSaved ? 'auto' : 'none',
                        transition: 'opacity 1s ease 0.5s',
                    }}>
                        {/* --- Ultra-Premium Cinematic Dashboard Row --- */}
                        <div className="gaadhiwala-dashboard-row">

                            {/* Card 1: Driver Performance */}
                            <div className="premium-card-gaadhiwala performance-card">
                                <div className="card-header-g">
                                    <span className="card-title-g">Driver Performance</span>
                                </div>
                                <div className="card-content-g">
                                    {/* Line Graph SVG */}
                                    <div className="visual-viz-g line-chart-container">
                                        <svg viewBox="0 0 300 100" className="futuristic-line-chart">
                                            <path d="M 0 80 Q 50 60 100 70 T 200 30 T 300 10" fill="none" stroke="rgba(255,255,255,1)" strokeWidth="3" />
                                            <circle cx="0" cy="80" r="2" fill="#fff" />
                                            <circle cx="100" cy="70" r="2" fill="#fff" />
                                            <circle cx="200" cy="30" r="2" fill="#fff" />
                                            <circle cx="300" cy="10" r="2" fill="#fff" />
                                        </svg>
                                        <div className="chart-labels-g">
                                            <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
                                        </div>
                                    </div>

                                    <div className="stats-grid-g">
                                        <div className="stat-item-g">
                                            <span className="label-g">Distance Traveled</span>
                                            <span className="value-g">1,248 km</span>
                                        </div>
                                        <div className="stat-divider-g"></div>
                                        <div className="stat-item-g">
                                            <span className="label-g">Total Rides</span>
                                            <span className="value-g">86</span>
                                        </div>
                                        <div className="stat-divider-g"></div>
                                        <div className="stat-item-g">
                                            <span className="label-g">Monthly Report</span>
                                            <span className="value-g text-white">₹18,420</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-glow-g"></div>
                            </div>

                            {/* Card 2: Weather Panel */}
                            <div className="premium-card-gaadhiwala weather-card-p">
                                <div className="card-header-g">
                                    <span className="card-title-g">Current Conditions</span>
                                    <span className="card-subtitle-g">Hyderabad, Telangana</span>
                                </div>
                                <div className="card-content-g weather-layout-g">
                                    <div className="weather-hero-g">
                                        <Sun size={48} strokeWidth={1} />
                                        <span className="temp-hero-g">32°C</span>
                                    </div>

                                    <div className="weather-viz-g">
                                        <div className="radial-gauge-g">
                                            <svg viewBox="0 0 36 36" className="circular-chart-g">
                                                <path className="circle-bg-g" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                <path className="circle-g" strokeDasharray="22, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            </svg>
                                            <span className="gauge-val-g">22%</span>
                                            <span className="gauge-label-g">HUMIDITY</span>
                                        </div>
                                    </div>

                                    <div className="stats-mini-row-g">
                                        <div className="mini-stat-g">
                                            <span className="mini-label-g">Wind Speed</span>
                                            <span className="mini-val-g">8 km/h</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-glow-g"></div>
                            </div>

                            {/* Card 3: Earnings Analytics */}
                            <div className="premium-card-gaadhiwala earnings-card-p">
                                <div className="card-header-g">
                                    <span className="card-title-g">Income Analytics</span>
                                </div>
                                <div className="card-content-g">
                                    <div className="hero-earnings-g">
                                        <span className="currency-g">₹</span>
                                        <span className="amount-g">14,250</span>
                                    </div>

                                    <div className="visual-viz-g bar-chart-container">
                                        <div className="futuristic-bar-chart">
                                            {[30, 50, 40, 70, 90, 60, 80].map((h, i) => (
                                                <div key={i} className="bar-g" style={{ height: `${h}%` }}>
                                                    <div className="bar-glow-top"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="stats-grid-g">
                                        <div className="stat-item-g">
                                            <span className="label-g">Today's Earnings</span>
                                            <span className="value-g">₹1,840</span>
                                        </div>
                                        <div className="stat-divider-g"></div>
                                        <div className="stat-item-g">
                                            <span className="label-g">Weekly Earnings</span>
                                            <span className="value-g">₹9,430</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-glow-g"></div>
                            </div>
                        </div>

                        {/* Lower section: Available rides (Compact layout with Real Map) */}
                        <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: '420px', display: 'flex', flexDirection: 'column' }}>
                            <img src={dIcenter} alt="rides-bg" style={{ width: '100%', height: '100%', objectFit: 'fill', position: 'absolute', inset: 0, zIndex: 0 }} />
                            
                            {/* Available Rides Header (Smaller padding) */}
                            <div style={{ position: 'relative', zIndex: 1, padding: '15px 30px 5px', color: '#fff', fontFamily: 'sans-serif' }}>
                                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Available rides</p>
                            </div>

                            {/* --- Ride Notifications List --- */}
                            <div className="ride-notifications-container" style={{ 
                                position: 'relative', 
                                zIndex: 1, 
                                overflowY: 'auto', 
                                padding: '0 30px 20px',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px'
                            }}>
                                {availableRides.length === 0 ? (
                                    <div style={{ color: '#555', textAlign: 'center', marginTop: '40px' }}>
                                        No rides available at the moment.
                                    </div>
                                ) : (
                                    availableRides.map(ride => (
                                        <div key={ride.id} className="ride-notification-card">
                                            {/* Card Header: Route */}
                                            <div className="ride-header-g">
                                                <MapPin size={16} className="map-pin-g" />
                                                <span className="route-text-g">{(ride.pickup_name || '').split(',')[0]} — {(ride.drop_name || '').split(',')[0]}</span>
                                            </div>

                                            {/* Card Body: Map Area (Click to expand) */}
                                            <div className="ride-map-placeholder-g" onClick={() => setIsMapExpanded(true)} style={{ cursor: 'pointer' }}>
                                                <MapContainer 
                                                    center={ride.pickup_lat && ride.pickup_lng ? [ride.pickup_lat, ride.pickup_lng] : [17.3850, 78.4867]} 
                                                    zoom={11} 
                                                    zoomControl={false}
                                                    dragging={false}
                                                    scrollWheelZoom={false}
                                                    style={{ height: '100%', width: '100%' }}
                                                    attributionControl={false}
                                                >
                                                    <TileLayer 
                                                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                                                    />
                                                    {ride.pickup_lat && ride.pickup_lng && <Marker position={[ride.pickup_lat, ride.pickup_lng]} icon={pickupIcon} />}
                                                    {ride.drop_lat && ride.drop_lng && <Marker position={[ride.drop_lat, ride.drop_lng]} icon={dropIcon} />}
                                                </MapContainer>
                                            </div>

                                            {/* Card Details Row */}
                                            <div className="ride-details-row-g">
                                                <div className="detail-item-g">
                                                    <span className="detail-label-g">Distance</span>
                                                    <span className="detail-value-g">{ride.distance}</span>
                                                </div>
                                                <div className="detail-divider-v-g"></div>
                                                <div className="detail-item-g">
                                                    <span className="detail-label-g">Fare</span>
                                                    <span className="detail-value-g">{ride.fare}</span>
                                                </div>
                                                <div className="detail-divider-v-g"></div>
                                                <div className="detail-item-g">
                                                    <span className="detail-label-g">Vehicle</span>
                                                    <span className="detail-value-g" style={{ textTransform: 'capitalize' }}>{ride.vehicle_type}</span>
                                                </div>
                                                <div className="detail-divider-v-g"></div>
                                                <div className="detail-item-g">
                                                    <span className="detail-label-g">Rider</span>
                                                    <span className="detail-value-g">{(ride.passenger_email || '').split('@')[0]}</span>
                                                </div>
                                            </div>

                                            {/* Card Footer: Accept Button */}
                                            <button 
                                                className="ride-accept-btn-g"
                                                onClick={() => handleAcceptRide(ride.id)}
                                            >
                                                Accept
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <header>
                <h1>Driver Hub</h1>
                <button onClick={handleLogout} className="logout-btn"><LogOut size={18} /></button>
            </header>

            <div className="stats-cards">
                <div className="stat-card">
                    <h3>Today's Earnings</h3>
                    <p>$0.00</p>
                </div>
                <div className="stat-card">
                    <h3>Total Rides</h3>
                    <p>0</p>
                </div>
            </div>

            <nav className="driver-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.name}
                        className="nav-item"
                        onClick={() => navigate(item.path)}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default DriverDashboard;
