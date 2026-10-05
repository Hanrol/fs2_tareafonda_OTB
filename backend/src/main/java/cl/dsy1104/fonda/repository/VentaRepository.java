package cl.dsy1104.fonda.repository;

import cl.dsy1104.fonda.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface VentaRepository extends JpaRepository<Venta, Long> {

    @Query("SELECT v FROM Venta v JOIN FETCH v.bebida ORDER BY v.fecha DESC")
    List<Venta> findAllByOrderByFechaDesc();

    void deleteByBebidaId(Long id);
}
