package project.content_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import project.content_service.dto.BaseResponse;
import project.content_service.dto.user.UserResponse;

@FeignClient(
        name = "user-service",
        url = "${services.user.url}/v1"
)
public interface UserClient {

    @GetMapping("/users/{nickname}")
    BaseResponse<UserResponse> getUserByNickname(
            @PathVariable String nickname,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader
    );
}
