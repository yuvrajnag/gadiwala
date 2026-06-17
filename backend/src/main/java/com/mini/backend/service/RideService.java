package com.mini.backend.service;

import com.mini.backend.model.Ride;
import com.mini.backend.model.RideStatus;
import com.mini.backend.model.SimulatedDriver;
import com.mini.backend.repository.RideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class RideService {

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private DriverSimulationService driverSimulationService;

    @Transactional
    public Ride createRide(Ride ride) {
        ride.setStatus(RideStatus.SEARCHING);
        int otp = (int)(Math.random() * 9000) + 1000;
        ride.setOtp(String.valueOf(otp));
        ride = rideRepository.save(ride);

        // Try to assign a driver immediately if coordinates are present
        if (ride.getPickupLat() != null && ride.getPickupLng() != null) {
            SimulatedDriver assignedDriver = driverSimulationService.assignNearestDriver(ride);
            if (assignedDriver != null) {
                ride.setSimulatedDriver(assignedDriver);
                // We use driver's name as email for mock purposes
                ride.setDriverEmail(assignedDriver.getName());
                transitionRideState(ride, RideStatus.DRIVER_FOUND);
            }
        }

        return ride;
    }

    @Transactional
    public void transitionRideState(Ride ride, RideStatus newState) {
        ride.setStatus(newState);
        rideRepository.save(ride);
    }

    public Ride acceptRide(String rideId, String driverEmail) {
        Optional<Ride> rideOpt = rideRepository.findById(rideId);
        if (rideOpt.isPresent()) {
            Ride ride = rideOpt.get();
            ride.setDriverEmail(driverEmail);
            transitionRideState(ride, RideStatus.DRIVER_FOUND);
            return ride;
        }
        throw new RuntimeException("Ride not found");
    }

    public List<Ride> getAvailableRides() {
        return rideRepository.findByStatus(RideStatus.SEARCHING);
    }

    public Optional<Ride> getRideById(String id) {
        return rideRepository.findById(id);
    }
}
