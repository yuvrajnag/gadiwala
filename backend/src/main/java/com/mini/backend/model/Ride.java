package com.mini.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity
@Table(name = "rides")
public class Ride {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id") // Added @Column for id
    private String id;

    @JsonProperty("passenger_email")
    @Column(name = "passenger_email")
    private String passengerEmail;

    @JsonProperty("driver_email")
    @Column(name = "driver_email")
    private String driverEmail;

    @JsonProperty("pickup_name")
    @Column(name = "pickup_name")
    private String pickupName;

    @JsonProperty("drop_name")
    @Column(name = "drop_name")
    private String dropName;

    @Column(name = "pickup_lat")
    private Double pickupLat;

    @Column(name = "pickup_lng")
    private Double pickupLng;

    @Column(name = "drop_lat")
    private Double dropLat;

    @Column(name = "drop_lng")
    private Double dropLng;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private RideStatus status;

    @Column(name = "fare")
    private String fare;

    @Column(name = "distance")
    private String distance;

    @JsonProperty("vehicle_type")
    @Column(name = "vehicle_type")
    private String vehicleType;

    @Column(name = "otp")
    private String otp;

    @JsonProperty("created_at")
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "simulated_driver_id")
    private SimulatedDriver simulatedDriver;
    public Ride() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPassengerEmail() { return passengerEmail; }
    public void setPassengerEmail(String passengerEmail) { this.passengerEmail = passengerEmail; }
    public String getDriverEmail() { return driverEmail; }
    public void setDriverEmail(String driverEmail) { this.driverEmail = driverEmail; }
    public String getPickupName() { return pickupName; }
    public void setPickupName(String pickupName) { this.pickupName = pickupName; }
    public String getDropName() { return dropName; }
    public void setDropName(String dropName) { this.dropName = dropName; }
    public Double getPickupLat() { return pickupLat; }
    public void setPickupLat(Double pickupLat) { this.pickupLat = pickupLat; }
    public Double getPickupLng() { return pickupLng; }
    public void setPickupLng(Double pickupLng) { this.pickupLng = pickupLng; }
    public Double getDropLat() { return dropLat; }
    public void setDropLat(Double dropLat) { this.dropLat = dropLat; }
    public Double getDropLng() { return dropLng; }
    public void setDropLng(Double dropLng) { this.dropLng = dropLng; }
    public RideStatus getStatus() { return status; }
    public void setStatus(RideStatus status) { this.status = status; }
    public String getFare() { return fare; }
    public void setFare(String fare) { this.fare = fare; }
    public String getDistance() { return distance; }
    public void setDistance(String distance) { this.distance = distance; }
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public SimulatedDriver getSimulatedDriver() { return simulatedDriver; }
    public void setSimulatedDriver(SimulatedDriver simulatedDriver) { this.simulatedDriver = simulatedDriver; }
}
