package project.gateway_service.filter;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import project.gateway_service.service.JwtService;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthFilterTest {

    private static final String INTERNAL_TOKEN_HEADER = "X-Internal-Token";

    @Mock
    private JwtService jwtService;

    @Test
    void when_PublicPathWithoutAuthorization_then_RequestPassesThrough() {
        AuthFilter filter = new AuthFilter(jwtService);
        CapturingChain chain = new CapturingChain();
        MockServerWebExchange exchange = exchange(HttpMethod.GET, "/api/v1/content/public/feed");

        filter.filter(exchange, chain).block();

        assertThat(chain.wasCalled()).isTrue();
        assertThat(exchange.getResponse().getStatusCode()).isNull();
        verifyNoInteractions(jwtService);
    }

    @Test
    void when_ActuatorHealthPathWithoutAuthorization_then_RequestPassesThrough() {
        AuthFilter filter = new AuthFilter(jwtService);
        CapturingChain chain = new CapturingChain();
        MockServerWebExchange exchange = exchange(HttpMethod.GET, "/actuator/health");

        filter.filter(exchange, chain).block();

        assertThat(chain.wasCalled()).isTrue();
        assertThat(exchange.getResponse().getStatusCode()).isNull();
        verifyNoInteractions(jwtService);
    }

    @Test
    void when_OptionsRequest_then_RequestPassesThroughWithoutAuthCheck() {
        AuthFilter filter = new AuthFilter(jwtService);
        CapturingChain chain = new CapturingChain();
        MockServerWebExchange exchange = exchange(HttpMethod.OPTIONS, "/api/v1/users/me");

        filter.filter(exchange, chain).block();

        assertThat(chain.wasCalled()).isTrue();
        assertThat(exchange.getResponse().getStatusCode()).isNull();
        verifyNoInteractions(jwtService);
    }

    @Test
    void when_ProtectedPathWithoutAuthorization_then_ReturnUnauthorized() {
        AuthFilter filter = new AuthFilter(jwtService);
        CapturingChain chain = new CapturingChain();
        MockServerWebExchange exchange = exchange(HttpMethod.GET, "/api/v1/users/me");

        filter.filter(exchange, chain).block();

        assertThat(chain.wasCalled()).isFalse();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verifyNoInteractions(jwtService);
    }

    @Test
    void when_ProtectedPathWithInvalidToken_then_ReturnUnauthorized() {
        AuthFilter filter = new AuthFilter(jwtService);
        CapturingChain chain = new CapturingChain();
        MockServerWebExchange exchange = exchange(
                HttpMethod.GET,
                "/api/v1/users/me",
                header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token")
        );

        when(jwtService.isTokenValid("invalid-token")).thenReturn(false);

        filter.filter(exchange, chain).block();

        assertThat(chain.wasCalled()).isFalse();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(jwtService).isTokenValid("invalid-token");
    }

    @Test
    void when_ProtectedPathWithValidToken_then_StripsInternalHeaderBeforeForwarding() {
        AuthFilter filter = new AuthFilter(jwtService);
        CapturingChain chain = new CapturingChain();
        MockServerWebExchange exchange = exchange(
                HttpMethod.GET,
                "/api/v1/users/me",
                header(HttpHeaders.AUTHORIZATION, "Bearer valid-token"),
                header(INTERNAL_TOKEN_HEADER, "super-secret")
        );

        when(jwtService.isTokenValid("valid-token")).thenReturn(true);

        filter.filter(exchange, chain).block();

        assertThat(chain.wasCalled()).isTrue();
        assertThat(chain.getCapturedExchange()).isNotNull();
        assertThat(chain.getCapturedExchange().getRequest().getHeaders().containsKey(INTERNAL_TOKEN_HEADER)).isFalse();
        assertThat(chain.getCapturedExchange().getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION))
                .isEqualTo("Bearer valid-token");
        verify(jwtService).isTokenValid("valid-token");
    }

    @Test
    void when_ProtectedPathWithMalformedAuthorizationHeader_then_ReturnUnauthorizedWithoutJwtValidation() {
        AuthFilter filter = new AuthFilter(jwtService);
        CapturingChain chain = new CapturingChain();
        MockServerWebExchange exchange = exchange(
                HttpMethod.GET,
                "/api/v1/users/me",
                header(HttpHeaders.AUTHORIZATION, "invalid-header")
        );

        filter.filter(exchange, chain).block();

        assertThat(chain.wasCalled()).isFalse();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(jwtService, never()).isTokenValid("invalid-header");
    }

    private MockServerWebExchange exchange(HttpMethod method, String path, Header... headers) {
        MockServerHttpRequest.BaseBuilder<?> builder = MockServerHttpRequest.method(method, path);

        for (Header header : headers) {
            builder.header(header.name(), header.value());
        }

        return MockServerWebExchange.from(builder.build());
    }

    private Header header(String name, String value) {
        return new Header(name, value);
    }

    private record Header(String name, String value) {
    }

    private static final class CapturingChain implements GatewayFilterChain {

        private ServerWebExchange capturedExchange;
        private boolean called;

        @Override
        public Mono<Void> filter(ServerWebExchange exchange) {
            this.called = true;
            this.capturedExchange = exchange;
            return Mono.empty();
        }

        private boolean wasCalled() {
            return called;
        }

        private ServerWebExchange getCapturedExchange() {
            return capturedExchange;
        }
    }
}
