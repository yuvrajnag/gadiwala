package com.mini.backend.config;

import com.mini.backend.model.SimulatedDriver;
import com.mini.backend.model.DriverStatus;
import com.mini.backend.repository.SimulatedDriverRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class PoolBootstrap implements CommandLineRunner {

    private final SimulatedDriverRepository driverRepository;
    private final com.mini.backend.repository.RideRepository rideRepository;
    private final com.mini.backend.repository.ActiveSimulationRepository activeSimulationRepository;

    public PoolBootstrap(
            SimulatedDriverRepository driverRepository,
            com.mini.backend.repository.RideRepository rideRepository,
            com.mini.backend.repository.ActiveSimulationRepository activeSimulationRepository) {
        this.driverRepository = driverRepository;
        this.rideRepository = rideRepository;
        this.activeSimulationRepository = activeSimulationRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Clear all simulation, ride, and driver records first to satisfy foreign key constraints
        activeSimulationRepository.deleteAll();
        rideRepository.deleteAll();
        driverRepository.deleteAll();
        long currentCount = 0;
        
        if (currentCount < 1000) {
            long needed = 1000;
            System.out.println("Generating " + needed + " simulated drivers...");
            List<SimulatedDriver> drivers = new ArrayList<>();
            Random random = new Random();
            
            // Hyderabad center: 17.3850, 78.4867
            double centerLat = 17.3850;
            double centerLng = 78.4867;
            double stdDev = 0.05; // ~5.5km
            
            String[] firstNames = {
                "Ramesh", "Suresh", "Raju", "Babu", "Krishna", "Venkat", "Prasad", "Naidu", 
                "Amit", "Rahul", "Vijay", "Anil", "Vikram", "Sanjay", "Deepak", "Sunil", 
                "Rajesh", "Karan", "Abhishek", "Manoj", "Arjun", "Karthik", "Rohan", "Sandeep",
                "Mahesh", "Siddharth", "Vivek", "Harish", "Dinesh", "Kiran", "Pranav", "Nikhil",
                "Vikrant", "Aravind", "Madhav", "Raghav"
            };
            
            String[] lastNames = {
                "Kumar", "Rao", "Reddy", "Sharma", "Verma", "Singh", "Patel", "Yadav", 
                "Gupta", "Joshi", "Naidu", "Choudhary", "Das", "Sen", "Bhatt", "Nair", 
                "Pillai", "Prasad", "Shetty", "Goud", "Mehta", "Malhotra", "Kapoor", "Khanna",
                "Venkatesh", "Deshmukh", "Kulkarni", "Patil", "Saxena", "Trivedi", "Iyer", "Iyengar",
                "Banerjee", "Chatterjee", "Mukherjee", "Nair"
            };
            
            // Vehicle types matching frontend ride selection IDs
            String[] vehicleTypes = {"bike", "scooty", "auto", "cab-non-ac", "cab-premium", "cab-xl"};
            
            // Vehicle names per type matching the frontend ride selection
            String[] bikeNames = {
                "Royal Enfield Bullet 350", "Bajaj Pulsar NS200", "Hero Splendor Plus",
                "Honda CB Shine", "TVS Apache RTR 160", "Yamaha FZ-S V3", "KTM Duke 390",
                "Bajaj Dominar 400", "Hero XPulse 200", "Royal Enfield Meteor 350"
            };
            String[] scootyNames = {
                "Honda Activa 6G", "TVS Jupiter", "Suzuki Access 125", "Yamaha Fascino 125",
                "Hero Destini 125", "Ather 450X", "TVS NTorq 125", "Honda Dio",
                "Bajaj Chetak Electric", "Vida V1 Pro"
            };
            String[] autoNames = {
                "Bajaj RE Compact", "TVS King Deluxe", "Piaggio Ape City", "Mahindra Alfa",
                "Bajaj Maxima Z", "Atul Shakti", "Piaggio Ape Xtra LDX", "TVS King Duramax",
                "Bajaj RE 4S", "Mahindra Treo (Electric Auto)"
            };
            String[] cabNonAcNames = {
                "Maruti Suzuki Swift", "Hyundai i20", "Tata Nexon", "Honda City",
                "Maruti Suzuki Baleno", "Hyundai Venue", "Kia Sonet", "Tata Punch",
                "Renault Kwid", "Maruti Suzuki WagonR"
            };
            String[] cabPremiumNames = {
                "BMW 3 Series", "Mercedes-Benz C-Class", "Audi A4", "Volvo XC40",
                "Jaguar XE", "Porsche Cayenne", "Land Rover Defender", "BMW X5",
                "Mercedes GLE", "Audi Q7"
            };
            String[] cabXlNames = {
                "Mahindra Scorpio-N", "Tata Safari", "Hyundai Creta", "MG Hector Plus",
                "Toyota Fortuner", "Mahindra XUV700", "Kia Seltos", "Tata Harrier",
                "Skoda Kushaq", "Volkswagen Taigun"
            };
            
            for (int i = 0; i < needed; i++) {
                SimulatedDriver driver = new SimulatedDriver();
                driver.setName(firstNames[random.nextInt(firstNames.length)] + " " + lastNames[random.nextInt(lastNames.length)]);
                
                String type = vehicleTypes[random.nextInt(vehicleTypes.length)];
                driver.setVehicleType(type);
                
                switch (type) {
                    case "bike":
                        driver.setVehicleName(bikeNames[random.nextInt(bikeNames.length)]);
                        break;
                    case "scooty":
                        driver.setVehicleName(scootyNames[random.nextInt(scootyNames.length)]);
                        break;
                    case "auto":
                        driver.setVehicleName(autoNames[random.nextInt(autoNames.length)]);
                        break;
                    case "cab-non-ac":
                        driver.setVehicleName(cabNonAcNames[random.nextInt(cabNonAcNames.length)]);
                        break;
                    case "cab-premium":
                        driver.setVehicleName(cabPremiumNames[random.nextInt(cabPremiumNames.length)]);
                        break;
                    case "cab-xl":
                        driver.setVehicleName(cabXlNames[random.nextInt(cabXlNames.length)]);
                        break;
                }
                
                // Generate TS-format plate: TS[01-39] [A-Z]{2} [1000-9999]
                driver.setLicensePlate(String.format("TS%02d %c%c %04d", 
                        random.nextInt(39) + 1,
                        (char)(random.nextInt(26) + 'A'),
                        (char)(random.nextInt(26) + 'A'),
                        random.nextInt(9000) + 1000));
                
                double rating = 4.0 + (random.nextDouble());
                if (rating > 5.0) rating = 5.0;
                driver.setRating(Math.round(rating * 10.0) / 10.0);
                
                driver.setLatitude(centerLat + random.nextGaussian() * stdDev);
                driver.setLongitude(centerLng + random.nextGaussian() * stdDev);
                
                driver.setStatus(DriverStatus.AVAILABLE);
                
                drivers.add(driver);
            }
            
            driverRepository.saveAll(drivers);
            System.out.println(needed + " simulated drivers generated.");
        }
    }
}
