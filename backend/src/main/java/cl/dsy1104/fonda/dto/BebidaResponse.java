package cl.dsy1104.fonda.dto;

import cl.dsy1104.fonda.model.TipoBebida;
import lombok.Data;

@Data
public class BebidaResponse {

    private Long id;
    private String nombre;
    private TipoBebida tipo;
    private int volumenML;
    private int stock;
    private Double gradosAlcohol;
    private Boolean certificada;
    private Integer azucarPorLitro;
    private boolean ventaRestringida;
    private Integer precio;
}
