package project.content_service.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.TimeoutException;

@Component
@RequiredArgsConstructor
public class PollinationsImageClient {

    private final WebClient webClient = WebClient.create();

    public byte[] generateImage(String prompt) {

        String url = "https://image.pollinations.ai/prompt/" +
                URLEncoder.encode(prompt, StandardCharsets.UTF_8);

        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(byte[].class)
                .retryWhen(
                        Retry.fixedDelay(2, Duration.ofMillis(500))
                                .filter(this::isRetryable)
                )
                .timeout(Duration.ofSeconds(10))

                .block();
    }

    private boolean isRetryable(Throwable e) {
        return e instanceof WebClientRequestException
                || e instanceof TimeoutException
                || (e instanceof WebClientResponseException ex
                && ex.getStatusCode().is5xxServerError());
    }
}