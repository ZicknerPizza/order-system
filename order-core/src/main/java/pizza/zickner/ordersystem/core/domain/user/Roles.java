package pizza.zickner.ordersystem.core.domain.user;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * @author Valentin Zickner
 */
public class Roles {

    public static final String ROLE_ORDER_ADMIN = "ROLE_ORDER_ADMIN";
    public static final GrantedAuthority AUTHORITY_ORDER_ADMIN = new SimpleGrantedAuthority(ROLE_ORDER_ADMIN);
}
