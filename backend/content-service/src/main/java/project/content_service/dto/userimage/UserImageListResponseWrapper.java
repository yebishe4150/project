package project.content_service.dto.userimage;

import lombok.experimental.SuperBuilder;
import project.content_service.dto.BaseResponse;

import java.util.List;

@SuperBuilder
public class UserImageListResponseWrapper extends BaseResponse<List<UserImageResponse>> {
}
