package project.content_service.dto.landingimage;

import lombok.experimental.SuperBuilder;
import project.content_service.dto.BaseResponse;

import java.util.List;

@SuperBuilder
public class LandingFeedResponseWrapper extends BaseResponse<List<LandingImageResponse>> {
}