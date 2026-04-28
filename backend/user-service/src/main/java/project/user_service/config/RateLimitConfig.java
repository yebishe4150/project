package project.user_service.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import project.user_service.ratelimit.FixedWindowRateLimiter;
import project.user_service.ratelimit.RateLimitProperties;
import project.user_service.ratelimit.RateLimitingFilter;

import java.time.Clock;

@Configuration
@EnableConfigurationProperties(RateLimitProperties.class)
public class RateLimitConfig {

    @Bean
    public FixedWindowRateLimiter fixedWindowRateLimiter() {
        return new FixedWindowRateLimiter(Clock.systemUTC());
    }

    @Bean
    public FilterRegistrationBean<RateLimitingFilter> rateLimitingFilter(
            FixedWindowRateLimiter rateLimiter,
            RateLimitProperties properties
    ) {
        FilterRegistrationBean<RateLimitingFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new RateLimitingFilter(rateLimiter, properties));
        registration.setOrder(0);
        return registration;
    }
}
