package project.user_service.ratelimit;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "rate-limit")
public class RateLimitProperties {

    private boolean enabled = true;
    private EndpointLimit me = new EndpointLimit(120, 60);
    private EndpointLimit updateMe = new EndpointLimit(30, 60);
    private EndpointLimit internalCreate = new EndpointLimit(60, 60);

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
