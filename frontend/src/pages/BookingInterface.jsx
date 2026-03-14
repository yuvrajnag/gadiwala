import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Bus, Key, Train, Package, User, Clock, ChevronDown, MapPin, Plus, Search, Calendar, UserPlus, Loader, X, AlertCircle, Phone, UserCheck, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../supabaseClient';
import navBarImg from '../assets/nav bar.png';
import centerImg from '../assets/center.png';
import logoImg from '../assets/logo.png';
import mapPinImg from '../assets/mapimg.png';
import bikeIcon from '../assets/bike.png';
import scootyIcon from '../assets/scooty.png';
import autoIcon from '../assets/auto.png';
import cabNonAcIcon from '../assets/cab non ac.png';
import cabPremiumIcon from '../assets/cab premium.png';
import cabXlIcon from '../assets/cab xl.png';
import searchingVideo from '../assets/Searching.webm';

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

// ─── Scroll Wheel Column Component ───
const ScrollWheelCol = ({ items, value, onChange, formatFn }) => {
    const colRef = useRef(null);
    const itemH = 56;

    const scrollToIdx = useCallback((idx, smooth = true) => {
        if (!colRef.current) return;
        colRef.current.scrollTo({ top: idx * itemH, behavior: smooth ? 'smooth' : 'auto' });
    }, []);

    useEffect(() => {
        const idx = items.indexOf(value);
        if (idx !== -1) scrollToIdx(idx, false);
    }, []);

    useEffect(() => {
        const el = colRef.current;
        if (!el) return;
        let timeout;
        const onScroll = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const idx = Math.round(el.scrollTop / itemH);
                const clamped = Math.max(0, Math.min(idx, items.length - 1));
                onChange(items[clamped]);
                scrollToIdx(clamped, true);
            }, 80);
        };
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => { el.removeEventListener('scroll', onScroll); clearTimeout(timeout); };
    }, [items, onChange, scrollToIdx]);

    return (
        <div className="scroll-wheel-col" ref={colRef}>
            <div style={{ height: itemH }} />
            {items.map((item, idx) => (
                <div key={idx} className={`wheel-item ${value === item ? 'active' : ''}`}
                    onClick={() => { onChange(item); scrollToIdx(idx, true); }}>
                    {formatFn ? formatFn(item) : item}
                </div>
            ))}
            <div style={{ height: itemH }} />
        </div>
    );
};

