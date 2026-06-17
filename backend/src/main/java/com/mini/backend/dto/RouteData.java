package com.mini.backend.dto;

public class RouteData {
    private String geometry;
    private Double distanceMeters;
    private Double durationSeconds;

    public RouteData(String geometry, Double distanceMeters, Double durationSeconds) {
        this.geometry = geometry;
        this.distanceMeters = distanceMeters;
        this.durationSeconds = durationSeconds;
    }

    public String getGeometry() { return geometry; }
    public Double getDistanceMeters() { return distanceMeters; }
    public Double getDurationSeconds() { return durationSeconds; }
}
