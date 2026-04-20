package project.content_service.dto.imagegenerator;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateImageRequest {

    @NotBlank
    String prompt;
    String description;
    List<String> tags;
}
