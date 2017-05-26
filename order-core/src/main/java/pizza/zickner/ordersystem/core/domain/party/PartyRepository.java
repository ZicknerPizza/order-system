package pizza.zickner.ordersystem.core.domain.party;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Stream;

/**
 * @author Valentin Zickner
 */
@Transactional(propagation = Propagation.MANDATORY)
public interface PartyRepository extends CrudRepository<Party, PartyId> {

    @Query("SELECT p FROM Party p")
    Stream<Party> streamAll();

    List<Party> findAllByOrderByAktivDesc(); // TODO: Rename field aktiv
}
