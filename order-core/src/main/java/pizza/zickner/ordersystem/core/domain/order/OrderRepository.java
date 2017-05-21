package pizza.zickner.ordersystem.core.domain.order;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import pizza.zickner.ordersystem.core.domain.party.PartyId;

import java.util.List;
import java.util.stream.Stream;

/**
 * @author Valentin Zickner
 */
public interface OrderRepository extends CrudRepository<Order, OrderId> {

    @Query("SELECT o FROM PizzaOrder o")
    Stream<Order> streamAll();

    @Query("SELECT o FROM PizzaOrder o WHERE o.partyId = :partyId ORDER BY o.status ASC, o.time DESC")
    List<Order> findByPartyId(@Param("partyId") PartyId partyId);

    List<Order> findByOrderIdIn(List<OrderId> orderIds);

    List<Order> findByStatus(Status status);

}
