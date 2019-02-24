import {Inject, Injectable} from "@angular/core";
import {EMPTY, Observable, Subject} from "rxjs";
import {Order, OrderRestService, Status} from "../../_internal/api/OrderRestService";
import {PartyId} from "../../_internal/api/PartyRestService";

@Injectable()
export class PizzaService {

    private partyId: PartyId;
    private _pizzas$: Subject<Order[]>;
    private interval;

    constructor(@Inject(OrderRestService) private orderService: OrderRestService) {
        this._pizzas$ = new Subject<Order[]>();
    }

    public init(partyId: PartyId) {
        this.partyId = partyId;
        this.startInterval();
        this.refreshPizzaList();
    }

    private startInterval(): void {
        this.interval = setInterval(this.refreshPizzaList, 15000);
    }


    public destroy() {
        clearInterval(this.interval);
    }

    bake(partyId: PartyId, kitchenPizza: any): Observable<any> {
        return EMPTY;
    }

    getNewKitchenPizza(partyId: PartyId): Observable<any> {
        return EMPTY;
    }

    get pizzas$(): Observable<Order[]> {
        return this._pizzas$.asObservable();
    }

    public refreshPizzaList = () => {
        this.orderService.findOrdersForParty(this.partyId)
            .subscribe((orders) => {
                this._pizzas$.next(orders);
            });
    };

    public static filterStatus(status: Array<Status>): ((orders: Array<Order>) => Array<Order>) {
        return orders => orders.filter((order) => status.includes(order.status));
    }
}