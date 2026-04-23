package com.clinica.dental.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI dentalClinicOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Dental Clinic API")
                        .description("API para gestión de pacientes, odontólogos, citas, pagos y recordatorios.")
                        .version("v1")
                        .contact(new Contact().name("Dental Clinic Team")));
    }
}
