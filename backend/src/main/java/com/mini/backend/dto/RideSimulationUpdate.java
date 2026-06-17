package com.mini.backend.dto;

public class RideSimulationUpdate {
    private String rideId;
    private Double driverLat;
    private Double driverLng;
    private Integer eta;
    private String status;
    private Double progress;

    public RideSimulationUpdate(String rideId, Double driverLat, Double driverLng, Integer eta, String status, Double progress) {
        this.rideId = rideId;
        this.driverLat = driverLat;
        this.driverLng = driverLng;
        this.eta = eta;
        this.status = status;
        this.progress = progress;
    }

    public String getRideId() { return rideId; }
    public Double getDriverLat() { return driverLat; }
    public Double getDriverLng() { return driverLng; }
    public Integer getEta() { return eta; }
    public String getStatus() { return status; }
    public Double getProgress() { return progress; }
}
