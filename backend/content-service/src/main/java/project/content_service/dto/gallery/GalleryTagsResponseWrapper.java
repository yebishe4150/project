package project.content_service.dto.gallery;

import lombok.experimental.SuperBuilder;
import project.content_service.dto.BaseResponse;

import java.util.List;

@SuperBuilder
public class GalleryTagsResponseWrapper extends BaseResponse<List<GalleryTagResponse>> {
}
