package pizza.zickner.ordersystem.web.controller;

import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pizza.zickner.ordersystem.core.domain.user.Roles;

/**
 * @author Valentin Zickner
 */
@RestController
@RequestMapping("/api/current-user")
public class CurrentUserController {

    @GetMapping
    @Secured(Roles.ROLE_ORDER_ADMIN)
    public void getCurrentUser() {
    }
}
