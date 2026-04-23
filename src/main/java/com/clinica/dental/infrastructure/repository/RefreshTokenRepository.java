package com.clinica.dental.infrastructure.repository;

import com.clinica.dental.domain.model.RefreshToken;
import com.clinica.dental.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenAndRevokedFalse(String token);
    void deleteByUser(User user);
}
