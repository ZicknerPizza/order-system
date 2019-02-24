import {Inject, Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {Observable, of} from "rxjs";
import {Party, PartyId, PartyRestService} from "../../_internal/api/PartyRestService";
import {catchError} from "rxjs/operators";

@Injectable()
export class OrderPartyResolve implements Resolve<Party> {

    constructor(@Inject(PartyRestService) private partyService: PartyRestService) {
    }

    public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Party> {
        let partyId = new PartyId(route.params["id"]);
        return this.partyService.findOne(partyId, route.params["key"])
            .pipe(catchError(() => {
                return of(null);
            }));
    }

}