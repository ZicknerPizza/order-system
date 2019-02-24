import {Component, Input, OnChanges, SimpleChange} from "@angular/core";
import {Observable} from "rxjs";
import {Pizza} from "./PizzaDetailCondiment";
import {Order} from "../../_internal/api/OrderRestService";
import {PartyId} from "../../_internal/api/PartyRestService";
import {Condiment} from "../../_internal/api/CondimentRestService";
import {map} from "rxjs/operators";

@Component({
    selector: 'pizzaList',
    templateUrl: './PizzaList.html',
    providers: []
})
export class PizzaListComponent implements OnChanges {

    private show: boolean = false;

    @Input()
    private alwaysOpen: boolean = false;

    @Input()
    private title: string;

    @Input()
    private partyId: PartyId;

    @Input()
    private orders: Observable<Array<Order>>;

    @Input()
    private condiments: Array<Condiment>;

    private pizzas: Observable<Array<Pizza>>;

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        this.pizzas = this.orders
            .pipe(map((orders: Array<Order>) => {
                return Array.from(
                    orders.reduce(
                        (map: Map<string, Pizza>, order: Order) => {
                            if (map.has(order.pizzaId.value)) {
                                map.get(order.pizzaId.value).order2 = order;
                            } else {
                                map.set(order.pizzaId.value, new Pizza(order));
                            }
                            return map;
                        },
                        new Map<string, Pizza>()
                    ).values()
                );
            }));
    }
}