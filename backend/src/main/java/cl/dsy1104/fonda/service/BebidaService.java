package cl.dsy1104.fonda.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import cl.dsy1104.fonda.dto.BebidaRequest;
import cl.dsy1104.fonda.dto.BebidaResponse;
import cl.dsy1104.fonda.exception.RecursoNoEncontradoException;
import cl.dsy1104.fonda.exception.ValidacionException;
import cl.dsy1104.fonda.model.Bebida;
import cl.dsy1104.fonda.model.TipoBebida;
import cl.dsy1104.fonda.repository.BebidaRepository;
import cl.dsy1104.fonda.repository.VentaRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BebidaService {

    private static final int PRECIO_BASE_ALCOHOLICA = 3500;
    private static final int PRECIO_BASE_SIN_ALCOHOL = 2000;

    private final BebidaRepository bebidaRepository;
    private final VentaRepository ventaRepository;

    @Transactional(readOnly = true)
    public List<BebidaResponse> listar(String nombre) {
        List<Bebida> bebidas;
        if (nombre == null || nombre.isBlank()) {
            bebidas = bebidaRepository.findAll();
        } else {
            bebidas = bebidaRepository.findByNombreContainingIgnoreCase(nombre);
        }
        return bebidas.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public BebidaResponse obtener(Long id) {
        return toResponse(buscarOFallar(id));
    }

    @Transactional
    public BebidaResponse crear(BebidaRequest dto) {
        validarPorTipo(dto);
        Bebida bebida = new Bebida();
        aplicarCambios(bebida, dto);
        return toResponse(bebidaRepository.save(bebida));
    }

    @Transactional
    public BebidaResponse actualizar(Long id, BebidaRequest dto) {
        Bebida bebida = buscarOFallar(id);
        validarPorTipo(dto);
        aplicarCambios(bebida, dto);
        return toResponse(bebidaRepository.save(bebida));
    }

    @Transactional
    public void eliminar(Long id) {
        Bebida bebida = buscarOFallar(id);
        ventaRepository.deleteByBebidaId(id);
        bebidaRepository.delete(bebida);
    }

    @Transactional
    public BebidaResponse marcarRestringida(Long id) {
        Bebida bebida = buscarOFallar(id);
        bebida.setVentaRestringida(true);
        return toResponse(bebidaRepository.save(bebida));
    }

    @Transactional(readOnly = true)
    public Bebida buscarOFallar(Long id) {
        return bebidaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Bebida " + id + " no encontrada"));
    }

    @Transactional
    public Bebida buscarParaVentaOFallar(Long id) {
        return bebidaRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Bebida " + id + " no encontrada"));
    }

    public Integer calcularPrecio(Bebida bebida) {
        if (bebida.getTipo() == TipoBebida.ALCOHOLICA) {
            int precio = PRECIO_BASE_ALCOHOLICA;
            if (bebida.getCertificada() == null || !bebida.getCertificada()) {
                precio = (int) Math.round(precio * 1.20);
            }
            return precio;
        }
        int precio = PRECIO_BASE_SIN_ALCOHOL;
        if (bebida.getAzucarPorLitro() != null && bebida.getAzucarPorLitro() > 80) {
            precio = (int) Math.round(precio * 1.10);
        }
        return precio;
    }


    private void validarPorTipo(BebidaRequest dto) {
        Map<String, String> campos = new HashMap<>();

        if (dto.getTipo() == TipoBebida.ALCOHOLICA) {
            if (dto.getGradosAlcohol() == null
                    || dto.getGradosAlcohol() < 0.5
                    || dto.getGradosAlcohol() > 45) {
                campos.put("gradosAlcohol",
                        "obligatorio y debe estar entre 0.5 y 45 para bebidas alcoholicas");
            }
            if (dto.getAzucarPorLitro() != null) {
                campos.put("azucarPorLitro", "debe ser nulo para bebidas alcoholicas");
            }
        } else if (dto.getTipo() == TipoBebida.SIN_ALCOHOL) {
            if (dto.getAzucarPorLitro() == null || dto.getAzucarPorLitro() < 0) {
                campos.put("azucarPorLitro",
                        "obligatorio y mayor o igual a cero para bebidas sin alcohol");
            }
            if (dto.getGradosAlcohol() != null) {
                campos.put("gradosAlcohol", "debe ser nulo para bebidas sin alcohol");
            }
        }

        if (!campos.isEmpty()) {
            throw new ValidacionException(campos);
        }
    }

    private void aplicarCambios(Bebida bebida, BebidaRequest dto) {
        bebida.setNombre(dto.getNombre());
        bebida.setTipo(dto.getTipo());
        bebida.setVolumenML(dto.getVolumenML());
        bebida.setStock(dto.getStock());
        bebida.setGradosAlcohol(dto.getGradosAlcohol());
        bebida.setCertificada(dto.getCertificada());
        bebida.setAzucarPorLitro(dto.getAzucarPorLitro());
        bebida.setVentaRestringida(Boolean.TRUE.equals(dto.getVentaRestringida()));
    }

    private BebidaResponse toResponse(Bebida bebida) {
        BebidaResponse dto = new BebidaResponse();
        dto.setId(bebida.getId());
        dto.setNombre(bebida.getNombre());
        dto.setTipo(bebida.getTipo());
        dto.setVolumenML(bebida.getVolumenML());
        dto.setStock(bebida.getStock());
        dto.setGradosAlcohol(bebida.getGradosAlcohol());
        dto.setCertificada(bebida.getCertificada());
        dto.setAzucarPorLitro(bebida.getAzucarPorLitro());
        dto.setVentaRestringida(bebida.isVentaRestringida());
        dto.setPrecio(calcularPrecio(bebida));
        return dto;
    }
}
