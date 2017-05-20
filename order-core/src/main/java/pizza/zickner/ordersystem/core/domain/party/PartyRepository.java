package pizza.zickner.ordersystem.core.domain.party;

import org.springframework.data.repository.CrudRepository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * @author Valentin Zickner
 */
@Transactional(propagation = Propagation.MANDATORY)
public interface PartyRepository extends CrudRepository<Party, PartyId> {

    List<Party> findAllByOrderByAktivDesc(); // TODO: Rename field aktiv
}
