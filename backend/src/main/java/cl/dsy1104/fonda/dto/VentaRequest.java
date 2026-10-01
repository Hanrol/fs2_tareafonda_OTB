package cl.dsy1104.fonda.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class VentaRequest {

    @NotNull(message = "es obligatorio")
    @Positive(message = "debe ser mayor que cero")
    private Long bebidaId;

    @NotNull(message = "es obligatorio")
    @Min(value = 1, message = "debe ser al menos 1")
    private Integer unidades;
}
