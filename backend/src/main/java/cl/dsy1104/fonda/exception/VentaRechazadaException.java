package cl.dsy1104.fonda.exception;

public class VentaRechazadaException extends RuntimeException {

    private final String motivo;

    public VentaRechazadaException(String motivo, String mensaje) {
        super(mensaje);
        this.motivo = motivo;
    }

    public String getMotivo() {
        return motivo;
    }
}