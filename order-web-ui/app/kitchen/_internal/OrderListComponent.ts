import {Component, Inject, Input} from "@angular/core";
import {Observable} from "rxjs";
import {Order, OrderRestService, Status} from "../../_internal/api/OrderRestService";
import {PizzaService} from "./PizzaService";
import {PartyId} from "../../_internal/api/PartyRestService";

declare const window;

@Component({
    selector: 'orderList',
    templateUrl: './OrderList.html'
})
export class OrderListComponent {

    private show: boolean = false;

    private details: any;
    private condiments: any;

    @Input()
    private title: string;

    @Input()
    private partyId: PartyId;

    @Input()
    private orders: Observable<Order[]>;

    constructor(@Inject(OrderRestService) private orderService: OrderRestService,
                @Inject(PizzaService) private pizzaService: PizzaService) {
        this.details = {};
        this.condiments = {};
    }

    showDetails(order: Order) {
        return this.details[order.orderId.value] === true;
    }

    isActive(order: Order) {
        return order.status !== Status.INACTIVE;
    }

    openClose(order: Order) {
        this.details[order.orderId.value] = !this.showDetails(order);
    }

    disable(order: Order) {
        this.orderService.changeStatus(this.partyId, [order.orderId], Status.INACTIVE).subscribe(() => {
            this.pizzaService.refreshPizzaList();
        });
    }

    enable(order: Order) {
        this.orderService.changeStatus(this.partyId, [order.orderId], Status.WAITING).subscribe(() => {
            this.pizzaService.refreshPizzaList();
        });
    }

    delete(order: Order) {
        if (window.confirm('Möchtest du diese Bestellung wirklich löschen?')) {
            this.orderService.delete(this.partyId, order.orderId).subscribe(() => {
                this.pizzaService.refreshPizzaList();
            });
        }
    }
}