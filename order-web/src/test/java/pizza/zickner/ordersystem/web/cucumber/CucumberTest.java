package pizza.zickner.ordersystem.web.cucumber;

import cucumber.api.CucumberOptions;
import org.junit.runner.RunWith;
import cucumber.api.junit.Cucumber;

@RunWith(Cucumber.class)
@CucumberOptions(features = "classpath:cucumber")
public class CucumberTest {
}
