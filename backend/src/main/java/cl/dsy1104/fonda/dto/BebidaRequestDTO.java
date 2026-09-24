package cl.dsy1104.fonda.dto;

import cl.dsy1104.fonda.model.TipoBebida;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class BebidaRequestDTO {

    @NotBlank(message = "no puede estar vacio")
    private String nombre;

    @NotNull(message = "es obligatorio")
    private TipoBebida tipo;

    @Min(value = 100, message = "debe estar entre 100 y 3000")
    @Max(value = 3000, message = "debe estar entre 100 y 3000")
    private int volumenML;

    @Min(value = 0, message = "debe ser mayor o igual a cero")
    private int stock;

    @Min(value = 0, message = "no puede ser negativo")
    private Double gradosAlcohol;

    private Boolean certificada;

    @Min(value = 0, message = "no puede ser negativo")
    private Integer azucarPorLitro;

    private boolean ventaRestringida;

    public BebidaRequestDTO() {
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public TipoBebida getTipo() {
        return tipo;
    }

    public void setTipo(TipoBebida tipo) {
        this.tipo = tipo;
    }

    public int getVolumenML() {
        return volumenML;
    }

    public void setVolumenML(int volumenML) {
        this.volumenML = volumenML;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public Double getGradosAlcohol() {
        return gradosAlcohol;
    }

    public void setGradosAlcohol(Double gradosAlcohol) {
        this.gradosAlcohol = gradosAlcohol;
    }

    public Boolean getCertificada() {
        return certificada;
    }

    public void setCertificada(Boolean certificada) {
        this.certificada = certificada;
    }

    public Integer getAzucarPorLitro() {
        return azucarPorLitro;
    }

    public void setAzucarPorLitro(Integer azucarPorLitro) {
        this.azucarPorLitro = azucarPorLitro;
    }

    public boolean isVentaRestringida() {
        return ventaRestringida;
    }

    public void setVentaRestringida(boolean ventaRestringida) {
        this.ventaRestringida = ventaRestringida;
    }
}