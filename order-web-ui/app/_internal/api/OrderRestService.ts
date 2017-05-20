import {Inject, Injectable} from "@angular/core";
import {Http, RequestOptions, Response, URLSearchParams} from "@angular/http";
import {Observable} from "rxjs";
import {Parser} from "./Parser";
import {CondimentId} from "./CondimentRestService";
import {UUID} from "angular2-uuid";
import {PartyId} from "./PartyRestService";

@Injectable()
export class OrderRestService {

    constructor(@Inject(Http) private http: Http) {
    }

    public order(partyId: PartyId, key: string, order: OrderCreateDetails): Observable<void> {
        order.status = (<any>Status)[order.status];
        return this.http
            .post(`api/orders/${partyId.value}/${key}`, order)
            .map(() => {
            });
    }

    public changeStatus(partyId: PartyId, orderIds: Array<OrderId>, status: Status): Observable<void> {
        return this.http
            .put(`api/orders/${partyId.value}/status`, {
                status,
                orderIds
            })
            .map(() => {
            });
    }

    public delete(partyId: PartyId, orderId: OrderId): Observable<void> {
        return this.http.delete(`api/orders/${partyId.value}/${orderId.value}`)
            .map((res: Response) => {
            });
    }

    public findOrdersForParty(partyId: PartyId): Observable<Order[]> {
        return this.http.get(`api/orders/${partyId.value}`)
            .map((res: Response) => res.json())
            .map((orders) => {
                let result: Array<Order> = [];
                for (let order of orders) {
                    result.push(new Order(
                        order.orderId,
                        order.pizzaId,
                        order.partyId,
                        order.name,
                        order.comment,
                        Parser.parseDateIfExists(order.time),
                        Parser.parseDateIfExists(order.timeStove),
                        (<any>Status)[order.status],
                        order.condiments
                    ));
                }
                return result;
            });
    }

}

export class OrderId {
    public value: string;

    constructor(value: string) {
        this.value = value;
    }
}

export class Order {
    public orderId: OrderId;
    public pizzaId: PizzaId;
    public partyId: PartyId;
    public name: string;
    public comment: string;
    public date: Date;
    public timeStove: Date;
    public status: Status;
    public condiments: CondimentId[];


    constructor(orderId: OrderId, pizzaId: PizzaId, partyId: PartyId, name: string, comment: string, date: Date, timeStove: Date, status: Status, condiments: CondimentId[]) {
        this.orderId = orderId;
        this.pizzaId = pizzaId;
        this.partyId = partyId;
        this.name = name;
        this.comment = comment;
        this.date = date;
        this.timeStove = timeStove;
        this.status = status;
        this.condiments = condiments;
    }

    hasCondiment(id: CondimentId) {
        for (let condiment of this.condiments) {
            if (condiment.value == id.value) {
                return true;
            }
        }
        return false;
    }
}

export class OrderCreateDetails {
    public orderId: OrderId;
    public name: string;
    public comment: string;
    public condiments: CondimentId[];
    public status: Status;
}

export enum Status {
    INACTIVE,
    WAITING,
    TOPPING,
    BAKING,
    EATING,
    DELETED
}

export class PizzaId {
    public value: string;

    constructor(value?) {
        if (!value) {
            value = UUID.UUID();
        }
        this.value = value;
    }

}