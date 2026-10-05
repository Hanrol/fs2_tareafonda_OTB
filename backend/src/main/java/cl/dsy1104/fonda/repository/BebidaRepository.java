package cl.dsy1104.fonda.repository;

import cl.dsy1104.fonda.model.Bebida;
import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BebidaRepository extends JpaRepository<Bebida, Long> {

    List<Bebida> findByNombreContainingIgnoreCase(String nombre);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Bebida b WHERE b.id = :id")
    Optional<Bebida> findByIdForUpdate(@Param("id") Long id);
}
