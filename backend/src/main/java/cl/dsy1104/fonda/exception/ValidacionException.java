package cl.dsy1104.fonda.exception;

import java.util.Map;

public class ValidacionException extends RuntimeException {

    private final Map<String, String> campos;

    public ValidacionException(Map<String, String> campos) {
        super("Validacion de datos");
        this.campos = campos;
    }

    public Map<String, String> getCampos() {
        return campos;
    }
}
