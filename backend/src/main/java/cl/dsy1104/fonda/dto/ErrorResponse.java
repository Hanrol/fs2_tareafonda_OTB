package cl.dsy1104.fonda.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private String error;
    private String mensaje;
    private Map<String, String> campos;

    public ErrorResponse(String error, String mensaje) {
        this.error = error;
        this.mensaje = mensaje;
    }

    public ErrorResponse(String error, Map<String, String> campos) {
        this.error = error;
        this.campos = campos;
    }
}
