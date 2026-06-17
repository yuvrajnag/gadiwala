package com.mini.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.view.RedirectView;

@Controller
public class RedirectController {

    @GetMapping("/")
    public RedirectView redirectToFrontend() {
        return new RedirectView("https://gaadhiwala-f.vercel.app/");
    }
}
