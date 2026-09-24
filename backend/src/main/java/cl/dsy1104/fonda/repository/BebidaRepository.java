package cl.dsy1104.fonda.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import cl.dsy1104.fonda.model.Bebida;

public interface BebidaRepository extends JpaRepository<Bebida, Long> {

    List<Bebida> findByNombreContainingIgnoreCase(String nombre);
}