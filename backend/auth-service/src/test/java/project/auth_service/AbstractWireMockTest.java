package project.auth_service;

import com.github.tomakehurst.wiremock.client.WireMock;
import lombok.SneakyThrows;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import project.auth_service.dto.BaseResponse;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.okJson;
import static com.github.tomakehurst.wiremock.client.WireMock.request;
import static com.github.tomakehurst.wiremock.client.WireMock.stubFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;

public abstract class AbstractWireMockTest extends AbstractTest {

    @SneakyThrows
    protected <T> void stubSuccess(String url, HttpMethod method, T data) {
        BaseResponse<T> response = BaseResponse.<T>builder()
                .data(data)
                .message("ok")
                .build();

        stubFor(request(method.name(), urlEqualTo(url))
                .willReturn(okJson(objectMapper.writeValueAsString(response))));
    }

    @SneakyThrows
    protected void stubError(String url, HttpMethod method, int status, String message) {
        BaseResponse<Void> response = BaseResponse.<Void>builder()
                .data(null)
                .message(message)
                .build();

        stubFor(request(method.name(), urlEqualTo(url))
                .willReturn(aResponse()
                        .withStatus(status)
                        .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .withBody(objectMapper.writeValueAsString(response))));
    }

    protected void stubTimeout(String url, HttpMethod method, int delayMs) {
        stubFor(request(method.name(), urlEqualTo(url))
                .willReturn(aResponse()
                        .withFixedDelay(delayMs)));
    }

    @BeforeEach
    void resetWireMock() {
        WireMock.reset();
    }
}