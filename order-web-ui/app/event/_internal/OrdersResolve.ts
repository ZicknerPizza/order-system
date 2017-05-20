import {Inject, Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {Order, OrderRestService} from "../../_internal/api/OrderRestService";
import {Observable} from "rxjs/Observable";
import {PartyId} from "../../_internal/api/PartyRestService";

@Injectable()
export class OrdersResolve implements Resolve<Array<Order>> {

    constructor(@Inject(OrderRestService) private orderRestService: OrderRestService) {
    }

    public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Array<Order>> {
        let partyId = new PartyId(route.params["partyId"]);
        return this.orderRestService.findOrdersForParty(partyId);
    }

}