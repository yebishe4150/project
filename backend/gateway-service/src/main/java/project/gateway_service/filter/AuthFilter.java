package project.gateway_service.filter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import project.gateway_service.service.JwtService;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthFilter implements GlobalFilter, Ordered {

    private static final String INTERNAL_TOKEN_HEADER = "X-Internal-Token";
    private final JwtService jwtService;

    private static final List<String> PUBLIC_PATHS = List.of(
            "/actuator/health",
            "/actuator/info",
            "/api/v1/auth",
            "/api/v1/content/feed",
//            "/api/v1/content/images",
            "/api/v1/content/public",
            "/api/v1/content/ai",
            "/api/v1/content/ai/generate"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerWebExchange sanitizedExchange = removeInternalTokenHeader(exchange);

        if (sanitizedExchange.getRequest().getMethod() == HttpMethod.OPTIONS) {
            return chain.filter(sanitizedExchange);
        }

        String path = sanitizedExchange.getRequest().getURI().getPath();

        boolean isPublic = PUBLIC_PATHS.stream()
                .anyMatch(path::startsWith);

        if (isPublic) {
            return chain.filter(sanitizedExchange);
        }

        String header = sanitizedExchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        if (header == null || !header.startsWith("Bearer ")) {
            return unauthorized(sanitizedExchange);
        }

        String token = header.substring(7);

        if (!jwtService.isTokenValid(token)) {
            return unauthorized(sanitizedExchange);
        }

        return chain.filter(sanitizedExchange);
    }

    private ServerWebExchange removeInternalTokenHeader(ServerWebExchange exchange) {
        return exchange.mutate()
                .request(request -> request.headers(headers -> headers.remove(INTERNAL_TOKEN_HEADER)))
                .build();
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        var request = exchange.getRequest();

        log.warn("Unauthorized request: {} {}",
                request.getMethod(),
                request.getURI().getPath()
        );
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return -2;
    }
}
