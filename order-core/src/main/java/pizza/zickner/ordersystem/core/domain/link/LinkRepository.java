package pizza.zickner.ordersystem.core.domain.link;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author Valentin Zickner
 */
@Repository
@Transactional(propagation = Propagation.MANDATORY)
public interface LinkRepository extends JpaRepository<Link, LinkId> {
    Link findOneByIdentifier(String identifier);
}
