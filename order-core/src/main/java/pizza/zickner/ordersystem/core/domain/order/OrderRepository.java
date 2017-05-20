package pizza.zickner.ordersystem.core.domain.order;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import pizza.zickner.ordersystem.core.domain.party.PartyId;

import java.util.List;
import java.util.stream.Stream;

/**
 * @author Valentin Zickner
 */
public interface OrderRepository extends CrudRepository<Order, OrderId> {

    @Query("select o from PizzaOrder o")
    Stream<Order> streamAll();

    List<Order> findByPartyIdOrderByStatusAscTimeAsc(PartyId partyId);

    List<Order> findByOrderIdIn(List<OrderId> orderIds);

    List<Order> findByStatus(Status status);

}
