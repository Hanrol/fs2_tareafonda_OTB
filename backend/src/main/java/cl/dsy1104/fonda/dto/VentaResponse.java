package cl.dsy1104.fonda.dto;

import java.time.LocalDateTime;

import cl.dsy1104.fonda.model.EstadoVenta;
import lombok.Data;

@Data
public class VentaResponse {

    private Long id;
    private Long bebidaId;
    private String nombre;
    private int unidades;
    private int total;
    private EstadoVenta estado;
    private String motivo;
    private LocalDateTime fecha;
}
