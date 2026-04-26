package project.auth_service.controller;

import org.junit.jupiter.api.Test;
import project.auth_service.AbstractWireMockTest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HealthEndpointTest extends AbstractWireMockTest {

    @Test
    void when_healthEndpointCalledWithoutToken_then_ReturnStatusUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
