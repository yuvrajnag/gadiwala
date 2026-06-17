package com.mini.backend.service;

import com.mini.backend.exception.AccountNotFoundException;
import com.mini.backend.exception.UserAlreadyExistsException;
import com.mini.backend.model.User;
import com.mini.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public User register(User user) {
        Optional<User> existing = userRepository.findByEmail(user.getEmail());
        if (existing.isPresent()) {
            throw new UserAlreadyExistsException("Email '" + user.getEmail() + "' is already registered.");
        }
        return userRepository.save(user);
    }

    public User login(String email, String password) {
        return userRepository.findByEmail(email)
                .filter(user -> user.getPassword().equals(password))
                .orElseThrow(() -> new AccountNotFoundException("Invalid email or password."));
    }
}
