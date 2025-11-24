package gateway.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${gateway.base-url:http://localhost:8080}")
    private String gatewayBaseUrl;

    @Bean
    public OpenAPI customOpenAPI() {
        Server server = new Server();
        server.setUrl(gatewayBaseUrl);
        server.setDescription("Gateway Server");

        Contact contact = new Contact();
        contact.setName("Auction Platform Team");
        contact.setEmail("nhannguyentrong355@gmail.com");
        contact.setUrl("https://github.com/Nhannguyenus24/Online-Auction-Platform");

        License license = new License()
                .name("MIT License")
                .url("https://opensource.org/licenses/MIT");

        Info info = new Info()
                .title("Online Auction Platform - API Gateway")
                .version("1.0.0")
                .description("API Gateway for Online Auction Platform microservices. " +
                        "This gateway routes requests to various backend services including " +
                        "user management, auction service, bidding service, and payment service.")
                .contact(contact)
                .license(license);

        return new OpenAPI()
                .info(info)
                .servers(List.of(server));
    }
}
