package project.content_service.dto.imagesearch;

import lombok.experimental.SuperBuilder;
import project.content_service.dto.BaseResponse;

import java.util.List;

@SuperBuilder
public class SearchImageListResponseWrapper extends BaseResponse<List<SearchImageResponse>> {
}