const BookingInterface = () => {
    const navigate = useNavigate();
    const dropInputRef = useRef(null);

    // Location state
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [pickupConfirmed, setPickupConfirmed] = useState(false);
    const [dropConfirmed, setDropConfirmed] = useState(false);
    const [pickupCoords, setPickupCoords] = useState(null); // { lat, lng }
    const [dropCoords, setDropCoords] = useState(null);     // { lat, lng }
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeInput, setActiveInput] = useState(null);

    // Geolocation state
    const [geoLoading, setGeoLoading] = useState(false);
    const [inlineError, setInlineError] = useState(null);

    // For Me / Rider state
    const [showForMeDropdown, setShowForMeDropdown] = useState(false);
    const [showRiderModal, setShowRiderModal] = useState(false);
    const [riderName, setRiderName] = useState('');
    const [riderContact, setRiderContact] = useState('');
    const [selectedRider, setSelectedRider] = useState(null);

    // Pickup Now / Schedule state
    const [showPickupDropdown, setShowPickupDropdown] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduledTime, setScheduledTime] = useState(null);
    const [tempHour, setTempHour] = useState(2);
    const [tempMinute, setTempMinute] = useState(30);
    const [tempPeriod, setTempPeriod] = useState('PM');

    // Route Map Modal state
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [selectedRide, setSelectedRide] = useState('bike');
    const [routeCoords, setRouteCoords] = useState([]);
    const [routeLoading, setRouteLoading] = useState(false);
    const [routeInfo, setRouteInfo] = useState(null); // { distance, duration }
    const [isRainy, setIsRainy] = useState(false);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [currentRideId, setCurrentRideId] = useState(null);

    const mainServices = [
        { name: 'booked interface', icon: <Car size={24} />, path: '/booked-interface' },
        { name: 'Bus', icon: <Bus size={24} />, path: '/bus-booking' },
        { name: 'Rentals', icon: <Key size={24} />, path: '/rentals' },
        { name: 'Metro', icon: <Train size={24} />, path: '/metro' },
        { name: 'Courier', icon: <Package size={24} />, path: '/courier' },
    ];

    const CLIENT_ID = import.meta.env.VITE_MAPMYINDIA_CLIENT_ID;
    const CLIENT_SECRET = import.meta.env.VITE_MAPMYINDIA_CLIENT_SECRET;

    useEffect(() => {
        if (inlineError) { const t = setTimeout(() => setInlineError(null), 5000); return () => clearTimeout(t); }
    }, [inlineError]);

    useEffect(() => {
        const handler = () => { setShowForMeDropdown(false); setShowPickupDropdown(false); };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    // ─── Mappls Token Helper ───
    const getMpplsToken = async () => {
        const authRes = await fetch('https://outpost.mappls.com/api/security/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
        });
        if (!authRes.ok) throw new Error('Auth failed');
        const d = await authRes.json();
        if (!d.access_token) throw new Error('No token');
        return d.access_token;
    };

    // ─── Geocode text to coords via Nominatim ───
    const geocodeText = async (text) => {
        if (!text || text.length < 3) return null;

        const tryGeocode = async (query) => {
            try {
                // First try Mappls Geocoding API if keys are available
                if (CLIENT_ID && CLIENT_SECRET) {
                    const token = await getMpplsToken();
                    const mapplsRes = await fetch(
                        `https://atlas.mappls.com/api/places/geocode?address=${encodeURIComponent(query)}&country=IND`,
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    const mapplsData = await mapplsRes.json();
                    if (mapplsData.copResults) {
                        return { lat: parseFloat(mapplsData.copResults.latitude), lng: parseFloat(mapplsData.copResults.longitude) };
                    }
                }
            } catch (e) {
                console.warn('Mappls geocode failed for:', query, e);
            }

            // Fallback to Nominatim
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                const data = await res.json();
                if (data && data.length > 0) {
                    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                }
            } catch (e) {
                console.warn('Nominatim geocode failed for:', query, e);
            }
            return null;
        };

        // 1. Try exact match
        let coords = await tryGeocode(text);
        if (coords) return coords;

        // 2. Fuzzy/Progressive matching: split by comma and remove the most specific part (usually shop/house name)
        const parts = text.split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length > 2) {
            // Try without the first part (e.g., skip "Universal Book Showroom")
            const simplified = parts.slice(1).join(', ');
            coords = await tryGeocode(simplified);
            if (coords) return coords;

            // Try with just the last two parts (usually area and city)
            const broader = parts.slice(-2).join(', ');
            coords = await tryGeocode(broader);
            if (coords) return coords;
        }

        return null;
    };

    // ─── Use Current Location ───
    const handleUseCurrentLocation = async () => {
        if (!navigator.geolocation) { setInlineError('Geolocation not supported.'); return; }
        setGeoLoading(true); setInlineError(null);
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
            });
            const { latitude, longitude } = pos.coords;
            setPickupCoords({ lat: latitude, lng: longitude });

            const revRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const revData = await revRes.json();
            setPickup(revData?.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            setPickupConfirmed(true); setSuggestions([]); setActiveInput(null);
            setTimeout(() => { setActiveInput('drop'); dropInputRef.current?.focus(); }, 150);
        } catch (err) {
            if (err.code === 1) setInlineError('Location permission denied. Please enable location access.');
            else setInlineError('Could not fetch your location. Please try again.');
        } finally { setGeoLoading(false); }
    };

    // ─── Rider Management ───
    const handleSaveRider = () => {
        if (!riderName.trim()) return;
        setSelectedRider({ name: riderName.trim(), contact: riderContact.trim() });
        setShowRiderModal(false); setRiderName(''); setRiderContact('');
    };

    // ─── Schedule Time ───
    const handleSelectTime = () => {
        setScheduledTime({ hour: tempHour, minute: tempMinute, period: tempPeriod });
        setShowScheduleModal(false);
    };
    const openScheduleModal = () => {
        if (scheduledTime) { setTempHour(scheduledTime.hour); setTempMinute(scheduledTime.minute); setTempPeriod(scheduledTime.period); }
        setShowScheduleModal(true); setShowPickupDropdown(false);
    };
    const formatScheduledLabel = () => {
        if (!scheduledTime) return 'Pickup now';
        return `📅 ${scheduledTime.hour}:${scheduledTime.minute.toString().padStart(2, '0')} ${scheduledTime.period}`;
    };

    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const minutesList = Array.from({ length: 60 }, (_, i) => i);

    // ─── Search Button Click: Fetch Route & Show Map ───
    const handleSearchClick = async () => {
        setRouteLoading(true);
        setShowRouteModal(true);
        setRouteCoords([]);
        setRouteInfo(null);

        try {
            // Get coordinates for both locations
            let pCoords = pickupCoords;
            let dCoords = dropCoords;

            if (!pCoords) {
                pCoords = await geocodeText(pickup);
                if (pCoords) setPickupCoords(pCoords);
            }
            if (!dCoords) {
                dCoords = await geocodeText(drop);
                if (dCoords) setDropCoords(dCoords);
            }

            if (!pCoords || !dCoords) {
                setInlineError('Could not find coordinates for one or both locations.');
                setShowRouteModal(false);
                setRouteLoading(false);
                return;
            }

            // Fetch route from OSRM
            const routeRes = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${pCoords.lng},${pCoords.lat};${dCoords.lng},${dCoords.lat}?overview=full&geometries=geojson`
            );
            const routeData = await routeRes.json();

            if (routeData.routes && routeData.routes.length > 0) {
                const route = routeData.routes[0];
                const coords = route.geometry.coordinates.map(c => [c[1], c[0]]); // [lat, lng]
                setRouteCoords(coords);
                setRouteInfo({
                    distance: (route.distance / 1000).toFixed(1), // km
                    duration: Math.round(route.duration / 60),     // minutes
                });
            }
        } catch (err) {
            console.error('Route error:', err);
            setInlineError('Failed to fetch route. Please try again.');
            setShowRouteModal(false);
        } finally {
            setRouteLoading(false);
        }
    };

    // ─── Suggestion Fetching ───
    useEffect(() => {
        if (!activeInput) return;
        if (activeInput === 'pickup' && pickupConfirmed) return;
        if (activeInput === 'drop' && dropConfirmed) return;

        const query = activeInput === 'pickup' ? pickup : drop;
        if (!query || query.length < 3) { 
            setSuggestions([]); 
            setIsLoading(false);
            return; 
        }

        const fetchSuggestions = async () => {
            setIsLoading(true);
            try {
                if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('No keys');
                const token = await getMpplsToken();
                const response = await fetch(
                    `https://atlas.mappls.com/api/places/autosuggest/v1/json?query=${encodeURIComponent(query)}&location=17.3850,78.4867&bridge=true&explain=true&filter=cop:IND`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                const data = await response.json();

                if (data.suggestedLocations && data.suggestedLocations.length > 0) {
                    const q = query.toLowerCase().trim();
                    const matched = data.suggestedLocations.filter(loc =>
                        (loc.placeName || '').toLowerCase().includes(q)
                    );
                    const mapped = matched.map(loc => {
                        const name = loc.placeName;
                        let address = loc.placeAddress || '';
                        if (!address || address.length < 15) {
                            address = [loc.houseNumber, loc.houseName, loc.poi, loc.street,
                            loc.subSubLocality, loc.subLocality, loc.locality,
                            loc.landmark ? `Near ${loc.landmark}` : null,
                            loc.village, loc.subDistrict, loc.city, loc.district, loc.state,
                            loc.pincode || null].filter(Boolean).join(', ');
                        }
                        if (loc.pincode && !address.includes(loc.pincode)) address += ', ' + loc.pincode;
                        return {
                            name, address,
                            fullText: `${name}, ${address}`,
                            lat: parseFloat(loc.latitude) || 0,
                            lon: parseFloat(loc.longitude) || 0,
                        };
                    }).filter(item => item.name);

                    const seenNames = new Set();
                    const unique = mapped.filter(item => {
                        const k = item.name.toLowerCase().trim();
                        if (seenNames.has(k)) return false;
                        seenNames.add(k); return true;
                    });
                    unique.sort((a, b) => {
                        const an = a.name.toLowerCase(), bn = b.name.toLowerCase();
                        if ((an === q) !== (bn === q)) return an === q ? -1 : 1;
                        if (an.startsWith(q) !== bn.startsWith(q)) return an.startsWith(q) ? -1 : 1;
                        return 0;
                    });
                    setSuggestions(unique.slice(0, 5));
                } else { setSuggestions([]); }
            } catch (error) {
                try {
                    const fbRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lat=17.3850&lon=78.4867`);
                    const fbData = await fbRes.json();
                    const seen = new Set();
                    setSuggestions((fbData.features || [])
                    .filter(f => f.properties.country === 'India') // Strongly enforce India
                    .map(f => {
                        const name = f.properties.name;
                        const address = [f.properties.street, f.properties.district, f.properties.city, f.properties.state].filter(Boolean).join(', ');
                        const coords = f.geometry?.coordinates;
                        return { name, address, fullText: `${name}, ${address}`, lat: coords?.[1] || 0, lon: coords?.[0] || 0 };
                    }).filter(item => {
                        if (!item.name) return false;
                        const k = item.name.toLowerCase();
                        if (seen.has(k)) return false;
                        seen.add(k); return true;
                    }).slice(0, 5));
                } catch (e) { setSuggestions([]); }
            } finally { setIsLoading(false); }
        };

        const timer = setTimeout(fetchSuggestions, 400);
        return () => clearTimeout(timer);
    }, [pickup, drop, activeInput, pickupConfirmed, dropConfirmed, CLIENT_ID, CLIENT_SECRET]);

    // ─── Select Location (store coords!) ───
    const handleSelectLocation = (item) => {
        const coords = (item.lat && item.lon && item.lat !== 0 && item.lon !== 0)
            ? { lat: item.lat, lng: item.lon }
            : null;

        if (activeInput === 'pickup') {
            setPickup(item.fullText);
            setPickupConfirmed(true);
            setPickupCoords(coords);
            setSuggestions([]); setActiveInput(null);
            setTimeout(() => { setActiveInput('drop'); dropInputRef.current?.focus(); }, 150);
        } else {
            setDrop(item.fullText);
            setDropConfirmed(true);
            setDropCoords(coords);
            setSuggestions([]); setActiveInput(null);
        }
    };

    // ─── Weather API Integration ───
    useEffect(() => {
        const fetchWeather = async () => {
            if (!pickupCoords) return;
            setWeatherLoading(true);
            try {
                const API_KEY = '63406b7b94b72d33d03b56819ada6ff8';
                const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pickupCoords.lat}&lon=${pickupCoords.lng}&appid=${API_KEY}`);
                const data = await response.json();
                if (data.weather && data.weather.length > 0) {
                    const condition = data.weather[0].main.toLowerCase();
                    // Rain, Drizzle, Snow, or Thunderstorm triggers surcharge
                    const isBadWeather = ['rain', 'drizzle', 'snow', 'thunderstorm'].includes(condition);
                    setIsRainy(isBadWeather);
                }
            } catch (err) {
                console.error('Weather fetch error:', err);
            } finally {
                setWeatherLoading(false);
            }
        };
        if (showRouteModal && pickupCoords) fetchWeather();
    }, [showRouteModal, pickupCoords]);

    // ─── Ride Selection Options ───
    const rideOptions = [
        { id: 'bike', name: 'Bike', icon: bikeIcon, passengers: 1, baseRate: 8, speed: 35 },
        { id: 'scooty', name: 'Scooty', icon: scootyIcon, passengers: 1, baseRate: 9, speed: 32 },
        { id: 'auto', name: 'Auto', icon: autoIcon, passengers: 3, baseRate: 15, speed: 25 },
        { id: 'cab-non-ac', name: 'Cab Non-AC', icon: cabNonAcIcon, passengers: 4, baseRate: 22, speed: 30 },
        { id: 'cab-premium', name: 'Cab Premium', icon: cabPremiumIcon, passengers: 4, baseRate: 30, speed: 30 },
        { id: 'cab-xl', name: 'Cab XL', icon: cabXlIcon, passengers: 6, baseRate: 45, speed: 28 },
    ];

    const calculatePrice = (distance, rideType) => {
        if (!distance) return 0;
        const d = parseFloat(distance);
        const option = rideOptions.find(o => o.id === rideType) || rideOptions[0];
        let price = d * option.baseRate;
        // Time surcharges
        const hour = new Date().getHours();
        if (hour >= 17 && hour < 21) price *= 1.05; // Evening +5%
        else if (hour >= 21 || hour < 5) price *= 1.10; // Night +10%

        // Weather surcharge (10% more on rainy days as requested)
        if (isRainy) price *= 1.10;

        return Math.round(price);
    };

    const getDropTime = (distance, rideType) => {
        if (!distance) return '--:--';
        const d = parseFloat(distance);
        const option = rideOptions.find(o => o.id === rideType) || rideOptions[0];
        // Estimate travel time based on vehicle speed
        const travelTimeMinutes = (d / option.speed) * 60;
        const dropDate = new Date(Date.now() + travelTimeMinutes * 60000);
        return dropDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    };

    const handleCloseModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowRouteModal(false);
            setIsClosing(false);
            setIsBooking(false);
        }, 400); // Wait for transition
    };

    // --- Booking Implementation ---
    const handleBookNow = async () => {
        if (isBooking) {
            // Cancel ride
            if (currentRideId) {
                await supabase.from('rides').update({ status: 'cancelled' }).eq('id', currentRideId);
            }
            setIsBooking(false);
            setCurrentRideId(null);
            return;
        }

        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user) return alert('Please sign in first');

        const fareAmount = calculatePrice(routeInfo?.distance, selectedRide);
        const rideData = {
            passenger_email: user.email,
            pickup_name: pickup,
            drop_name: drop,
            distance: routeInfo?.distance + " km",
            fare: "₹" + fareAmount,
            vehicle_type: selectedRide,
            status: 'searching',
            pickup_lat: pickupCoords?.lat,
            pickup_lng: pickupCoords?.lng,
            drop_lat: dropCoords?.lat,
            drop_lng: dropCoords?.lng
        };

        try {
            let rideId;
            let success = false;

            try {
                const response = await fetch('http://localhost:8080/rides/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(rideData)
                });

                if (response.ok) {
                    const data = await response.json();
                    rideId = data.id;
                    success = true;
                }
            } catch (backendErr) {
                console.warn('Backend unavailable, falling back to direct Supabase:', backendErr);
            }

            if (!success) {
                // Direct Supabase Fallback
                const { data, error } = await supabase
                    .from('rides')
                    .insert(rideData)
                    .select()
                    .single();
                
                if (error) {
                    console.error('Direct booking error:', error);
                    alert('Booking failed. Please check connection.');
                    setIsBooking(false);
                    return;
                }
                rideId = data.id;
            }

            setCurrentRideId(rideId);
            setIsBooking(true);

            // Real-time subscription for driver acceptance
            const subscription = supabase
                .channel(`ride-${rideId}`)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` }, (payload) => {
                    if (payload.new.status === 'accepted') {
                        supabase.removeChannel(subscription);
                        navigate('/booked-interface', { state: { rideId: rideId } });
                    }
                })
                .subscribe();
        } catch (err) {
            console.error('Ride booking flow error:', err);
            setIsBooking(false);
        }
    };

    const showSearchButton = pickupConfirmed && dropConfirmed && suggestions.length === 0 && !isLoading;
    const showSuggestionArea = suggestions.length > 0 || isLoading;

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

            <main className="main-content-area" style={{ backgroundImage: `url("${centerImg}")` }}>
                <div className="main-inner-container">
                    <div className="booking-top-bar">
                        <div className="action-dropdowns">
                            <div className="pill-wrapper" onClick={(e) => e.stopPropagation()}>
                                <button className="action-pill" onClick={() => {
                                    if (scheduledTime) openScheduleModal();
                                    else { setShowPickupDropdown(p => !p); setShowForMeDropdown(false); }
                                }}>
                                    {scheduledTime ? <Calendar size={16} /> : <Clock size={18} />}
                                    <span>{formatScheduledLabel()}</span>
                                    {!scheduledTime && <ChevronDown size={18} />}
                                </button>
                                {showPickupDropdown && (
                                    <div className="pill-dropdown fade-in">
                                        <div className={`pill-dropdown-item ${!scheduledTime ? 'active' : ''}`}
                                            onClick={() => { setScheduledTime(null); setShowPickupDropdown(false); }}>
                                            <Clock size={16} /> <span>Pickup now</span>
                                        </div>
                                        <div className="pill-dropdown-item" onClick={openScheduleModal}>
                                            <Calendar size={16} /> <span>Schedule for later</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pill-wrapper" onClick={(e) => e.stopPropagation()}>
                                <button className="action-pill" onClick={() => {
                                    setShowForMeDropdown(p => !p); setShowPickupDropdown(false);
                                }}>
                                    <User size={18} />
                                    <span>{selectedRider ? selectedRider.name : 'For me'}</span>
                                    <ChevronDown size={18} />
                                </button>
                                {showForMeDropdown && (
                                    <div className="pill-dropdown fade-in">
                                        <div className={`pill-dropdown-item ${!selectedRider ? 'active' : ''}`}
                                            onClick={() => { setSelectedRider(null); setShowForMeDropdown(false); }}>
                                            <User size={16} /> <span>For me</span>
                                        </div>
                                        <div className="pill-dropdown-item"
                                            onClick={() => { setShowRiderModal(true); setShowForMeDropdown(false); }}>
                                            <UserPlus size={16} /> <span>Add new rider</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button className="location-action-btn" onClick={handleUseCurrentLocation} disabled={geoLoading}>
                            {geoLoading ? <Loader size={18} className="spin" /> : <MapPin size={18} />}
                            <span>{geoLoading ? 'Fetching...' : 'Use current location'}</span>
                        </button>
                    </div>

                    <div className="location-section-wrapper">
                        <div className="location-input-container">
                            <div className="location-indicator">
                                <div className="indicator-dot pickup-dot"></div>
                                <div className="indicator-line"></div>
                                <div className="indicator-square drop-square"></div>
                            </div>
                            <div className="inputs-group">
                                <input type="text" className="location-input" placeholder="Pickup location" value={pickup}
                                    onChange={(e) => { 
                                        setPickup(e.target.value); 
                                        setPickupConfirmed(false); 
                                        setPickupCoords(null); 
                                        setActiveInput('pickup');
                                        setSuggestions([]);
                                        setIsLoading(true);
                                    }}
                                    onFocus={() => { setActiveInput('pickup'); if (pickupConfirmed) setSuggestions([]); }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && pickup) {
                                            setPickupConfirmed(true); setSuggestions([]); setActiveInput(null);
                                            setTimeout(() => { setActiveInput('drop'); dropInputRef.current?.focus(); }, 100);
                                        }
                                    }}
                                />
                                <div className="input-divider"></div>
                                <input ref={dropInputRef} type="text" className="location-input" placeholder="Drop location" value={drop}
                                    onChange={(e) => { 
                                        setDrop(e.target.value); 
                                        setDropConfirmed(false); 
                                        setDropCoords(null); 
                                        setActiveInput('drop');
                                        setSuggestions([]);
                                        setIsLoading(true);
                                    }}
                                    onFocus={() => { setActiveInput('drop'); if (dropConfirmed) setSuggestions([]); }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && drop) {
                                            setDropConfirmed(true); setSuggestions([]); setActiveInput(null);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <button className="add-stop-btn"><Plus size={20} /></button>
                    </div>

                    <div className="center-dynamic-container">
                        {showSuggestionArea ? (
                            <div className="suggestions-list fade-in">
                                {isLoading ? (
                                    [1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="suggestion-item skeleton">
                                            <div className="suggestion-icon-skeleton"></div>
                                            <div className="suggestion-text-skeleton">
                                                <div className="skeleton-title"></div>
                                                <div className="skeleton-subtitle"></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    suggestions.map((item, idx) => (
                                        <div key={idx} className="suggestion-item" onClick={() => handleSelectLocation(item)}>
                                            <MapPin className="suggestion-icon" size={24} />
                                            <div className="suggestion-text">
                                                <span className="suggestion-name">{item.name}</span>
                                                <span className="suggestion-address">{item.address}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="empty-state-container">
                                {showSearchButton ? (
                                    <div className="search-btn-container fade-in">
                                        <button className="search-btn" onClick={handleSearchClick}>
                                            <Search size={22} /> <span>Search</span>
                                        </button>
                                    </div>
                                ) : (
                                    (!pickup && !drop) && (
                                        <div className="map-placeholder-section fade-in">
                                            <img src={mapPinImg} alt="Map Path" className="map-graphic-img" />
                                        </div>
                                    )
                                )}
                                {inlineError && (
                                    <div className="inline-error fade-in">
                                        <AlertCircle size={16} />
                                        <span>{inlineError}</span>
                                        <button onClick={() => setInlineError(null)}><X size={14} /></button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Route Map Modal (inside main area) ─── */}
                {showRouteModal && (
                    <div className={`route-modal-overlay ${isClosing ? 'fade-out' : ''}`}>
                        <div className={`route-modal-panel ${isClosing ? 'slide-out' : 'slide-up'}`}>
                            <div className="route-modal-header">
                                <button className="route-back-btn" onClick={handleCloseModal}>
                                    <ArrowLeft size={22} />
                                </button>
                                {routeInfo && (
                                    <div className="route-info-bar" style={{ pointerEvents: 'auto' }}>
                                        <span className="route-duration">{routeInfo.distance} KMS</span>
                                    </div>
                                )}
                            </div>

                            <div className="route-map-container">
                                {routeLoading ? (
                                    <div className="route-map-loading">
                                        <Loader size={32} className="spin" />
                                        <span>Finding best route...</span>
                                    </div>
                                ) : (pickupCoords && dropCoords) ? (
                                    <MapContainer
                                        center={[pickupCoords.lat, pickupCoords.lng]}
                                        zoom={13}
                                        style={{ width: '100%', height: '100%' }}
                                        zoomControl={false}
                                        attributionControl={false}
                                        maxBounds={[[6.4626999, 68.1097], [35.513327, 97.395358]]}
                                        minZoom={4}
                                    >
                                        <TileLayer
                                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                        />
                                        <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon} />
                                        <Marker position={[dropCoords.lat, dropCoords.lng]} icon={dropIcon} />
                                        {routeCoords.length > 0 && (
                                            <Polyline
                                                positions={routeCoords}
                                                pathOptions={{
                                                    color: '#60a5fa',
                                                    weight: 5,
                                                    opacity: 0.9,
                                                    lineCap: 'round',
                                                    lineJoin: 'round',
                                                }}
                                            />
                                        )}
                                        <FitBounds coords={[
                                            [pickupCoords.lat, pickupCoords.lng],
                                            [dropCoords.lat, dropCoords.lng]
                                        ]} />
                                    </MapContainer>
                                ) : (
                                    <div className="route-map-loading">
                                        <span>Could not load map</span>
                                    </div>
                                )}
                            </div>

                            <div className="route-ride-selection-container">
                                <div className={`route-ride-selection ${isBooking ? 'hide-rides' : ''}`}>
                                    {(routeLoading || weatherLoading) ? (
                                        // Skeleton Loaders
                                        [1, 2, 3, 4, 5, 6].map((i) => (
                                            <div key={i} className="ride-option">
                                                <div className="ride-image-container">
                                                    <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: '12px' }}></div>
                                                </div>
                                                <div className="ride-info">
                                                    <div className="ride-name-row">
                                                        <div className="skeleton" style={{ width: '100px', height: '20px' }}></div>
                                                    </div>
                                                    <div className="ride-meta">
                                                        <div className="skeleton" style={{ width: '150px', height: '16px' }}></div>
                                                    </div>
                                                </div>
                                                <div className="ride-price-container">
                                                    <div className="skeleton" style={{ width: '60px', height: '24px' }}></div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        rideOptions.map((option) => (
                                            <div
                                                key={option.id}
                                                className={`ride-option ${selectedRide === option.id ? 'selected' : ''}`}
                                                onClick={() => setSelectedRide(option.id)}
                                            >
                                                <div className="ride-image-container">
                                                    <img src={option.icon} alt={option.name} className="ride-image" />
                                                </div>
                                                <div className="ride-info">
                                                    <div className="ride-name-row">
                                                        <span className="ride-name">{option.name}</span>
                                                    </div>
                                                    <div className="ride-meta">
                                                        <div className="ride-passengers">
                                                            <User size={14} />
                                                            <span>{option.passengers}</span>
                                                        </div>
                                                        <span>•</span>
                                                        <span>Drop by {getDropTime(routeInfo?.distance, option.id)}</span>
                                                    </div>
                                                </div>
                                                <div className="ride-price-container">
                                                    <span className="ride-price">₹{calculatePrice(routeInfo?.distance, option.id)}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className={`searching-video-wrapper ${isBooking ? 'show-video' : ''}`}>
                                    <div className="video-container">
                                        <video src={searchingVideo} autoPlay loop muted playsInline className="searching-video" />
                                        <div className="loader-text-wrapper">
                                            <div className="finding-rider-text">Finding the Best Rider for You...</div>
                                            <div className="loading-bar-container">
                                                <div className="loading-bar-progress"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="book-now-container">
                                <button
                                    className={`book-now-btn ${isBooking ? 'cancel-mode' : ''}`}
                                    onClick={handleBookNow}
                                >
                                    {isBooking ? 'Cancel Ride' : 'Book Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* ─── Add Rider Modal ─── */}
            {showRiderModal && (
                <div className="modal-overlay" onClick={() => setShowRiderModal(false)}>
                    <div className="modal-card rider-modal fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-row">
                            <div className="modal-icon-badge"><UserPlus size={20} /></div>
                            <div>
                                <h3 className="modal-title">Add New Rider</h3>
                                <p className="modal-subtitle">Enter rider details for this trip</p>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="modal-field">
                                <label className="modal-label">Full Name</label>
                                <div className="modal-input-wrap">
                                    <UserCheck size={16} className="modal-input-icon" />
                                    <input type="text" className="modal-input with-icon"
                                        placeholder="Enter rider's name" value={riderName}
                                        onChange={(e) => setRiderName(e.target.value)} autoFocus />
                                </div>
                            </div>
                            <div className="modal-field">
                                <label className="modal-label">Phone Number</label>
                                <div className="modal-input-wrap">
                                    <div className="phone-prefix"><Phone size={14} /><span>+91</span></div>
                                    <input type="tel" className="modal-input with-prefix"
                                        placeholder="Enter 10-digit number" value={riderContact}
                                        onChange={(e) => setRiderContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        maxLength={10} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="modal-btn cancel" onClick={() => setShowRiderModal(false)}>Cancel</button>
                            <button className="modal-btn save" onClick={handleSaveRider} disabled={!riderName.trim()}>Save Rider</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Schedule Modal ─── */}
            {showScheduleModal && (
                <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
                    <div className="modal-card schedule-modal fade-in" onClick={(e) => e.stopPropagation()}>
                        {scheduledTime && <span className="modal-edit-label">Edit Schedule</span>}
                        <h3 className="modal-title">Schedule Ride</h3>
                        <div className="schedule-date-card">
                            <Calendar size={18} className="schedule-date-icon" />
                            <div>
                                <span className="schedule-day">{days[now.getDay()]}</span>
                                <span className="schedule-full-date">{now.getDate()} {months[now.getMonth()]} {now.getFullYear()}</span>
                            </div>
                        </div>
                        <div className="time-picker-wheel">
                            <div className="wheel-highlight" />
                            <ScrollWheelCol items={hoursList} value={tempHour} onChange={setTempHour} />
                            <div className="wheel-separator">:</div>
                            <ScrollWheelCol items={minutesList} value={tempMinute} onChange={setTempMinute}
                                formatFn={(m) => m.toString().padStart(2, '0')} />
                            <ScrollWheelCol items={['AM', 'PM']} value={tempPeriod} onChange={setTempPeriod} />
                        </div>
                        <div className="modal-actions">
                            <button className="modal-btn cancel" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                            <button className="modal-btn save" onClick={handleSelectTime}>Select Time</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingInterface;
