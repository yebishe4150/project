package project.auth_service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import project.auth_service.repository.UserCredentialsRepository;
import project.auth_service.repository.UserSyncTaskRepository;
import project.auth_service.service.UserSyncService;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = true)
@AutoConfigureWireMock(port = 0)
@ActiveProfiles("test")
@Transactional
public abstract class AbstractTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserCredentialsRepository userCredentialsRepository;

    @Autowired
    protected UserSyncTaskRepository userSyncTaskRepository;

    @Autowired
    protected UserSyncService userSyncService;

    protected String toJson(Object obj) throws Exception {
        return objectMapper.writeValueAsString(obj);
    }

}
