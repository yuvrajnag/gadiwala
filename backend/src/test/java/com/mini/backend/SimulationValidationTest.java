package com.mini.backend;

import com.mini.backend.model.*;
import com.mini.backend.repository.*;
import com.mini.backend.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest
public class SimulationValidationTest {

    @Autowired
    private RideService rideService;

    @Autowired
    private SimulatedDriverRepository driverRepository;

    @Autowired
    private ActiveSimulationRepository activeSimulationRepository;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private SimulationScheduler simulationScheduler;

    @Test
    public void testSimulation() throws InterruptedException {
        // Find an available driver
        List<SimulatedDriver> availableDrivers = driverRepository.findByStatus(DriverStatus.AVAILABLE);
        if (availableDrivers.isEmpty()) {
            System.out.println("No drivers available!");
            return;
        }
        SimulatedDriver initialDriver = availableDrivers.get(0);
        System.out.println("--- BEFORE RIDE ---");
        System.out.println("Driver ID: " + initialDriver.getId() + " status: " + initialDriver.getStatus() + ", Lat: " + initialDriver.getLatitude() + ", Lng: " + initialDriver.getLongitude());

        // Create ride
        Ride ride = new Ride();
        ride.setPickupLat(initialDriver.getLatitude() + 0.002);
        ride.setPickupLng(initialDriver.getLongitude() + 0.002);
        ride.setDropLat(initialDriver.getLatitude() + 0.010);
        ride.setDropLng(initialDriver.getLongitude() + 0.010);
        
        ride = rideService.createRide(ride);

        System.out.println("--- AFTER CREATE RIDE ---");
        System.out.println("Ride Status: " + ride.getStatus());
        SimulatedDriver assignedDriver = ride.getSimulatedDriver();
        System.out.println("Assigned Driver ID: " + (assignedDriver != null ? assignedDriver.getId() : "null"));
        if (assignedDriver != null) {
            System.out.println("Driver Status: " + assignedDriver.getStatus());
        }
        
        List<ActiveSimulation> sims = activeSimulationRepository.findByStatus("RUNNING");
        System.out.println("Active Simulations: " + sims.size());
        if (!sims.isEmpty()) {
            ActiveSimulation sim = sims.get(0);
            System.out.println("Phase: " + sim.getPhase() + ", Wait Ticks: " + sim.getWaitTicks());
        }

        // Tick loop
        for (int i = 0; i < 40; i++) {
            simulationScheduler.processTick();
            Ride currentRide = rideRepository.findById(ride.getId()).get();
            SimulatedDriver currentDriver = driverRepository.findById(assignedDriver.getId()).get();
            System.out.println("TICK " + i + ": Ride=" + currentRide.getStatus() + ", Driver=" + currentDriver.getStatus() + ", Location=(" + currentDriver.getLatitude() + ", " + currentDriver.getLongitude() + ")");
            if (currentRide.getStatus() == RideStatus.TRIP_COMPLETED) {
                break;
            }
        }

        System.out.println("--- AFTER COMPLETION ---");
        Ride finalRide = rideRepository.findById(ride.getId()).get();
        SimulatedDriver finalDriver = driverRepository.findById(assignedDriver.getId()).get();
        System.out.println("Ride Status: " + finalRide.getStatus());
        System.out.println("Driver Status: " + finalDriver.getStatus() + ", Location=(" + finalDriver.getLatitude() + ", " + finalDriver.getLongitude() + ")");
        List<ActiveSimulation> finalSims = activeSimulationRepository.findByStatus("RUNNING");
        System.out.println("Running Simulations: " + finalSims.size());
    }
}
