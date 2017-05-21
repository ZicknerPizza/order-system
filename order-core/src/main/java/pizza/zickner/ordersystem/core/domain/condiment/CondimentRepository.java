package pizza.zickner.ordersystem.core.domain.condiment;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * @author Valentin Zickner
 */
@Repository
public interface CondimentRepository extends CrudRepository<Condiment, CondimentId> {

    @Query("SELECT c FROM Condiment c ORDER BY c.category.sorting ASC, c.sorting ASC")
    List<Condiment> findAllSorted();

}
