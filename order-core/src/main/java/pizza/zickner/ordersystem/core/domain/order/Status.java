package pizza.zickner.ordersystem.core.domain.order;

import java.util.Arrays;

/**
 * @author Valentin Zickner
 */
public enum Status {
    INACTIVE,
    WAITING,
    TOPPING,
    BAKING,
    EATING,
    DELETED;

    static {
        INACTIVE.destinationStates = new Status[]{WAITING, DELETED};
        WAITING.destinationStates = new Status[]{INACTIVE, TOPPING, DELETED};
        TOPPING.destinationStates = new Status[]{WAITING, BAKING};
        BAKING.destinationStates = new Status[]{EATING};
        EATING.destinationStates = new Status[]{};
        DELETED.destinationStates = new Status[]{};

    }

    private Status[] destinationStates;

    public boolean isAtLeast(Status status) {
        return this.ordinal() >= status.ordinal();
    }

    public boolean isValidTransaction(Status destinationStatus) {
        return Arrays.asList(this.destinationStates).contains(destinationStatus);
    }
}
