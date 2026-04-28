package project.auth_service.ratelimit;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "rate-limit")
public class RateLimitProperties {

    private boolean enabled = true;
    private EndpointLimit register = new EndpointLimit(10, 60);
    private EndpointLimit login = new EndpointLimit(20, 60);
    private EndpointLimit refresh = new EndpointLimit(30, 60);

    @Getter
    @Setter
    public static class EndpointLimit {
        private int limit;
        private long windowSeconds;

        public EndpointLimit() {
        }

        public EndpointLimit(int limit, long windowSeconds) {
            this.limit = limit;
            this.windowSeconds = windowSeconds;
        }
    }
}
