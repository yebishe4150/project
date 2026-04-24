package project.content_service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import project.content_service.AbstractTest;
import project.content_service.entity.Image;
import project.content_service.entity.ImageSource;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FeedControllerTest extends AbstractTest {

    @Test
    void when_feedHasNoImages_then_ReturnEmptyList() throws Exception {
        String response = mockMvc.perform(get("/v1/content/public/feed"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertThat(json.get("data")).hasSize(0);
    }

    @Test
    void when_feedHasLandingEntries_then_ReturnOnlyLandingImages() throws Exception {
        Image included = saveImage(UUID.randomUUID(), ImageSource.UPLOAD, "http://localhost:9000/images/feed.jpg", "feed");
        saveImage(UUID.randomUUID(), ImageSource.UPLOAD, "http://localhost:9000/images/ignored.jpg", "ignored");
        saveLandingFeed(included.getId());

        String response = mockMvc.perform(get("/v1/content/public/feed"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertThat(json.get("data")).hasSize(1);
        assertThat(json.get("data").get(0).get("url").asText()).isEqualTo("http://cdn.local:9000/images/feed.jpg");
    }
}
