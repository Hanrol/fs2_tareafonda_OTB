package cl.dsy1104.fonda.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import cl.dsy1104.fonda.dto.BebidaRequestDTO;
import cl.dsy1104.fonda.dto.BebidaResponseDTO;
import cl.dsy1104.fonda.exception.RecursoNoEncontradoException;
import cl.dsy1104.fonda.model.Bebida;
import cl.dsy1104.fonda.model.TipoBebida;
import cl.dsy1104.fonda.repository.BebidaRepository;

@Service
public class BebidaService {

    private static final int PRECIO_BASE_ALCOHOLICA = 3500;
    private static final int PRECIO_BASE_SIN_ALCOHOL = 2000;

    private final BebidaRepository bebidaRepository;

    public BebidaService(BebidaRepository bebidaRepository) {
        this.bebidaRepository = bebidaRepository;
    }

    @Transactional(readOnly = true)
    public List<BebidaResponseDTO> listar(String nombre) {
        List<Bebida> bebidas;
        if (nombre == null || nombre.isBlank()) {
            bebidas = bebidaRepository.findAll();
        } else {
            bebidas = bebidaRepository.findByNombreContainingIgnoreCase(nombre);
        }
        return bebidas.stream().map(this::aResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public BebidaResponseDTO obtenerPorId(Long id) {
        Bebida bebida = buscarOFallar(id);
        return aResponseDTO(bebida);
    }

    @Transactional
    public BebidaResponseDTO crear(BebidaRequestDTO dto) {
        validarReglasPorTipo(dto);
        Bebida bebida = new Bebida();
        aplicarCambios(bebida, dto);
        Bebida guardada = bebidaRepository.save(bebida);
        return aResponseDTO(guardada);
    }

    @Transactional
    public BebidaResponseDTO actualizar(Long id, BebidaRequestDTO dto) {
        Bebida bebida = buscarOFallar(id);
        validarReglasPorTipo(dto);
        aplicarCambios(bebida, dto);
        Bebida guardada = bebidaRepository.save(bebida);
        return aResponseDTO(guardada);
    }

    @Transactional
    public void eliminar(Long id) {
        Bebida bebida = buscarOFallar(id);
        bebidaRepository.delete(bebida);
    }

    @Transactional
    public BebidaResponseDTO marcarRestringida(Long id) {
        Bebida bebida = buscarOFallar(id);
        bebida.setVentaRestringida(true);
        Bebida guardada = bebidaRepository.save(bebida);
        return aResponseDTO(guardada);
    }

    @Transactional(readOnly = true)
    public Bebida buscarOFallar(Long id) {
        return bebidaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Bebida " + id + " no encontrada"));
    }

    public int calcularPrecio(Bebida bebida) {
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

    private void validarReglasPorTipo(BebidaRequestDTO dto) {
        if (dto.getTipo() == TipoBebida.ALCOHOLICA) {
            if (dto.getGradosAlcohol() == null
                    || dto.getGradosAlcohol() < 0.5
                    || dto.getGradosAlcohol() > 45) {
                throw new IllegalArgumentException(
                        "gradosAlcohol debe estar entre 0.5 y 45 para bebidas alcoholicas");
            }
            if (dto.getAzucarPorLitro() != null) {
                throw new IllegalArgumentException(
                        "azucarPorLitro debe ser nulo para bebidas alcoholicas");
            }
        } else if (dto.getTipo() == TipoBebida.SIN_ALCOHOL) {
            if (dto.getAzucarPorLitro() == null || dto.getAzucarPorLitro() < 0) {
                throw new IllegalArgumentException(
                        "azucarPorLitro es obligatorio y mayor o igual a cero para bebidas sin alcohol");
            }
            if (dto.getGradosAlcohol() != null) {
                throw new IllegalArgumentException(
                        "gradosAlcohol debe ser nulo para bebidas sin alcohol");
            }
        }
    }

    private void aplicarCambios(Bebida bebida, BebidaRequestDTO dto) {
        bebida.setNombre(dto.getNombre());
        bebida.setTipo(dto.getTipo());
        bebida.setVolumenML(dto.getVolumenML());
        bebida.setStock(dto.getStock());
        bebida.setGradosAlcohol(dto.getGradosAlcohol());
        bebida.setCertificada(dto.getCertificada());
        bebida.setAzucarPorLitro(dto.getAzucarPorLitro());
        bebida.setVentaRestringida(dto.isVentaRestringida());
    }

    private BebidaResponseDTO aResponseDTO(Bebida bebida) {
        BebidaResponseDTO dto = new BebidaResponseDTO();
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