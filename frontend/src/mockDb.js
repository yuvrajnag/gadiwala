// mockDb.js - Simplified local storage data layer
const STORAGE_KEYS = {
    USERS: 'gaadhiwala_users',
    RIDES: 'gaadhiwala_rides',
    DRIVERS: 'gaadhiwala_drivers',
    CURRENT_USER: 'user'
};

const get = (key, defaultVal = []) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
};

const save = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const mockDb = {
    // Auth
    users: {
        register: (userData) => {
            const users = get(STORAGE_KEYS.USERS);
            if (users.find(u => u.email === userData.email)) {
                return { success: false, message: 'User already exists' };
            }
            const newUser = { ...userData, id: Date.now() };
            users.push(newUser);
            save(STORAGE_KEYS.USERS, users);
            return { success: true, data: newUser };
        },
        login: (email, password) => {
            const users = get(STORAGE_KEYS.USERS);
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                return { success: true, data: user };
            }
            return { success: false, message: 'Invalid credentials' };
        },
        getByEmail: (email) => get(STORAGE_KEYS.USERS).find(u => u.email === email)
    },

    // Rides
    rides: {
        create: (rideData) => {
            const rides = get(STORAGE_KEYS.RIDES);
            const newRide = { ...rideData, id: Date.now(), status: 'pending' };
            rides.push(newRide);
            save(STORAGE_KEYS.RIDES, rides);
            return { success: true, data: newRide };
        },
        getAll: () => get(STORAGE_KEYS.RIDES),
        getById: (id) => get(STORAGE_KEYS.RIDES).find(r => r.id === parseInt(id)),
        updateStatus: (id, status, driverData = {}) => {
            const rides = get(STORAGE_KEYS.RIDES);
            const index = rides.findIndex(r => r.id === parseInt(id));
            if (index !== -1) {
                rides[index] = { ...rides[index], status, ...driverData };
                save(STORAGE_KEYS.RIDES, rides);
                return { success: true, data: rides[index] };
            }
            return { success: false, message: 'Ride not found' };
        }
    },

    // Drivers
    drivers: {
        saveProfile: (driverData) => {
            const drivers = get(STORAGE_KEYS.DRIVERS);
            const index = drivers.findIndex(d => d.email === driverData.email);
            if (index !== -1) {
                drivers[index] = { ...drivers[index], ...driverData };
            } else {
                drivers.push({ ...driverData, id: Date.now() });
            }
            save(STORAGE_KEYS.DRIVERS, drivers);
            return { success: true };
        },
        getByEmail: (email) => get(STORAGE_KEYS.DRIVERS).find(d => d.email === email)
    }
};
