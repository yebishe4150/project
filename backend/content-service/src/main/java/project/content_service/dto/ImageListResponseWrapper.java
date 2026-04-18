package project.content_service.dto;

import lombok.experimental.SuperBuilder;
import project.content_service.dto.image.ImageResponse;

import java.util.List;

@SuperBuilder
public class ImageListResponseWrapper extends BaseResponse<List<ImageResponse>> {
}
