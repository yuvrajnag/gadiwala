package com.mini.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "active_simulations")
public class ActiveSimulation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "status")
    private String status; // e.g., RUNNING, PAUSED, STOPPED

    @Column(name = "ride_id")
    private String rideId;

    @Enumerated(EnumType.STRING)
    @Column(name = "phase")
    private SimulationPhase phase;

    @Column(name = "route_geometry", columnDefinition = "TEXT")
    private String routeGeometry;

    @Column(name = "current_step")
    private Integer currentStep;

    @Column(name = "speed_multiplier")
    private Double speedMultiplier;

    @Column(name = "wait_ticks")
    private Integer waitTicks;
    
    @Transient
    private Integer etaSeconds;

    @Column(name = "total_distance_meters")
    private Double totalDistanceMeters;

    @Column(name = "total_duration_seconds")
    private Double totalDurationSeconds;

    @Column(name = "last_tick")
    private Long lastTick;

    @Column(name = "current_tick")
    private Long currentTick;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public ActiveSimulation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRideId() { return rideId; }
    public void setRideId(String rideId) { this.rideId = rideId; }

    public SimulationPhase getPhase() { return phase; }
    public void setPhase(SimulationPhase phase) { this.phase = phase; }

    public String getRouteGeometry() { return routeGeometry; }
    public void setRouteGeometry(String routeGeometry) { this.routeGeometry = routeGeometry; }

    public Integer getCurrentStep() { return currentStep; }
    public void setCurrentStep(Integer currentStep) { this.currentStep = currentStep; }

    public Double getSpeedMultiplier() { return speedMultiplier; }
    public void setSpeedMultiplier(Double speedMultiplier) { this.speedMultiplier = speedMultiplier; }

    public Integer getWaitTicks() { return waitTicks; }
    public void setWaitTicks(Integer waitTicks) { this.waitTicks = waitTicks; }

    public Integer getEtaSeconds() { return etaSeconds; }
    public void setEtaSeconds(Integer etaSeconds) { this.etaSeconds = etaSeconds; }

    public Double getTotalDistanceMeters() { return totalDistanceMeters; }
    public void setTotalDistanceMeters(Double totalDistanceMeters) { this.totalDistanceMeters = totalDistanceMeters; }

    public Double getTotalDurationSeconds() { return totalDurationSeconds; }
    public void setTotalDurationSeconds(Double totalDurationSeconds) { this.totalDurationSeconds = totalDurationSeconds; }

    public Long getLastTick() { return lastTick; }
    public void setLastTick(Long lastTick) { this.lastTick = lastTick; }
    
    public Long getCurrentTick() { return currentTick; }
    public void setCurrentTick(Long currentTick) { this.currentTick = currentTick; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
