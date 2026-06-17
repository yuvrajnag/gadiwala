package com.mini.backend.repository;

import com.mini.backend.model.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

import com.mini.backend.model.RideStatus;

@Repository
public interface RideRepository extends JpaRepository<Ride, String> {
    List<Ride> findByStatus(RideStatus status);
    List<Ride> findByPassengerEmail(String passengerEmail);
    List<Ride> findByDriverEmail(String driverEmail);
}
