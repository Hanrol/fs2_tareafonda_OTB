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

import cl.dsy1104.fonda.dto.BebidaRequest;
import cl.dsy1104.fonda.dto.BebidaResponse;
import cl.dsy1104.fonda.service.BebidaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/bebidas")
@RequiredArgsConstructor
public class BebidaController {

    private final BebidaService bebidaService;

    @GetMapping
    public ResponseEntity<List<BebidaResponse>> listar(
            @RequestParam(name = "nombre", required = false) String nombre) {
        return ResponseEntity.ok(bebidaService.listar(nombre));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BebidaResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(bebidaService.obtener(id));
    }

    @PostMapping
    public ResponseEntity<BebidaResponse> crear(@Valid @RequestBody BebidaRequest dto) {
        BebidaResponse creada = bebidaService.crear(dto);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(creada.getId())
                .toUri();
        return ResponseEntity.created(location).body(creada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BebidaResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody BebidaRequest dto) {
        return ResponseEntity.ok(bebidaService.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        bebidaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/restriccion")
    public ResponseEntity<BebidaResponse> marcarRestringida(@PathVariable Long id) {
        return ResponseEntity.ok(bebidaService.marcarRestringida(id));
    }
}
