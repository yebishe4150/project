package project.common.logging.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import project.common.logging.filter.LoggingFilter;
import project.common.logging.mask.JsonMaskingService;
import project.common.logging.properties.MaskingProperties;

@AutoConfiguration
@EnableConfigurationProperties(MaskingProperties.class)
public class LoggingAutoConfiguration {

    @Bean
    public JsonMaskingService jsonMaskingService(ObjectMapper objectMapper,
                                                 MaskingProperties properties) {
        return new JsonMaskingService(objectMapper, properties);
    }

    @Bean
    public FilterRegistrationBean<LoggingFilter> loggingFilter(
            JsonMaskingService maskingService) {

        FilterRegistrationBean<LoggingFilter> registration = new FilterRegistrationBean<>();

        registration.setFilter(new LoggingFilter(maskingService));
        registration.setOrder(1);

        return registration;
    }
}