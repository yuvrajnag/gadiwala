import React, { useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

// Helper to calculate bearing
const calculateBearing = (startLat, startLng, destLat, destLng) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;

    const startLatRad = toRad(startLat);
    const startLngRad = toRad(startLng);
    const destLatRad = toRad(destLat);
    const destLngRad = toRad(destLng);

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
              Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

    const brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
};

const AnimatedDriverMarker = ({ position, vehicleImg, duration = 1000 }) => {
    const markerRef = useRef(null);
    const prevPosRef = useRef(position);
    const currentPosRef = useRef(position);
    const bearingRef = useRef(0);
    const startTimeRef = useRef(null);
    const rAFRef = useRef(null);

    // Create a dynamic icon that incorporates rotation in an inner div
    // This avoids conflicting with Leaflet's positioning transform on the parent element
    const driverIcon = L.divIcon({
        className: 'driver-marker',
        html: `<div class="driver-marker-container">
                 <div class="driver-marker-body" style="width: 50px; height: 50px; transform: rotate(${bearingRef.current}deg); display: flex; align-items: center; justify-content: center; transition: none;">
                   <img src="${vehicleImg}" style="width: 46px; height: auto; transform: rotate(-90deg); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6));" />
                 </div>
               </div>`,
        iconSize: [50, 50],
        iconAnchor: [25, 25]
    });

    useEffect(() => {
        if (!markerRef.current || !position) return;
        
        const startLat = currentPosRef.current.lat;
        const startLng = currentPosRef.current.lng;

        if (startLat === position.lat && startLng === position.lng) return;

        // Calculate rotation bearing
        const newBearing = calculateBearing(startLat, startLng, position.lat, position.lng);
        
        // Calculate shortest angle difference
        let diff = newBearing - bearingRef.current;
        diff = ((diff + 180) % 360) - 180;
        
        const startBearing = bearingRef.current;
        const targetBearing = startBearing + diff;

        startTimeRef.current = performance.now();

        const animate = (time) => {
            let progress = (time - startTimeRef.current) / duration;
            if (progress > 1) progress = 1;

            const currentLat = startLat + (position.lat - startLat) * progress;
            const currentLng = startLng + (position.lng - startLng) * progress;
            const currentBearing = startBearing + (targetBearing - startBearing) * progress;

            // Keep track of current interpolated position/bearing to avoid snapping on interruption
            currentPosRef.current = { lat: currentLat, lng: currentLng };
            bearingRef.current = currentBearing;

            if (markerRef.current) {
                markerRef.current.setLatLng([currentLat, currentLng]);
                const el = markerRef.current.getElement();
                if (el) {
                    const bodyDiv = el.querySelector('.driver-marker-body');
                    if (bodyDiv) {
                        bodyDiv.style.transform = `rotate(${currentBearing}deg)`;
                    }
                }
            }

            if (progress < 1) {
                rAFRef.current = requestAnimationFrame(animate);
            } else {
                prevPosRef.current = position;
                bearingRef.current = targetBearing % 360;
            }
        };

        if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
        rAFRef.current = requestAnimationFrame(animate);

        return () => {
            if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
        };
    }, [position, duration]);

    return <Marker ref={markerRef} position={[currentPosRef.current.lat, currentPosRef.current.lng]} icon={driverIcon} />;
};

export default AnimatedDriverMarker;
