package project.user_service.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;

@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private final FixedWindowRateLimiter rateLimiter;
    private final RateLimitProperties properties;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        if (!properties.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        RateLimitRule rule = findRule(request);
        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = rule.name() + ":" + clientIp(request);
        boolean allowed = rateLimiter.allow(
                key,
                rule.limit().getLimit(),
                Duration.ofSeconds(rule.limit().getWindowSeconds())
        );

        if (!allowed) {
            writeTooManyRequests(response, rule.limit().getWindowSeconds());
            return;
        }

        filterChain.doFilter(request, response);
    }

    private RateLimitRule findRule(HttpServletRequest request) {
        return rules().stream()
                .filter(rule -> rule.method().matches(request.getMethod()))
                .filter(rule -> rule.path().equals(request.getRequestURI()))
                .findFirst()
                .orElse(null);
    }

    private List<RateLimitRule> rules() {
        return List.of(
                new RateLimitRule("me", HttpMethod.GET, "/v1/users/me", properties.getMe()),
                new RateLimitRule("update-me", HttpMethod.PUT, "/v1/users/me", properties.getUpdateMe()),
                new RateLimitRule("internal-create", HttpMethod.POST, "/v1/users", properties.getInternalCreate())
        );
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

    private void writeTooManyRequests(HttpServletResponse response, long retryAfterSeconds) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader(HttpHeaders.RETRY_AFTER, Long.toString(retryAfterSeconds));
        response.getWriter().write("""
                {"message":"Too many requests","status":429}
                """);
    }

    private record RateLimitRule(
            String name,
            HttpMethod method,
            String path,
            RateLimitProperties.EndpointLimit limit
    ) {
    }
}
