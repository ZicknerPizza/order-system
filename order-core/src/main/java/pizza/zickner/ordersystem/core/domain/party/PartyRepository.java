package pizza.zickner.ordersystem.core.domain.party;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Stream;

/**
 * @author Valentin Zickner
 */
@Transactional(propagation = Propagation.MANDATORY)
public interface PartyRepository extends JpaRepository<Party, PartyId> {

    @Query("SELECT p FROM Party p")
    Stream<Party> streamAll();

    List<Party> findAllByOrderByAktivDesc(); // TODO: Rename field aktiv
}
