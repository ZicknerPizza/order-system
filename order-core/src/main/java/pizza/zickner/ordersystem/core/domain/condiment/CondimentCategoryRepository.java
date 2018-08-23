package pizza.zickner.ordersystem.core.domain.condiment;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Deprecated
@Repository
public interface CondimentCategoryRepository extends CrudRepository<CondimentCategory, CondimentCategoryId> {
}
