package com.mini.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mini.backend.model.*;
import com.mini.backend.repository.ActiveSimulationRepository;
import com.mini.backend.repository.RideRepository;
import com.mini.backend.repository.SimulatedDriverRepository;
import com.mini.backend.dto.RideSimulationUpdate;
import com.mini.backend.dto.RouteData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
public class SimulationScheduler {

    @Autowired
    private ActiveSimulationRepository activeSimulationRepository;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private SimulatedDriverRepository driverRepository;

    @Autowired
    private RouteService routeService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Scheduled(fixedRate = 1000)
    @Transactional
    public void processTick() {
        List<ActiveSimulation> activeSimulations = activeSimulationRepository.findByStatus("RUNNING");

        for (ActiveSimulation sim : activeSimulations) {
            try {
                // Parse coordinates
                List<List<Double>> coords = objectMapper.readValue(sim.getRouteGeometry(), new TypeReference<List<List<Double>>>() {});
                if (coords == null || coords.isEmpty()) continue;
                int routeLength = coords.size();

                // Check for Wait logic (Arrival pause)
                if (sim.getWaitTicks() != null && sim.getWaitTicks() > 0) {
                    sim.setWaitTicks(sim.getWaitTicks() - 1);
                    if (sim.getWaitTicks() == 0) {
                        transitionToTripStarted(sim);
                    }
                    activeSimulationRepository.save(sim);
                    broadcastUpdate(sim, coords, routeLength);
                    continue;
                }
                
                // Transition to DRIVER_APPROACHING if needed
                Optional<Ride> rideOpt = rideRepository.findById(sim.getRideId());
                if (rideOpt.isPresent() && rideOpt.get().getStatus() == RideStatus.DRIVER_FOUND) {
                    Ride r = rideOpt.get();
                    r.setStatus(RideStatus.DRIVER_APPROACHING);
                    rideRepository.save(r);
                }

                // Calculate step advancement
                int stepIncrement = (int) Math.ceil(sim.getSpeedMultiplier());
                int nextStep = sim.getCurrentStep() + stepIncrement;

                if (nextStep >= routeLength - 1) {
                    nextStep = routeLength - 1; // Cap at end
                    sim.setCurrentStep(nextStep);
                    updateDriverLocation(sim, coords.get(nextStep));
                    handleRouteEnd(sim);
                } else {
                    sim.setCurrentStep(nextStep);
                    updateDriverLocation(sim, coords.get(nextStep));
                }

                sim.setLastTick(System.currentTimeMillis());
                activeSimulationRepository.save(sim);

                broadcastUpdate(sim, coords, routeLength);

            } catch (JsonProcessingException e) {
                System.err.println("Error parsing route geometry for simulation " + sim.getId());
            }
        }
    }

    private void broadcastUpdate(ActiveSimulation sim, List<List<Double>> coords, int routeLength) {
        double progress = 0.0;
        if (routeLength > 0) {
            progress = (double) sim.getCurrentStep() / routeLength;
        }
        if (progress > 1.0) progress = 1.0;
        if (progress < 0.0) progress = 0.0;

        int eta = 0;
        if (sim.getTotalDurationSeconds() != null && sim.getSpeedMultiplier() != null && sim.getSpeedMultiplier() > 0) {
            double simulatedDuration = sim.getTotalDurationSeconds() / sim.getSpeedMultiplier();
            eta = (int) Math.round(simulatedDuration * (1.0 - progress));
            if (eta < 0) eta = 0;
        }

        Ride rideForStatus = rideRepository.findById(sim.getRideId()).orElse(null);
        String currentRideStatus = rideForStatus != null ? rideForStatus.getStatus().name() : "";
        
        if (currentRideStatus.equals("DRIVER_ARRIVED") || currentRideStatus.equals("TRIP_COMPLETED")) {
            eta = 0;
        }

        Double currentLat = 0.0;
        Double currentLng = 0.0;
        if (rideForStatus != null && rideForStatus.getSimulatedDriver() != null) {
            currentLat = rideForStatus.getSimulatedDriver().getLatitude();
            currentLng = rideForStatus.getSimulatedDriver().getLongitude();
        } else if (!coords.isEmpty() && sim.getCurrentStep() < routeLength) {
            currentLat = coords.get(sim.getCurrentStep()).get(1);
            currentLng = coords.get(sim.getCurrentStep()).get(0);
        }

        RideSimulationUpdate update = new RideSimulationUpdate(
            sim.getRideId(),
            currentLat,
            currentLng,
            eta,
            currentRideStatus,
            progress
        );

        messagingTemplate.convertAndSend("/topic/ride/" + sim.getRideId(), update);
    }

    private void updateDriverLocation(ActiveSimulation sim, List<Double> coord) {
        // coord is [lng, lat] from GeoJSON
        Optional<Ride> rideOpt = rideRepository.findById(sim.getRideId());
        if (rideOpt.isPresent() && rideOpt.get().getSimulatedDriver() != null) {
            SimulatedDriver driver = rideOpt.get().getSimulatedDriver();
            driver.setLongitude(coord.get(0));
            driver.setLatitude(coord.get(1));
            driverRepository.save(driver);
        }
    }

    private void handleRouteEnd(ActiveSimulation sim) {
        Optional<Ride> rideOpt = rideRepository.findById(sim.getRideId());
        if (!rideOpt.isPresent()) return;
        Ride ride = rideOpt.get();

        if (sim.getPhase() == SimulationPhase.APPROACH) {
            // Arrived at pickup
            ride.setStatus(RideStatus.DRIVER_ARRIVED);
            rideRepository.save(ride);
            
            if (ride.getSimulatedDriver() != null) {
                SimulatedDriver driver = ride.getSimulatedDriver();
                driver.setStatus(DriverStatus.ARRIVED);
                driverRepository.save(driver);
            }

            // Pause for 3 ticks (3000ms) before starting trip
            sim.setWaitTicks(3);
        } else if (sim.getPhase() == SimulationPhase.TRIP) {
            // Arrived at destination
            ride.setStatus(RideStatus.TRIP_COMPLETED);
            rideRepository.save(ride);

            if (ride.getSimulatedDriver() != null) {
                SimulatedDriver driver = ride.getSimulatedDriver();
                driver.setStatus(DriverStatus.AVAILABLE);
                // Location naturally stays at destination
                driverRepository.save(driver);
            }

            sim.setStatus("STOPPED");
        }
    }

    private void transitionToTripStarted(ActiveSimulation sim) {
        Optional<Ride> rideOpt = rideRepository.findById(sim.getRideId());
        if (!rideOpt.isPresent()) return;
        Ride ride = rideOpt.get();

        ride.setStatus(RideStatus.TRIP_STARTED);
        rideRepository.save(ride);

        if (ride.getSimulatedDriver() != null) {
            SimulatedDriver driver = ride.getSimulatedDriver();
            driver.setStatus(DriverStatus.ON_TRIP);
            driverRepository.save(driver);
        }

        // Generate new OSRM route for TRIP phase
        RouteData tripRouteData = routeService.getRouteData(ride.getPickupLat(), ride.getPickupLng(), ride.getDropLat(), ride.getDropLng());
        
        sim.setPhase(SimulationPhase.TRIP);
        if (tripRouteData != null) {
            sim.setRouteGeometry(tripRouteData.getGeometry());
            sim.setTotalDistanceMeters(tripRouteData.getDistanceMeters());
            sim.setTotalDurationSeconds(tripRouteData.getDurationSeconds());
        }
        sim.setCurrentStep(0);
        // Retain current speedMultiplier
    }
}
