import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import car1 from '../assets/car1.png';
import car2 from '../assets/car2.png';
import car3 from '../assets/car3.png';
import car4 from '../assets/car4.png';
import titleImage from '../assets/title.png';
import followImage from '../assets/follow.png';
import arrowImage from '../assets/arrow.png';
import notepad from '../assets/notepad.png';
import { X, Eye, EyeOff } from 'lucide-react';

const Home = () => {
    // Phase 0: Title Entry
    // Phase 1: Car 1 Movement starts
    // Phase 2: Car 2 switch + "My garage..." text
    // Phase 3: Transition 2 -> 3 (Text disappears)
    // Phase 4: Transition 3 -> 4
    // Phase 5: Final state (Car 4 + "Need a ride?" text)
    const [phase, setPhase] = useState(0);
    const [currentCar, setCurrentCar] = useState(car1);
    const [isBlueExpanded, setIsBlueExpanded] = useState(false);
    const [formMode, setFormMode] = useState('signin'); // 'signin' or 'signup'
    const [showPassword, setShowPassword] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    
    // Form States
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
        role: 'customer'
    });

    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) return alert('Please fill all fields');
        
        try {
            const response = await fetch('http://localhost:8080/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                const targetRoute = data.role === 'driver' ? '/driver-dashboard' : '/booking-interface';
                localStorage.setItem('user', JSON.stringify(data));
                startExitSequence(targetRoute);
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            alert('Failed to connect to backend. Make sure it is running on port 8080.');
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password || !formData.role || !formData.name) return alert('Please fill all fields');
        if (!formData.email || !formData.password || !formData.role || !formData.name || !formData.phone) return alert('Please fill all fields');
        
        try {
            const response = await fetch('http://localhost:8080/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.name, // Still using name as username
                    name: formData.name,     // Also sending as specific name field
                    phone: formData.phone,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                })
            });

            const data = await response.json();

            if (response.ok) {
                const targetRoute = data.role === 'driver' ? '/driver-dashboard' : '/booking-interface';
                localStorage.setItem('user', JSON.stringify(data));
                alert('Account created successfully!');
                startExitSequence(targetRoute);
            } else {
                alert(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Sign up error:', error);
            alert('Failed to connect to backend.');
        }
    };

    const startExitSequence = (targetRoute) => {
        setCurrentCar(car1);      // Change back to car 1
        setIsBlueExpanded(false); // Close the form
        setIsExiting(true);       // Trigger exit animations
        
        // Wait for animations (e.g., car moving, follow.png expanding) before routing
        setTimeout(() => {
            navigate(targetRoute);
        }, 1500); // 1.5 seconds gives enough time for a dramatic exit
    };

    useEffect(() => {
        // Step 1: Car 1 Movement starts after Title settles (1.2s total delay)
        const t1 = setTimeout(() => setPhase(1), 1200);

        // Step 2: Car 1 arrives and switches to Car 2 quickly (1.2s start + 1.5s move + 0.2s wait = 2.9s)
        const t2 = setTimeout(() => {
            setPhase(2);
            setCurrentCar(car2);
        }, 1200 + 1500 + 200);

        // Step 3: Switch to Car 3 after 3s (2.9s + 3s = 5.9s)
        const t3 = setTimeout(() => {
            setPhase(3);
            setCurrentCar(car3);
        }, 2900 + 3000);

        // Step 4: Switch to Car 4 after 0.8s (5.9s + 0.8s = 6.7s)
        const t4 = setTimeout(() => {
            setPhase(4);
            setCurrentCar(car4);
        }, 5900 + 800);

        // Step 5: Final text reveal after 0.5s (6.7s + 0.5s = 7.2s) - "Little bit faster"
        const t5 = setTimeout(() => {
            setPhase(5);
        }, 6700 + 500);

        // Step 6: Arrow appears with animation (7.2s + 0.5s = 7.7s)
        const t6 = setTimeout(() => {
            setPhase(6);
        }, 7200 + 500);

        // Step 7: Blue rectangle appears after arrow animation finishes (7.7s + 0.8s = 8.5s)
        const t7 = setTimeout(() => {
            setPhase(7);
        }, 7700 + 800);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            clearTimeout(t5);
            clearTimeout(t6);
            clearTimeout(t7);
        };
    }, []);

    return (
        <div className="home-container">

            {phase >= 7 && (
                <div 
                    className={`notepad-wrapper ${isBlueExpanded ? 'expanded' : ''}`}
                >
                    <img 
                        src={notepad}
                        alt="notepad"
                        className="notepad-image"
                        onClick={() => setIsBlueExpanded(!isBlueExpanded)}
                    />
                    
                    <div className={`form-container ${isBlueExpanded ? 'visible' : ''}`}>
                        <X 
                            className="close-btn" 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsBlueExpanded(false);
                            }}
                        />
                        <div className="form-content">
                            {formMode === 'signin' ? (
                                <div className="form-mode-wrapper">
                                    <div className="form-header">
                                        <h2 className="form-title">Welcome Back</h2>
                                    </div>
                                    <div className="form-main">
                                        <div className="input-group">
                                            <input 
                                                type="email" 
                                                name="email"
                                                placeholder="Email" 
                                                value={formData.email}
                                                onChange={handleInputChange}
                                            />
                                            <div className="password-input-wrapper">
                                                <input 
                                                    type={showPassword ? "text" : "password"} 
                                                    name="password"
                                                    placeholder="Password" 
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                />
                                                <div 
                                                    className="password-toggle"
                                                    onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword); }}
                                                >
                                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </div>
                                            </div>
                                        </div>
                                        <button className="submit-btn" onClick={handleSignIn}>Sign In</button>
                                    </div>
                                    <div className="form-footer">
                                        <p className="toggle-text">
                                            Don't have an account? <span onClick={(e) => { e.stopPropagation(); setFormMode('signup'); setShowPassword(false); }}>Sign up here</span>
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="form-mode-wrapper">
                                    <div className="form-header">
                                        <h2 className="form-title">Join Us</h2>
                                    </div>
                                    <div className="form-main">
                                        <div className="input-group">
                                            <input 
                                                type="text" 
                                                name="name"
                                                placeholder="Full Name" 
                                                value={formData.name}
                                                onChange={handleInputChange}
                                            />
                                            <input 
                                                type="tel" 
                                                name="phone"
                                                placeholder="Phone Number" 
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                            />
                                            <input 
                                                type="email" 
                                                name="email"
                                                placeholder="Email" 
                                                value={formData.email}
                                                onChange={handleInputChange}
                                            />
                                            <div className="password-input-wrapper">
                                                <input 
                                                    type={showPassword ? "text" : "password"} 
                                                    name="password"
                                                    placeholder="Password" 
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                />
                                                <div 
                                                    className="password-toggle"
                                                    onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword); }}
                                                >
                                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </div>
                                            </div>
                                            <select 
                                                className="form-select" 
                                                name="role"
                                                value={formData.role}
                                                onChange={handleInputChange}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="driver">Driver</option>
                                            </select>
                                        </div>
                                        <button className="submit-btn" onClick={handleSignUp}>Create Account</button>
                                    </div>
                                    <div className="form-footer">
                                        <p className="toggle-text">
                                            Already have an account? <span onClick={(e) => { e.stopPropagation(); setFormMode('signin'); setShowPassword(false); }}>Sign in here</span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <div className={`title-section ${phase >= 1 ? 'title-shift-up' : ''} ${isBlueExpanded ? 'faded-out' : ''}`}>
                <img src={titleImage} alt="Title" className="home-title" />
                <p className="title-tagline">From my garage to your road.</p>
            </div>

            <div className={`car-animation-wrapper ${phase >= 1 ? 'animate' : ''} ${isBlueExpanded ? 'blurred-out' : ''} ${isExiting ? 'exit-sequence' : ''}`}>
                {phase === 2 && !isExiting && (
                    <div className="left-text fade-in">
                        &nbsp;&nbsp;&nbsp; My garage is full.<br />Might as well share.
                    </div>
                )}

                <div className="speed-lines">
                    <div className="line l1"></div>
                    <div className="line l2"></div>
                    <div className="line l3"></div>
                </div>

                <img
                    src={followImage}
                    alt="Speed Trail"
                    className="speed-trail"
                />

                <img
                    src={currentCar}
                    alt="Car"
                    className="car-image"
                />

                {phase >= 5 && !isExiting && (
                    <div className="bottom-text fade-in">
                        Need a ride? Sign up here.
                    </div>
                )}

                {phase >= 6 && !isExiting && (
                    <div className="arrow-container">
                        <img src={arrowImage} alt="Arrow pointing to form" className="arrow-graphic" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
