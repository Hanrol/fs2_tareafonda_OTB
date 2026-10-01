package cl.dsy1104.fonda.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "bebida")
@Getter
@Setter
@NoArgsConstructor
public class Bebida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", length = 50, nullable = false)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoBebida tipo;

    @Column(name = "volumen_ml", nullable = false)
    private int volumenML;

    @Column(name = "stock", nullable = false)
    private int stock;

    @Column(name = "grados_alcohol")
    private Double gradosAlcohol;

    @Column(name = "certificada")
    private Boolean certificada;

    @Column(name = "azucar_por_litro")
    private Integer azucarPorLitro;

    @Column(name = "venta_restringida", nullable = false)
    private boolean ventaRestringida;
}