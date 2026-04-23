package project.auth_service.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignSecurityConfig {

    @Bean
    public RequestInterceptor internalRequestInterceptor(InternalSecurityProperties properties) {
        return template ->
                template.header("X-Internal-Token", properties.getToken());
    }
}
