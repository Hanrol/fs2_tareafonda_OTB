package cl.dsy1104.fonda.repository;

import cl.dsy1104.fonda.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VentaRepository extends JpaRepository<Venta, Long> {

    List<Venta> findAllByOrderByFechaDesc();

    void deleteByBebidaId(Long id);
}
