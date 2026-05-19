package project.content_service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import project.content_service.AbstractWireMockTest;
import project.content_service.entity.Image;
import project.content_service.entity.ImageSource;
import project.content_service.entity.Role;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.stubbing.Scenario.STARTED;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ImageControllerTest extends AbstractWireMockTest {

    private static final String CONTENT_URL = "/v1/content";
    private static final String USER_IMAGES_URL = "/v1/content/images/user";
    private static final String USER_UPLOADED_URL = "/v1/content/images/user/uploads";
    private static final String USER_GENERATED_URL = "/v1/content/images/user/generated";
    private static final String USER_UPLOADED_BY_NICKNAME_URL = "/v1/content/images/users/tester/uploads";
    private static final String USER_GENERATED_BY_NICKNAME_URL = "/v1/content/images/users/tester/generated";
    private static final String USER_SERVICE_NICKNAME_URL = "/v1/users/tester";
    private static final String INTERNAL_TOKEN = "super-secret";

    @Test
    void when_uploadWithUserToken_then_SaveImageAndReturnExternalUrl() throws Exception {
        UUID userId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cat.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                jpegBytes()
        );

        when(s3Client.putObject(any(software.amazon.awssdk.services.s3.model.PutObjectRequest.class), any(software.amazon.awssdk.core.sync.RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().eTag("etag").build());

        String response = mockMvc.perform(MockMvcRequestBuilders.multipart("/v1/content/images")
                        .file(file)
                        .param("description", "test image")
                        .param("tags", "Cat", "Art")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(userId, Role.USER)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        JsonNode data = json.get("data");

        assertThat(data.get("url").asText()).startsWith("http://cdn.local:9000/images/");
        assertThat(imageRepository.findAll()).hasSize(1);

        Image saved = imageRepository.findAll().getFirst();
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getSource()).isEqualTo(ImageSource.UPLOAD);
        assertThat(saved.getTags()).extracting(tag -> tag.getName()).containsExactlyInAnyOrder("cat", "art");
    }

    @Test
    void when_uploadWithoutToken_then_ReturnUnauthorized() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cat.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                jpegBytes()
        );

        String response = mockMvc.perform(MockMvcRequestBuilders.multipart("/v1/content/images")
                        .file(file))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);
        assertThat(error.get("message").asText()).isEqualTo("Unauthorized");
    }

    @Test
    void when_uploadWithAdminToken_then_ReturnForbidden() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cat.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                jpegBytes()
        );

        String response = mockMvc.perform(MockMvcRequestBuilders.multipart("/v1/content/images")
                        .file(file)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(UUID.randomUUID(), Role.ADMIN)))
                .andExpect(status().isForbidden())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);
        assertThat(error.get("message").asText()).isEqualTo("Forbidden");
    }

    @Test
    void when_uploadEmptyFile_then_ReturnBadRequest() throws Exception {
        UUID userId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                new byte[0]
        );

        String response = mockMvc.perform(MockMvcRequestBuilders.multipart("/v1/content/images")
                        .file(file)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(userId, Role.USER)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);
        assertThat(error.get("message").asText()).isEqualTo("Файл пустой");
    }

    @Test
    void when_uploadContentTypeDoesNotMatchBytes_then_ReturnBadRequest() throws Exception {
        UUID userId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cat.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "not-an-image".getBytes()
        );

        String response = mockMvc.perform(MockMvcRequestBuilders.multipart("/v1/content/images")
                        .file(file)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(userId, Role.USER)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);
        assertThat(error.get("message").asText()).contains("Поддерживаются только изображения");
    }

    @Test
    void when_uploadHeaderDoesNotMatchDetectedType_then_ReturnBadRequest() throws Exception {
        UUID userId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cat.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                pngBytes()
        );

        String response = mockMvc.perform(MockMvcRequestBuilders.multipart("/v1/content/images")
                        .file(file)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(userId, Role.USER)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);
        assertThat(error.get("message").asText()).isEqualTo("Content-Type файла не соответствует содержимому");
    }

    @Test
    void when_uploadExtensionDoesNotMatchDetectedType_then_ReturnBadRequest() throws Exception {
        UUID userId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cat.png",
                MediaType.IMAGE_JPEG_VALUE,
                jpegBytes()
        );

        String response = mockMvc.perform(MockMvcRequestBuilders.multipart("/v1/content/images")
                        .file(file)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(userId, Role.USER)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);
        assertThat(error.get("message").asText()).isEqualTo("Расширение файла не соответствует содержимому");
    }

    @Test
    void when_getAllWithUserToken_then_ReturnAllImages() throws Exception {
        saveImage(UUID.randomUUID(), ImageSource.UPLOAD, "http://localhost:9000/images/a.jpg", "a");
        saveImage(UUID.randomUUID(), ImageSource.GENERATED, "http://localhost:9000/images/b.jpg", "b");

        String response = mockMvc.perform(get(CONTENT_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(UUID.randomUUID(), Role.USER)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertThat(json.get("data")).hasSize(2);
    }

    @Test
    void when_getAllWithoutToken_then_ReturnUnauthorized() throws Exception {
        String response = mockMvc.perform(get(CONTENT_URL))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);

        assertThat(error.get("status").asInt()).isEqualTo(401);
        assertThat(error.get("message").asText()).isEqualTo("Unauthorized");
        assertThat(error.get("path").asText()).isEqualTo(CONTENT_URL);
    }

    @Test
    void when_getUserSpecificEndpoints_then_FilterByOwnerAndSource() throws Exception {
        UUID userId = UUID.randomUUID();
        Image uploadedImage = saveImage(userId, ImageSource.UPLOAD, "http://localhost:9000/images/upload.jpg", "upload");
        Image generatedImage = saveImage(userId, ImageSource.GENERATED, "http://localhost:9000/images/generated.jpg", "generated");
        saveImage(UUID.randomUUID(), ImageSource.UPLOAD, "http://localhost:9000/images/foreign.jpg", "foreign");

        String auth = "Bearer " + bearerToken(userId, Role.USER);

        JsonNode allByUser = objectMapper.readTree(mockMvc.perform(get(USER_IMAGES_URL).header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        JsonNode uploaded = objectMapper.readTree(mockMvc.perform(get(USER_UPLOADED_URL).header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        JsonNode generated = objectMapper.readTree(mockMvc.perform(get(USER_GENERATED_URL).header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());

        assertThat(allByUser.get("data")).hasSize(2);
        assertThat(uploaded.get("data")).hasSize(1);
        assertThat(generated.get("data")).hasSize(1);
        assertUserImageInList(allByUser.get("data"), uploadedImage, "http://cdn.local:9000/images/upload.jpg", 0, false);
        assertUserImageInList(allByUser.get("data"), generatedImage, "http://cdn.local:9000/images/generated.jpg", 0, false);
        assertUserImage(uploaded.get("data").get(0), uploadedImage, "http://cdn.local:9000/images/upload.jpg", 0, false);
        assertUserImage(generated.get("data").get(0), generatedImage, "http://cdn.local:9000/images/generated.jpg", 0, false);
    }

    @Test
    void when_profileImagesRequested_then_ReturnLikeStateForRequester() throws Exception {
        UUID ownerId = UUID.randomUUID();
        UUID requesterId = UUID.randomUUID();
        Image image = saveImage(ownerId, ImageSource.UPLOAD, "http://localhost:9000/images/upload.jpg", "upload");

        mockMvc.perform(put("/v1/content/images/" + image.getId() + "/like")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(requesterId, Role.USER)))
                .andExpect(status().isOk());

        String auth = "Bearer " + bearerToken(ownerId, Role.USER);
        JsonNode response = objectMapper.readTree(mockMvc.perform(get(USER_UPLOADED_URL)
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());

        JsonNode data = response.get("data").get(0);
        assertUserImage(data, image, "http://cdn.local:9000/images/upload.jpg", 1, false);
    }

    @Test
    void when_getUserImagesWithAdminToken_then_ReturnForbidden() throws Exception {
        String response = mockMvc.perform(get(USER_IMAGES_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(UUID.randomUUID(), Role.ADMIN)))
                .andExpect(status().isForbidden())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);

        assertThat(error.get("status").asInt()).isEqualTo(403);
        assertThat(error.get("message").asText()).isEqualTo("Forbidden");
        assertThat(error.get("path").asText()).isEqualTo(USER_IMAGES_URL);
    }

    @Test
    void when_getUserSpecificEndpointsByNickname_then_ResolveUserAndFilterBySource() throws Exception {
        UUID requesterId = UUID.randomUUID();
        UUID targetUserId = UUID.randomUUID();
        Image uploadedImage = saveImage(targetUserId, ImageSource.UPLOAD, "http://localhost:9000/images/upload.jpg", "upload");
        Image generatedImage = saveImage(targetUserId, ImageSource.GENERATED, "http://localhost:9000/images/generated.jpg", "generated");
        saveImage(UUID.randomUUID(), ImageSource.UPLOAD, "http://localhost:9000/images/foreign.jpg", "foreign");

        String auth = "Bearer " + bearerToken(requesterId, Role.USER);

        stubSuccess(
                USER_SERVICE_NICKNAME_URL,
                HttpMethod.GET,
                Map.of("X-Internal-Token", INTERNAL_TOKEN),
                Map.of(
                        "id", targetUserId.toString(),
                        "nickname", "tester"
                )
        );

        JsonNode uploaded = objectMapper.readTree(mockMvc.perform(get(USER_UPLOADED_BY_NICKNAME_URL)
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        JsonNode generated = objectMapper.readTree(mockMvc.perform(get(USER_GENERATED_BY_NICKNAME_URL)
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());

        assertThat(uploaded.get("data")).hasSize(1);
        assertUserImage(uploaded.get("data").get(0), uploadedImage, "http://cdn.local:9000/images/upload.jpg", 0, false);
        assertThat(generated.get("data")).hasSize(1);
        assertUserImage(generated.get("data").get(0), generatedImage, "http://cdn.local:9000/images/generated.jpg", 0, false);
    }

    @Test
    void when_getUserSpecificEndpointByNickname_whenUserServiceFirstCallTimesOut_then_RetryAndReturnImages() throws Exception {
        UUID requesterId = UUID.randomUUID();
        UUID targetUserId = UUID.randomUUID();
        Image generatedImage = saveImage(targetUserId, ImageSource.GENERATED, "http://localhost:9000/images/generated.jpg", "generated");

        String auth = "Bearer " + bearerToken(requesterId, Role.USER);
        String scenario = "USER_SERVICE_RETRY";
        String secondCall = "SECOND_CALL";

        WireMock.stubFor(WireMock.get(USER_SERVICE_NICKNAME_URL)
                .inScenario(scenario)
                .whenScenarioStateIs(STARTED)
                .willReturn(WireMock.aResponse()
                        .withFixedDelay(100))
                .willSetStateTo(secondCall));

        WireMock.stubFor(WireMock.get(USER_SERVICE_NICKNAME_URL)
                .inScenario(scenario)
                .whenScenarioStateIs(secondCall)
                .withHeader("X-Internal-Token", WireMock.equalTo(INTERNAL_TOKEN))
                .willReturn(WireMock.okJson("""
                        {
                          "data": {
                            "id": "%s",
                            "nickname": "tester"
                          },
                          "message": "ok"
                        }
                        """.formatted(targetUserId))));

        JsonNode generated = objectMapper.readTree(mockMvc.perform(get(USER_GENERATED_BY_NICKNAME_URL)
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());

        assertThat(generated.get("data")).hasSize(1);
        assertUserImage(generated.get("data").get(0), generatedImage, "http://cdn.local:9000/images/generated.jpg", 0, false);

        WireMock.verify(2, getRequestedFor(urlEqualTo(USER_SERVICE_NICKNAME_URL)));
    }

    @Test
    void when_getUserSpecificEndpointByNickname_whenUserServiceReturnsNotFound_then_ReturnNotFound() throws Exception {
        String auth = "Bearer " + bearerToken(UUID.randomUUID(), Role.USER);

        WireMock.stubFor(WireMock.get(USER_SERVICE_NICKNAME_URL)
                .withHeader("X-Internal-Token", WireMock.equalTo(INTERNAL_TOKEN))
                .willReturn(WireMock.notFound()));

        String response = mockMvc.perform(get(USER_UPLOADED_BY_NICKNAME_URL)
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);

        assertThat(error.get("status").asInt()).isEqualTo(404);
        assertThat(error.get("message").asText()).isNotBlank();
    }

    @Test
    void when_searchByTagsWithUserToken_then_ReturnOnlyImagesMatchingAllNormalizedTags() throws Exception {
        UUID requesterId = UUID.randomUUID();
        Image match = saveImage(UUID.randomUUID(), ImageSource.UPLOAD, "http://localhost:9000/images/match.jpg", "match", "cat", "art");
        saveImage(UUID.randomUUID(), ImageSource.UPLOAD, "http://localhost:9000/images/partial.jpg", "partial", "cat");

        mockMvc.perform(put("/v1/content/images/" + match.getId() + "/like")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(requesterId, Role.USER)))
                .andExpect(status().isOk());

        String response = mockMvc.perform(get("/v1/content/search")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(requesterId, Role.USER))
                        .param("tags", " CAT ", "art"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertThat(json.get("data")).hasSize(1);
        assertSearchImage(json.get("data").get(0), match, "http://cdn.local:9000/images/match.jpg", 1, true);
    }

    @Test
    void when_searchWithoutTagsWithUserToken_then_ReturnEmptyList() throws Exception {
        String response = mockMvc.perform(get("/v1/content/search")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(UUID.randomUUID(), Role.USER)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertThat(json.get("data")).hasSize(0);
    }

    @Test
    void when_searchWithoutToken_then_ReturnUnauthorized() throws Exception {
        String response = mockMvc.perform(get("/v1/content/search")
                        .param("tags", "cat"))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);

        assertThat(error.get("status").asInt()).isEqualTo(401);
        assertThat(error.get("message").asText()).isEqualTo("Unauthorized");
        assertThat(error.get("path").asText()).isEqualTo("/v1/content/search");
    }

    private byte[] pngBytes() {
        return new byte[]{
                (byte) 0x89,
                0x50,
                0x4E,
                0x47,
                0x0D,
                0x0A,
                0x1A,
                0x0A
        };
    }

    private void assertUserImage(JsonNode data, Image image, String url, long likesCount, boolean liked) {
        assertThat(data.get("id").asText()).isEqualTo(image.getId().toString());
        assertThat(data.get("url").asText()).isEqualTo(url);
        assertThat(data.get("description").asText()).isEqualTo(image.getDescription());
        assertThat(data.has("createTime")).isTrue();
        assertThat(data.get("likesCount").asLong()).isEqualTo(likesCount);
        assertThat(data.get("liked").asBoolean()).isEqualTo(liked);
    }

    private void assertUserImageInList(JsonNode images, Image image, String url, long likesCount, boolean liked) {
        JsonNode found = null;

        for (JsonNode current : images) {
            if (current.get("id").asText().equals(image.getId().toString())) {
                found = current;
                break;
            }
        }

        assertThat(found).isNotNull();
        assertUserImage(found, image, url, likesCount, liked);
    }

    private void assertSearchImage(JsonNode data, Image image, String url, long likesCount, boolean liked) {
        assertThat(data.get("id").asText()).isEqualTo(image.getId().toString());
        assertThat(data.get("url").asText()).isEqualTo(url);
        assertThat(data.get("userId").asText()).isEqualTo(image.getUserId().toString());
        assertThat(data.get("description").asText()).isEqualTo(image.getDescription());
        assertThat(data.has("createTime")).isTrue();
        assertThat(data.get("likesCount").asLong()).isEqualTo(likesCount);
        assertThat(data.get("liked").asBoolean()).isEqualTo(liked);
    }
}
