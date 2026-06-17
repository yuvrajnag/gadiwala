package com.mini.backend.service;

import com.mini.backend.model.ActiveSimulation;
import com.mini.backend.model.DriverStatus;
import com.mini.backend.model.SimulationPhase;
import com.mini.backend.model.Ride;
import com.mini.backend.model.SimulatedDriver;
import com.mini.backend.dto.RouteData;
import com.mini.backend.repository.ActiveSimulationRepository;
import com.mini.backend.repository.SimulatedDriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DriverSimulationService {

    @Autowired
    private SimulatedDriverRepository driverRepository;

    @Autowired
    private ActiveSimulationRepository activeSimulationRepository;

    @Autowired
    private RouteService routeService;

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    // Radius of Earth in KM
    private static final double R = 6371.0;

    public double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        lat1 = Math.toRadians(lat1);
        lat2 = Math.toRadians(lat2);

        double a = Math.pow(Math.sin(dLat / 2), 2) + Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
        double c = 2 * Math.asin(Math.sqrt(a));
        return R * c;
    }

    @Transactional
    public SimulatedDriver assignNearestDriver(Ride ride) {
        if (ride.getPickupLat() == null || ride.getPickupLng() == null) {
            return null; // Cannot assign without pickup coordinates
        }

        // Filter by the ride's requested vehicle type so the driver card shows the correct vehicle
        String requestedType = ride.getVehicleType();
        List<SimulatedDriver> availableDrivers;
        if (requestedType != null && !requestedType.isEmpty()) {
            availableDrivers = driverRepository.findByStatusAndVehicleType(DriverStatus.AVAILABLE, requestedType);
        } else {
            availableDrivers = driverRepository.findByStatus(DriverStatus.AVAILABLE);
        }
        
        SimulatedDriver nearestDriver = null;
        double minDistance = Double.MAX_VALUE;

        for (SimulatedDriver driver : availableDrivers) {
            if (driver.getLatitude() != null && driver.getLongitude() != null) {
                double distance = calculateHaversineDistance(ride.getPickupLat(), ride.getPickupLng(), driver.getLatitude(), driver.getLongitude());
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestDriver = driver;
                }
            }
        }

        if (nearestDriver != null) {
            // Lock driver
            nearestDriver.setStatus(DriverStatus.ASSIGNED);
            driverRepository.save(nearestDriver);

            // Fetch route from Driver to Pickup (APPROACH phase)
            RouteData approachRouteData = routeService.getRouteData(nearestDriver.getLatitude(), nearestDriver.getLongitude(), ride.getPickupLat(), ride.getPickupLng());

            ActiveSimulation sim = new ActiveSimulation();
            sim.setRideId(ride.getId());
            sim.setPhase(SimulationPhase.APPROACH);
            sim.setStatus("RUNNING");
            if (approachRouteData != null) {
                sim.setRouteGeometry(approachRouteData.getGeometry());
                sim.setTotalDistanceMeters(approachRouteData.getDistanceMeters());
                sim.setTotalDurationSeconds(approachRouteData.getDurationSeconds());
            }
            sim.setCurrentStep(0);
            sim.setSpeedMultiplier(5.0);
            sim.setWaitTicks(0);
            sim.setCurrentTick(0L);
            sim.setLastTick(System.currentTimeMillis());
            sim.setUpdatedAt(LocalDateTime.now());
            
            activeSimulationRepository.save(sim);
            
            com.mini.backend.model.RideSimulationUpdate update = new com.mini.backend.model.RideSimulationUpdate();
            update.setRideId(ride.getId());
            update.setStatus("DRIVER_FOUND");
            update.setDriverName(nearestDriver.getName());
            update.setVehicleInfo(nearestDriver.getVehicleName() + " (" + nearestDriver.getLicensePlate() + ")");
            update.setDriverLat(nearestDriver.getLatitude());
            update.setDriverLng(nearestDriver.getLongitude());
            messagingTemplate.convertAndSend("/topic/ride/" + ride.getId(), update);
            
            return nearestDriver;
        }

        return null;
    }
}
