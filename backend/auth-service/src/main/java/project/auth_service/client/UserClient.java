package project.auth_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import project.auth_service.dto.BaseResponse;
import project.auth_service.dto.client.CreateUserRequest;
import project.auth_service.dto.client.UserResponse;

@FeignClient(
        name = "user-service",
        url = "${services.user.url}/v1"
)
public interface UserClient {

    @PostMapping("/users")
    BaseResponse<UserResponse> createUser(@RequestBody CreateUserRequest request);
}
