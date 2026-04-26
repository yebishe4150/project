package project.user_service.controller;

import org.junit.jupiter.api.Test;
import project.user_service.AbstractTest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HealthEndpointTest extends AbstractTest {

    @Test
    void when_healthEndpointCalledWithoutToken_then_ReturnStatusUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
