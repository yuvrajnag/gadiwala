package com.mini.backend.repository;

import com.mini.backend.model.ActiveSimulation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActiveSimulationRepository extends JpaRepository<ActiveSimulation, Long> {
    List<ActiveSimulation> findByStatus(String status);
}
