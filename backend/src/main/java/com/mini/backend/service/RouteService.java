package com.mini.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mini.backend.dto.RouteData;

@Service
public class RouteService {
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public RouteService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public RouteData getRouteData(double startLat, double startLng, double endLat, double endLng) {
        String url = String.format("http://router.project-osrm.org/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson", 
            startLng, startLat, endLng, endLat);
        
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                JsonNode routes = rootNode.path("routes");
                if (routes.isArray() && routes.size() > 0) {
                    JsonNode route = routes.get(0);
                    JsonNode geometry = route.path("geometry");
                    JsonNode coordinates = geometry.path("coordinates");
                    Double distance = route.path("distance").asDouble();
                    Double duration = route.path("duration").asDouble();
                    return new RouteData(coordinates.toString(), distance, duration);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch route from OSRM: " + e.getMessage());
        }
        return null;
    }
}
