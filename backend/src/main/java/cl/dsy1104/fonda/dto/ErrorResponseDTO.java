package cl.dsy1104.fonda.dto;

import java.util.Map;

public class ErrorResponseDTO {

    private String error;
    private String mensaje;
    private Map<String, String> campos;

    public ErrorResponseDTO() {
    }

    public ErrorResponseDTO(String error, String mensaje) {
        this.error = error;
        this.mensaje = mensaje;
    }

    public ErrorResponseDTO(String error, Map<String, String> campos) {
        this.error = error;
        this.campos = campos;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public Map<String, String> getCampos() {
        return campos;
    }

    public void setCampos(Map<String, String> campos) {
        this.campos = campos;
    }
}