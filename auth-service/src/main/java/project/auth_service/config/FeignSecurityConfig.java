package project.auth_service.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignSecurityConfig {

    private static final String INTERNAL_TOKEN = "super-secret";

    @Bean
    public RequestInterceptor internalRequestInterceptor() {
        return template ->
                template.header("X-Internal-Token", INTERNAL_TOKEN);
    }
}