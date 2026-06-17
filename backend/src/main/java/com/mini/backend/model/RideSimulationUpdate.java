package com.mini.backend.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class RideSimulationUpdate {
    private String rideId;
    private String status;
    private Double driverLat;
    private Double driverLng;
    private Integer estimatedTimeSeconds;
    private Double bearing;
    private String driverName;
    private String vehicleInfo;

    public RideSimulationUpdate() {}

    public String getRideId() { return rideId; }
    public void setRideId(String rideId) { this.rideId = rideId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getDriverLat() { return driverLat; }
    public void setDriverLat(Double driverLat) { this.driverLat = driverLat; }
    public Double getDriverLng() { return driverLng; }
    public void setDriverLng(Double driverLng) { this.driverLng = driverLng; }
    public Integer getEstimatedTimeSeconds() { return estimatedTimeSeconds; }
    public void setEstimatedTimeSeconds(Integer estimatedTimeSeconds) { this.estimatedTimeSeconds = estimatedTimeSeconds; }
    public Double getBearing() { return bearing; }
    public void setBearing(Double bearing) { this.bearing = bearing; }
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    public String getVehicleInfo() { return vehicleInfo; }
    public void setVehicleInfo(String vehicleInfo) { this.vehicleInfo = vehicleInfo; }
}
