package com.mini.backend.controller;

import com.mini.backend.model.Ride;
import com.mini.backend.service.RideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rides")
@CrossOrigin(origins = "*")
public class RideController {

    @Autowired
    private RideService rideService;

    @PostMapping("/create")
    public ResponseEntity<Ride> createRide(@RequestBody Ride ride) {
        return ResponseEntity.ok(rideService.createRide(ride));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<Ride> acceptRide(@PathVariable String id, @RequestParam String driverEmail) {
        return ResponseEntity.ok(rideService.acceptRide(id, driverEmail));
    }

    @GetMapping("/available")
    public ResponseEntity<List<Ride>> getAvailableRides() {
        return ResponseEntity.ok(rideService.getAvailableRides());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ride> getRide(@PathVariable String id) {
        return rideService.getRideById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
