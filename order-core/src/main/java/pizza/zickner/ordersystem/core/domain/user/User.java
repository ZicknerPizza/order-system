package pizza.zickner.ordersystem.core.domain.user;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import javax.persistence.AttributeOverride;
import javax.persistence.Column;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import java.util.Collection;
import java.util.Collections;

/**
 * @author Valentin Zickner
 */
@Entity(name = "SystemUser")
public class User implements UserDetails {

    @EmbeddedId
    @AttributeOverride(name = "value", column = @Column(name = "id"))
    private UserId id;

    @Column(name = "name")
    private String username;

    @Column(name = "password")
    private String password;

    public User() {
    }

    public User(UserId id, String username, String password) {
        this.id = id;
        this.username = username;
        this.password = password;
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singleton(Roles.AUTHORITY_ORDER_ADMIN);
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
