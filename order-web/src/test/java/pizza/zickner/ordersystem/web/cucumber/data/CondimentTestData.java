package pizza.zickner.ordersystem.web.cucumber.data;

import cucumber.api.java.en.Given;
import org.springframework.beans.factory.annotation.Autowired;
import pizza.zickner.ordersystem.core.domain.condiment.*;
import pizza.zickner.ordersystem.web.cucumber.AbstractCucumberMockMvcTest;

import java.util.Arrays;
import java.util.List;

public class CondimentTestData extends AbstractCucumberMockMvcTest {

    @Autowired
    private CondimentCategoryRepository condimentCategoryRepository;

    @Autowired
    private CondimentRepository condimentRepository;

    private static final CondimentCategory SAUCE = new CondimentCategory(new CondimentCategoryId(39), "Sauce", 0);
    private static final CondimentCategory CHEESE = new CondimentCategory(new CondimentCategoryId(1), "Cheese", 1);
    private static final CondimentCategory SAUSAGES = new CondimentCategory(new CondimentCategoryId(2), "Sausages", 7);
    private static final CondimentCategory VEGETABLES = new CondimentCategory(new CondimentCategoryId(35), "Vegetables", 2);
    private static final CondimentCategory OTHERS = new CondimentCategory(new CondimentCategoryId(3), "Others", 3);
    private static final CondimentCategory SPICES = new CondimentCategory(new CondimentCategoryId(31), "Spices", 6);

    public static final Condiment GAUDA = new Condiment(new CondimentId(6), "Gouda", 3, "g", CHEESE);
    public static final Condiment PEPPERONI = new Condiment(new CondimentId(7), "Pepperoni", 1, "g", SAUSAGES);
    public static final Condiment HAM = new Condiment(new CondimentId(8), "Ham", 1, "g", SAUSAGES);
    public static final Condiment MUSHROOMS = new Condiment(new CondimentId(12), "Mushrooms", 1, "g", OTHERS);
    public static final Condiment JALAPENO_PEPPERS = new Condiment(new CondimentId(16), "Jalapeño Peppers", 6, "g", OTHERS);
    public static final Condiment TOMATOES = new Condiment(new CondimentId(17), "Tomatoes", 6, "g", VEGETABLES);
    public static final Condiment PEPPERS = new Condiment(new CondimentId(18), "Peppers", 7, "g", VEGETABLES);
    public static final Condiment PINEAPPLE = new Condiment(new CondimentId(22), "Pineapple", 1, "g", OTHERS);
    public static final Condiment CURRY_POWDER = new Condiment(new CondimentId(32), "Curry powder", 1, "g", SPICES);
    public static final Condiment CHILI_POWDER = new Condiment(new CondimentId(33), "Chili powder", 2, "g", SPICES);
    public static final Condiment TOMATO_SAUCE = new Condiment(new CondimentId(42), "Tomato sauce", 1, "g", SAUCE);

    private static final List<CondimentCategory> ALL_CONDIMENT_CATEGORIES = Arrays.asList(
            SAUCE,
            CHEESE,
            SAUSAGES,
            VEGETABLES,
            OTHERS,
            SPICES
    );

    private static final List<Condiment> ALL_CONDIMENTS = Arrays.asList(
            GAUDA,
            PEPPERONI,
            HAM,
            MUSHROOMS,
            JALAPENO_PEPPERS,
            TOMATOES,
            PEPPERS,
            PINEAPPLE,
            CURRY_POWDER,
            CHILI_POWDER,
            TOMATO_SAUCE
    );

    public static final List<Condiment> PARTY_CONDIMENTS = Arrays.asList(
            TOMATO_SAUCE,
            GAUDA,
            PEPPERONI,
            HAM,
            JALAPENO_PEPPERS,
            PINEAPPLE,
            CHILI_POWDER,
            CURRY_POWDER
    );

    public static final List<Condiment> PIZZA_MARGARITA = Arrays.asList(TOMATO_SAUCE, GAUDA);
    public static final List<Condiment> PIZZA_DIAVOLO = Arrays.asList(TOMATO_SAUCE, GAUDA, PEPPERONI, JALAPENO_PEPPERS, CHILI_POWDER);
    public static final List<Condiment> PIZZA_HAWAII = Arrays.asList(TOMATO_SAUCE, GAUDA, HAM, PINEAPPLE, CURRY_POWDER);

    @Given("^the basic condiments exists$")
    public void theBasicCondimentsExists() {
        this.condimentCategoryRepository.saveAll(ALL_CONDIMENT_CATEGORIES);
        this.condimentRepository.saveAll(ALL_CONDIMENTS);
    }

}
