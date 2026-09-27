package cl.dsy1104.fonda.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import cl.dsy1104.fonda.dto.VentaRequest;
import cl.dsy1104.fonda.dto.VentaResponse;
import cl.dsy1104.fonda.exception.VentaRechazadaException;
import cl.dsy1104.fonda.model.Bebida;
import cl.dsy1104.fonda.model.EstadoVenta;
import cl.dsy1104.fonda.model.TipoBebida;
import cl.dsy1104.fonda.model.Venta;
import cl.dsy1104.fonda.repository.VentaRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VentaService {

    private final VentaRepository ventaRepository;
    private final BebidaService bebidaService;

    @Value("${fonda.limite-unidades-por-cliente}")
    private int limite;


    @Transactional(noRollbackFor = VentaRechazadaException.class)
    public VentaResponse registrar(VentaRequest dto) {
        Bebida bebida = bebidaService.buscarOFallar(dto.getBebidaId());
        int unidades = dto.getUnidades();


        if (bebida.isVentaRestringida()) {
            return rechazar(bebida, unidades, "VENTA_RESTRINGIDA",
                    "La bebida tiene la venta restringida.");
        }

        if (bebida.getTipo() == TipoBebida.ALCOHOLICA
                && unidades > limite) {
            return rechazar(bebida, unidades, "LIMITE_EXCEDIDO",
                    unidades + " unidades superan el limite de "
                            + limite + " por cliente.");
        }

        if (bebida.getStock() < unidades) {
            return rechazar(bebida, unidades, "STOCK_INSUFICIENTE",
                    "Stock insuficiente: disponible " + bebida.getStock()
                            + ", solicitado " + unidades + ".");
        }

        return autorizar(bebida, unidades);
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> historial() {
        return ventaRepository.findAllByOrderByFechaDesc()
                .stream().map(this::toResponse).toList();
    }

    private VentaResponse autorizar(Bebida bebida, int unidades) {
        int total = bebidaService.calcularPrecio(bebida) * unidades;

        bebida.setStock(bebida.getStock() - unidades);

        Venta venta = new Venta();
        venta.setBebida(bebida);
        venta.setUnidades(unidades);
        venta.setTotal(total);
        venta.setEstado(EstadoVenta.AUTORIZADA);
        venta.setFecha(LocalDateTime.now());

        return toResponse(ventaRepository.save(venta));
    }

    private VentaResponse rechazar(Bebida bebida, int unidades,
                                   String motivo, String mensaje) {
        Venta venta = new Venta();
        venta.setBebida(bebida);
        venta.setUnidades(unidades);
        venta.setTotal(0);
        venta.setEstado(EstadoVenta.RECHAZADA);
        venta.setMotivo(motivo);
        venta.setFecha(LocalDateTime.now());
        ventaRepository.save(venta);

        throw new VentaRechazadaException(motivo, mensaje);
    }

    private VentaResponse toResponse(Venta venta) {
        VentaResponse dto = new VentaResponse();
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
