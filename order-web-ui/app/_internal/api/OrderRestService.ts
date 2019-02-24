import {Inject, Injectable} from "@angular/core";
import {Response} from "@angular/http";
import {Observable} from "rxjs";
import {Parser} from "./Parser";
import {CondimentId} from "./CondimentRestService";
import {UUID} from "angular2-uuid";
import {PartyId} from "./PartyRestService";
import {HttpClient} from "@angular/common/http";
import {map} from "rxjs/operators";

@Injectable()
export class OrderRestService {

    constructor(@Inject(HttpClient) private http: HttpClient) {
    }

    public order(partyId: PartyId, key: string, order: OrderCreateDetails): Observable<void> {
        order.status = (<any>Status)[order.status];
        return this.http
            .post<void>(`api/orders/${partyId.value}/${key}`, order);
    }

    public changeStatus(partyId: PartyId, orderIds: Array<OrderId>, status: Status): Observable<void> {
        return this.http
            .put<void>(`api/orders/${partyId.value}/status`, {
                status,
                orderIds
            });
    }

    public delete(partyId: PartyId, orderId: OrderId): Observable<void> {
        return this.http.delete<void>(`api/orders/${partyId.value}/${orderId.value}`);
    }

    public findOrdersForParty(partyId: PartyId): Observable<Order[]> {
        return this.http.get<any[]>(`api/orders/${partyId.value}`)
            .pipe(map((orders) => {
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
            }));
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