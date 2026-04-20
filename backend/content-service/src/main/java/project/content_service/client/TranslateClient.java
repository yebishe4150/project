package project.content_service.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

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
                .doOnNext(r -> System.out.println("TRANSLATED: " + r))
                .onErrorResume(e -> {
                    System.out.println("Translate failed: " + e.getMessage());
                    return Mono.just(text);
                })
                .block();
    }

}