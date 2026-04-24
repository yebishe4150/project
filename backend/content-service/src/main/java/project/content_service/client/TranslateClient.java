package project.content_service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class TranslateClient {

    private final WebClient webClient = WebClient.create();

    public String translateRuToEn(String text) {

        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("api.mymemory.translated.net")
                        .path("/get")
                        .queryParam("q", text)
                        .queryParam("langpair", "ru|en")
                        .build()
                )
                .retrieve()
                .bodyToMono(Map.class)
                .map(res -> {
                    Map responseData = (Map) res.get("responseData");
                    return responseData != null
                            ? responseData.get("translatedText").toString()
                            : null;
                })
                .onErrorResume(e -> {
                    log.warn("Translate-сервис недоступен, используется исходный текст: {}", e.getMessage());
                    return Mono.just(text);
                })
                .block();
    }
}
