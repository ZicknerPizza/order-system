import {Component, Inject, Input, OnChanges, SimpleChanges} from "@angular/core";
import {Observable} from "rxjs";
import {Order, OrderRestService, Status} from "../../_internal/api/OrderRestService";
import {PizzaService} from "./PizzaService";
import {CondimentId} from "../../_internal/api/CondimentRestService";
import {PartyId} from "../../_internal/api/PartyRestService";

@Component({
    selector: 'pizzaDetail',
    template: require('./PizzaDetail.html'),
    providers: []
})
export class PizzaDetailComponent implements OnChanges {

    private timeStove: Observable<number>;

    @Input()
    private alwaysOpen: boolean = false;

    @Input()
    private pizza: Pizza;

    @Input()
    public partyId: PartyId;

    private bothOrderCondiments: Array<CondimentId>;

    private showContent: boolean;

    private Status = Status;

    constructor(@Inject(OrderRestService) private orderService: OrderRestService,
                @Inject(PizzaService) private pizzaService: PizzaService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.initBothOrderCondiments();
        this.initTimeStove();
    }

    private initBothOrderCondiments() {
        let bothOrderCondiments = [];
        for (let condiment of this.pizza.order1.condiments) {
            if (PizzaDetailComponent.includes(this.pizza.order2.condiments, condiment)) {
                bothOrderCondiments.push(condiment);
            }
        }
        this.bothOrderCondiments = bothOrderCondiments;
    }

    private initTimeStove() {
        if (this.pizza.status == Status.BAKING) {
            this.timeStove = Observable.interval(1000).startWith(0)
                .map((time: number) => new Date().getTime() - this.pizza.order1.timeStove.getTime());
        } else {
            this.timeStove = Observable.empty();
        }
    }

    public moveToQueue() {
        this.orderService.changeStatus(this.partyId, [this.pizza.order1.orderId, this.pizza.order2.orderId], Status.WAITING)
            .subscribe(() => {
                this.pizzaService.refreshPizzaList();
            });
    }

    public contentIsVisible(): boolean {
        return this.alwaysOpen || this.showContent;
    }

    isOnBothOrders = (condimentId: CondimentId): boolean => {
        return PizzaDetailComponent.includes(this.bothOrderCondiments, condimentId);
    };

    private static includes(condiments: Array<CondimentId>, search: CondimentId) {
        for (let condiment of condiments) {
            if (condiment.value === search.value) {
                return true;
            }
        }
        return false;
    }

}

export class Pizza {
    private _order1: Order;
    private _order2: Order;

    constructor(order1: Order, order2?: Order) {
        this._order1 = order1;
        this._order2 = order2;
    }

    set order2(order2: Order) {
        this._order2 = order2;
    }

    get pizzaId() {
        return this._order1.pizzaId;
    }


    get status() {
        return this._order1.status;
    }

    get order1() {
        return this._order1;
    }

    get order2() {
        return this._order2;
    }
}