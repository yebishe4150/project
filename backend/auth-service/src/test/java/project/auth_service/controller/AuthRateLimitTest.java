package project.auth_service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import project.auth_service.AbstractTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:auth-rate-limit-test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
        "rate-limit.enabled=true",
        "rate-limit.register.limit=1",
        "rate-limit.register.window-seconds=60",
        "rate-limit.login.limit=1",
        "rate-limit.login.window-seconds=60",
        "rate-limit.refresh.limit=1",
        "rate-limit.refresh.window-seconds=60"
})
class AuthRateLimitTest extends AbstractTest {

    @Test
    void when_registerLimitExceeded_then_ReturnTooManyRequests() throws Exception {
        mockMvc.perform(post("/v1/auth/register")
                        .header("X-Forwarded-For", "10.0.0.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        JsonNode error = objectMapper.readTree(mockMvc.perform(post("/v1/auth/register")
                        .header("X-Forwarded-For", "10.0.0.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isTooManyRequests())
                .andReturn()
                .getResponse()
                .getContentAsString());

        assertThat(error.get("status").asInt()).isEqualTo(429);
        assertThat(error.get("message").asText()).isEqualTo("Too many requests");
    }

    @Test
    void when_loginLimitExceeded_then_ReturnTooManyRequests() throws Exception {
        String body = "{\"loginName\":\"missing\",\"password\":\"1234sAsD\"}";

        mockMvc.perform(post("/v1/auth/login")
                        .header("X-Forwarded-For", "10.0.0.2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/v1/auth/login")
                        .header("X-Forwarded-For", "10.0.0.2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void when_refreshLimitExceeded_then_ReturnTooManyRequests() throws Exception {
        mockMvc.perform(post("/v1/auth/refresh")
                        .header("X-Forwarded-For", "10.0.0.3"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/v1/auth/refresh")
                        .header("X-Forwarded-For", "10.0.0.3"))
                .andExpect(status().isTooManyRequests());
    }
}
