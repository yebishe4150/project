package project.gateway_service.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class GatewayLoggingFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange,
                             org.springframework.cloud.gateway.filter.GatewayFilterChain chain) {

        var request = exchange.getRequest();
        long start = System.currentTimeMillis();

        String requestId = request.getId();

        return chain.filter(exchange)
                .then(Mono.fromRunnable(() -> {

                    long duration = System.currentTimeMillis() - start;

                    var response = exchange.getResponse();

                    String uri = request.getURI().getPath();
                    String method = request.getMethod().name();
                    int status = response.getStatusCode() != null
                            ? response.getStatusCode().value()
                            : 0;

                    if (status >= 400) {
                        log.error("[{}] HTTP {} {} | status={} | {}ms",
                                requestId, method, uri, status, duration);
                    } else {
                        log.info("[{}] HTTP {} {} | status={} | {}ms",
                                requestId, method, uri, status, duration);
                    }
                }));
    }

    @Override
    public int getOrder() {
        return -1;
    }
}