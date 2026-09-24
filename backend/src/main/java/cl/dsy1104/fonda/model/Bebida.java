package cl.dsy1104.fonda.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "bebida")
public class Bebida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoBebida tipo;

    @Column(name = "volumen_ml", nullable = false)
    private int volumenML;

    @Column(nullable = false)
    private int stock;

    @Column(name = "grados_alcohol")
    private Double gradosAlcohol;

    @Column(name = "certificada")
    private Boolean certificada;

    @Column(name = "azucar_por_litro")
    private Integer azucarPorLitro;

    @Column(name = "venta_restringida", nullable = false)
    private boolean ventaRestringida;

    public Bebida() {
    }

    public Bebida(String nombre, TipoBebida tipo, int volumenML, int stock,
                  Double gradosAlcohol, Boolean certificada,
                  Integer azucarPorLitro, boolean ventaRestringida) {
        this.nombre = nombre;
        this.tipo = tipo;
        this.volumenML = volumenML;
        this.stock = stock;
        this.gradosAlcohol = gradosAlcohol;
        this.certificada = certificada;
        this.azucarPorLitro = azucarPorLitro;
        this.ventaRestringida = ventaRestringida;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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