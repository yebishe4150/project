package project.content_service.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class UrlRewriter {

    @Value("${s3.endpoint:http://localhost:9000}")
    private String internalEndpoint;

    @Value("${s3.external-endpoint:http://192.168.0.157:9000}")
    private String externalEndpoint;

    public String rewriteForExternalAccess(String url) {
        if (url == null) {
            return null;
        }
        return url.replace(internalEndpoint, externalEndpoint);
    }
}