package cl.dsy1104.fonda.repository;

import cl.dsy1104.fonda.model.Bebida;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BebidaRepository extends JpaRepository<Bebida, Long> {

    List<Bebida> findByNombreContainingIgnoreCase(String nombre);
}
