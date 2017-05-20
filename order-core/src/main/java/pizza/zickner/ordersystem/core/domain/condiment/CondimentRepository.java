package pizza.zickner.ordersystem.core.domain.condiment;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * @author Valentin Zickner
 */
@Repository
public interface CondimentRepository extends CrudRepository<Condiment, CondimentId> {

    List<Condiment> findAllByOrderByCategorySorting();

}
