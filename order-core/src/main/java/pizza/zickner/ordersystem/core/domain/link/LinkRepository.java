package pizza.zickner.ordersystem.core.domain.link;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author Valentin Zickner
 */
@Repository
@Transactional(propagation = Propagation.MANDATORY)
public interface LinkRepository extends CrudRepository<Link, LinkId> {
    Link findOneByIdentifier(String identifier);
}
