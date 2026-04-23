package com.clinica.dental.infrastructure.security;

import com.clinica.dental.domain.enums.UserRole;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthenticatedUser {
    private Long id;
    private String email;
    private String fullName;
    private UserRole role;
}
