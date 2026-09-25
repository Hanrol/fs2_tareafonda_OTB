package cl.dsy1104.fonda.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import cl.dsy1104.fonda.dto.VentaRequestDTO;
import cl.dsy1104.fonda.dto.VentaResponseDTO;
import cl.dsy1104.fonda.exception.VentaRechazadaException;
import cl.dsy1104.fonda.model.Bebida;
import cl.dsy1104.fonda.model.EstadoVenta;
import cl.dsy1104.fonda.model.TipoBebida;
import cl.dsy1104.fonda.model.Venta;
import cl.dsy1104.fonda.repository.VentaRepository;

@Service
public class VentaService {

    private static final String MOTIVO_VENTA_RESTRINGIDA = "VENTA_RESTRINGIDA";
    private static final String MOTIVO_LIMITE_EXCEDIDO = "LIMITE_EXCEDIDO";
    private static final String MOTIVO_STOCK_INSUFICIENTE = "STOCK_INSUFICIENTE";

    private final VentaRepository ventaRepository;
    private final BebidaService bebidaService;
    private final int limiteUnidadesPorCliente;

    public VentaService(VentaRepository ventaRepository,
                        BebidaService bebidaService,
                        @Value("${fonda.limite-unidades-por-cliente}") int limiteUnidadesPorCliente) {
        this.ventaRepository = ventaRepository;
        this.bebidaService = bebidaService;
        this.limiteUnidadesPorCliente = limiteUnidadesPorCliente;
    }

    @Transactional
    public VentaResponseDTO registrar(VentaRequestDTO dto) {
        Bebida bebida = bebidaService.buscarOFallar(dto.getBebidaId());
        int unidades = dto.getUnidades();

        if (bebida.isVentaRestringida()) {
            return rechazar(bebida, unidades, MOTIVO_VENTA_RESTRINGIDA,
                    "La bebida tiene la venta restringida.");
        }

        if (bebida.getTipo() == TipoBebida.ALCOHOLICA
                && unidades > limiteUnidadesPorCliente) {
            return rechazar(bebida, unidades, MOTIVO_LIMITE_EXCEDIDO,
                    unidades + " unidades superan el limite de "
                            + limiteUnidadesPorCliente + " por cliente.");
        }

        if (bebida.getStock() < unidades) {
            return rechazar(bebida, unidades, MOTIVO_STOCK_INSUFICIENTE,
                    "Stock insuficiente: disponible " + bebida.getStock()
                            + ", solicitado " + unidades + ".");
        }

        return autorizar(bebida, unidades);
    }

    @Transactional(readOnly = true)
    public List<VentaResponseDTO> historial() {
        return ventaRepository.findAll().stream().map(this::aResponseDTO).toList();
    }

    private VentaResponseDTO autorizar(Bebida bebida, int unidades) {
        int precioUnitario = bebidaService.calcularPrecio(bebida);
        int total = precioUnitario * unidades;

        bebida.setStock(bebida.getStock() - unidades);

        Venta venta = new Venta();
        venta.setBebida(bebida);
        venta.setUnidades(unidades);
        venta.setTotal(total);
        venta.setEstado(EstadoVenta.AUTORIZADA);
        venta.setMotivo(null);
        venta.setFecha(LocalDateTime.now());

        Venta guardada = ventaRepository.save(venta);
        return aResponseDTO(guardada);
    }

    private VentaResponseDTO rechazar(Bebida bebida, int unidades,
                                      String motivo, String mensaje) {
        Venta venta = new Venta();
        venta.setBebida(bebida);
        venta.setUnidades(unidades);
        venta.setTotal(0);
        venta.setEstado(EstadoVenta.RECHAZADA);
        venta.setMotivo(mensaje);
        venta.setFecha(LocalDateTime.now());

        Venta guardada = ventaRepository.save(venta);

        throw new VentaRechazadaException(motivo, mensaje);
    }

    private VentaResponseDTO aResponseDTO(Venta venta) {
        VentaResponseDTO dto = new VentaResponseDTO();
        dto.setId(venta.getId());
        dto.setBebidaId(venta.getBebida().getId());
        dto.setNombre(venta.getBebida().getNombre());
        dto.setUnidades(venta.getUnidades());
        dto.setTotal(venta.getTotal());
        dto.setEstado(venta.getEstado());
        dto.setMotivo(venta.getMotivo());
        dto.setFecha(venta.getFecha());
        return dto;
    }
}