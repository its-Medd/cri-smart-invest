package Cri.Tpme.Back_end.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class OAuth2RedirectController {

    @GetMapping("/oauth2/authorize/{registrationId}")
    public String redirectToDefaultAuthorizationEndpoint(
            @PathVariable String registrationId,
            HttpServletRequest request) {
        String queryString = request.getQueryString();
        String target = "/oauth2/authorization/" + registrationId;
        if (queryString != null && !queryString.isBlank()) {
            target += "?" + queryString;
        }
        return "redirect:" + target;
    }
}