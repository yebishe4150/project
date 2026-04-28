package project.content_service.ratelimit;

import java.time.Clock;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

public class FixedWindowRateLimiter {

    private final ConcurrentMap<String, Window> windows = new ConcurrentHashMap<>();
    private final Clock clock;

    public FixedWindowRateLimiter(Clock clock) {
        this.clock = clock;
    }

    public boolean allow(String key, int limit, Duration windowSize) {
        long now = clock.millis();
        long windowMillis = windowSize.toMillis();

        Window window = windows.compute(key, (ignored, current) -> {
            if (current == null || current.expiresAt <= now) {
                return new Window(1, now + windowMillis);
            }

            current.count++;
            return current;
        });

        return window.count <= limit;
    }

    private static class Window {
        private int count;
        private final long expiresAt;

        private Window(int count, long expiresAt) {
            this.count = count;
            this.expiresAt = expiresAt;
        }
    }
}
