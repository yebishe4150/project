package project.content_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import project.content_service.client.TranslateClient;

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
                } else {
                    System.out.println("Translate returned null/empty, using original");
                }

            } catch (Exception e) {
                System.out.println("Translate failed, using original prompt");
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