package project.common.logging.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@ConfigurationProperties(prefix = "logging.masking")
public class MaskingProperties {

    /**
     * Маска
     */
    private String mask = "***";

    /**
     * Поля для полного маскирования
     * пример: password, token
     */
    private List<String> fullMaskingJsonBodyPaths = new ArrayList<>();

    /**
     * Поля для частичного маскирования
     */
    private List<String> partialMaskingJsonBodyPaths = new ArrayList<>();

    /**
     * Заголовки для маскирования
     */
    private Set<String> maskHeaders = Set.of("Authorization");

    /**
     * Процент маскирования
     */
    private double partialMaskPercents = 0.6;

    /**
     * Минимальная длина строки
     */
    private int minLengthForPartialMasking = 3;
}