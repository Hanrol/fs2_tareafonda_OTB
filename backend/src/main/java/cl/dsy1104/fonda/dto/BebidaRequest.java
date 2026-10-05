package cl.dsy1104.fonda.dto;

import cl.dsy1104.fonda.model.TipoBebida;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BebidaRequest {

    @NotBlank(message = "no puede estar vacio")
    @Size(max = 50, message = "no puede superar los 50 caracteres")
    private String nombre;

    @NotNull(message = "es obligatorio")
    private TipoBebida tipo;

    @NotNull(message = "es obligatorio")
    @Min(value = 100, message = "debe estar entre 100 y 3000")
    @Max(value = 3000, message = "debe estar entre 100 y 3000")
    private Integer volumenML;

    @NotNull(message = "es obligatorio")
    @PositiveOrZero(message = "debe ser mayor o igual a cero")
    private Integer stock;

    private Double gradosAlcohol;

    private Boolean certificada;

    private Integer azucarPorLitro;

    private Boolean ventaRestringida;
}
