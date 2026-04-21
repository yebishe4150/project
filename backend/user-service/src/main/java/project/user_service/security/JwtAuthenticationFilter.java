package project.user_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import project.user_service.entity.Role;
import project.user_service.service.JwtService;

import java.io.IOException;
import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final SecurityErrorResponseWriter securityErrorResponseWriter;

    private static final String INTERNAL_TOKEN = "super-secret";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        SecurityContextHolder.clearContext();

        String internal = request.getHeader("X-Internal-Token");

        if (INTERNAL_TOKEN.equals(internal)) {
            UserPrincipal principal = new UserPrincipal(
                    UUID.fromString("00000000-0000-0000-0000-000000000000"),
                    Role.SYSTEM
            );

            SecurityContextHolder.getContext()
                    .setAuthentication(new JwtAuthentication(principal));

            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");

        if (header == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!header.startsWith("Bearer ")) {
            securityErrorResponseWriter.writeUnauthorized(request, response);
            return;
        }

        String token = header.substring(7);

        if (!jwtService.isTokenValid(token)) {
            securityErrorResponseWriter.writeUnauthorized(request, response);
            return;
        }

        UUID userId = jwtService.extractUserId(token);
        Role role = jwtService.extractRole(token);

        UserPrincipal principal = new UserPrincipal(userId, role);

        SecurityContextHolder.getContext()
                .setAuthentication(new JwtAuthentication(principal));

        filterChain.doFilter(request, response);
    }
}
