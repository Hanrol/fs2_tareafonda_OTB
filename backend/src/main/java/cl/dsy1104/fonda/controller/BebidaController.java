package cl.dsy1104.fonda.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import cl.dsy1104.fonda.dto.BebidaRequestDTO;
import cl.dsy1104.fonda.dto.BebidaResponseDTO;
import cl.dsy1104.fonda.service.BebidaService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/bebidas")
public class BebidaController {

    private final BebidaService bebidaService;

    public BebidaController(BebidaService bebidaService) {
        this.bebidaService = bebidaService;
    }

    @GetMapping
    public ResponseEntity<List<BebidaResponseDTO>> listar(
            @RequestParam(name = "nombre", required = false) String nombre) {
        return ResponseEntity.ok(bebidaService.listar(nombre));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BebidaResponseDTO> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(bebidaService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<BebidaResponseDTO> crear(@Valid @RequestBody BebidaRequestDTO dto) {
        BebidaResponseDTO creada = bebidaService.crear(dto);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(creada.getId())
                .toUri();
        return ResponseEntity.created(location).body(creada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BebidaResponseDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody BebidaRequestDTO dto) {
        return ResponseEntity.ok(bebidaService.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        bebidaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/restriccion")
    public ResponseEntity<BebidaResponseDTO> marcarRestringida(@PathVariable Long id) {
        return ResponseEntity.ok(bebidaService.marcarRestringida(id));
    }
}