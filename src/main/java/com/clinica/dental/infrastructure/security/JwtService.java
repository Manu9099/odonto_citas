package com.clinica.dental.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey accessSecretKey;
    private final SecretKey refreshSecretKey;
    private final long accessExpirationMinutes;
    private final long refreshExpirationDays;

    public JwtService(
            @Value("${app.jwt.access-secret}") String accessSecret,
            @Value("${app.jwt.refresh-secret}") String refreshSecret,
            @Value("${app.jwt.access-expiration-minutes:30}") long accessExpirationMinutes,
            @Value("${app.jwt.refresh-expiration-days:30}") long refreshExpirationDays) {
        this.accessSecretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(accessSecret));
        this.refreshSecretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(refreshSecret));
        this.accessExpirationMinutes = accessExpirationMinutes;
        this.refreshExpirationDays = refreshExpirationDays;
    }

    public String generateAccessToken(AppUserDetails userDetails) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claims(Map.of(
                        "role", userDetails.getUser().getRole().name(),
                        "userId", userDetails.getUser().getId(),
                        "fullName", userDetails.getUser().getFullName()
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessExpirationMinutes * 60)))
                .signWith(accessSecretKey)
                .compact();
    }

    public String generateRefreshToken(AppUserDetails userDetails) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claims(Map.of("userId", userDetails.getUser().getId()))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(refreshExpirationDays * 24 * 60 * 60)))
                .signWith(refreshSecretKey)
                .compact();
    }

    public Claims parseAccessToken(String token) {
        return Jwts.parser().verifyWith(accessSecretKey).build().parseSignedClaims(token).getPayload();
    }

    public Claims parseRefreshToken(String token) {
        return Jwts.parser().verifyWith(refreshSecretKey).build().parseSignedClaims(token).getPayload();
    }

    public String extractUsernameFromAccess(String token) {
        return parseAccessToken(token).getSubject();
    }

    public String extractUsernameFromRefresh(String token) {
        return parseRefreshToken(token).getSubject();
    }

    public boolean isAccessTokenValid(String token, AppUserDetails userDetails) {
        String username = extractUsernameFromAccess(token);
        return username.equalsIgnoreCase(userDetails.getUsername()) && parseAccessToken(token).getExpiration().after(new Date());
    }
}
