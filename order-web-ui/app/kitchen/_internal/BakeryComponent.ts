import {Component, Inject, Input, OnInit} from "@angular/core";
import {PizzaService} from "./PizzaService";
import {Order, OrderRestService, Status} from "../../_internal/api/OrderRestService";
import {Observable, of, Subject} from "rxjs";
import {Pizza} from "./PizzaDetailCondiment";
import {PartyId} from "../../_internal/api/PartyRestService";
import {Condiment} from "../../_internal/api/CondimentRestService";
import {flatMap, map, withLatestFrom} from "rxjs/operators";

@Component({
    selector: "bakery",
    templateUrl: "./Bakery.html"
})
export class BakeryComponent implements OnInit {

    private enableBake: boolean;
    private kitchenPizza: any;
    private changeFontSize: number;

    private nextPizza: Subject<void>;

    @Input()
    private partyId: PartyId;

    @Input()
    private orders: Observable<Array<Order>>;

    @Input()
    private condiments: Array<Condiment>;

    private current: Pizza = null;

    constructor(@Inject(OrderRestService) private orderService: OrderRestService,
                @Inject(PizzaService) private pizzaService: PizzaService) {
        this.nextPizza = new Subject<void>();
    }

    ngOnInit(): void {
        this.enableBake = false;
        this.kitchenPizza = {};
        this.changeFontSize = 14;

        this.orders.subscribe((orders) => {
            if (orders.length >= 2 && this.enableBake && this.current == null) {
                this.nextPizza.next();
            }
        });

        this.nextPizza.asObservable()
            .pipe(
                withLatestFrom(this.orders),
                flatMap((item: [void, Array<Order>]) => {
                    let orders = item[1];
                    if (orders.length >= 2) {
                        let newOrders = orders.slice(orders.length - 2);
                        let pizza = new Pizza(newOrders[0], newOrders[1]);
                        return this.orderService.changeStatus(this.partyId, BakeryComponent.getOrderIds(pizza), Status.TOPPING)
                            .pipe(map(() => {
                                return pizza;
                            }));
                    }
                    return of(null);
                })
            )
            .subscribe((pizza: Pizza) => {
                this.current = pizza;
                this.pizzaService.refreshPizzaList();
            });
    }

    public fontSize() {
        return this.changeFontSize;
    }

    public startBake() {
        this.enableBake = true;
        this.nextPizza.next();
    }

    static getOrderIds(pizza: Pizza) {
        return [pizza.order1.orderId, pizza.order2.orderId];
    }

    public stopBake(pizza: Pizza) {
        this.enableBake = false;
        this.orderService.changeStatus(this.partyId, BakeryComponent.getOrderIds(pizza), Status.WAITING).subscribe(() => {
            this.current = null;
            this.pizzaService.refreshPizzaList();
        });
    }

    public goToNextPizza(pizza: Pizza) {
        this.orderService.changeStatus(this.partyId, BakeryComponent.getOrderIds(pizza), Status.BAKING).subscribe(() => {
            this.nextPizza.next();
        });
    }

}