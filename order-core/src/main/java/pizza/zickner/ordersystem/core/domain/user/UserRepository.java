package pizza.zickner.ordersystem.core.domain.user;

import org.springframework.data.repository.CrudRepository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author Valentin Zickner
 */
@Transactional(propagation = Propagation.MANDATORY)
public interface UserRepository extends CrudRepository<User, UserId> {

    User findByUsername(String username);
}
