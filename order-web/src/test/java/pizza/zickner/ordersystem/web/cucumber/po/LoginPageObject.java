package pizza.zickner.ordersystem.web.cucumber.po;

import cucumber.api.java.en.Given;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import pizza.zickner.ordersystem.core.domain.user.User;
import pizza.zickner.ordersystem.core.domain.user.UserId;
import pizza.zickner.ordersystem.web.cucumber.AbstractCucumberMockMvcTest;

import java.util.Objects;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

public class LoginPageObject extends AbstractCucumberMockMvcTest {

    @Autowired
    private State state;

    @Given("^the \"([^\"]*)\" user is authenticated$")
    public void theUserIsAuthenticated(String username) throws Throwable {
        if (Objects.equals(username, "admin")) {
            this.state.user = user(
                    new User(new UserId(1), username, "")
            );
        }
    }

    @Component
    public static class State  {
        private RequestPostProcessor user = anonymous();

        public RequestPostProcessor getUser() {
            return user;
        }
    }
}
