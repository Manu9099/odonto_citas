package com.clinica.dental.application.service;

import com.clinica.dental.common.exception.UnauthorizedException;
import com.clinica.dental.domain.model.User;
import com.clinica.dental.infrastructure.repository.UserRepository;
import com.clinica.dental.infrastructure.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserDetails details)) {
            throw new UnauthorizedException("Usuario no autenticado");
        }
        return userRepository.findById(details.getUser().getId())
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));
    }
}
