package project.content_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.content_service.client.TranslateClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromptService {

    private final TranslateClient translateClient;

    public String preparePrompt(String prompt) {

        String result = prompt;

        if (isRussian(prompt)) {
            try {
                String translated = translateClient.translateRuToEn(prompt);

                if (translated != null && !translated.isBlank()) {
                    result = translated;
                    log.info("Промпт переведён на английский");
                } else {
                    log.warn("Перевод вернул пустой результат, используется исходный промпт");
                }

            } catch (Exception e) {
                log.warn("Не удалось перевести промпт, используется исходный текст: {}", e.getMessage());
            }
        }

        return enrich(result);
    }

    private boolean isRussian(String text) {
        return text.matches(".*[а-яА-Я].*");
    }

    private String enrich(String prompt) {
        return prompt + ", high quality, detailed, 4k, cinematic lighting";
    }
}
