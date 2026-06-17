package com.mini.backend.repository;

import com.mini.backend.model.SimulatedDriver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import com.mini.backend.model.DriverStatus;

@Repository
public interface SimulatedDriverRepository extends JpaRepository<SimulatedDriver, String> {
    List<SimulatedDriver> findByStatusAndVehicleType(DriverStatus status, String vehicleType);
    List<SimulatedDriver> findByStatus(DriverStatus status);
}
