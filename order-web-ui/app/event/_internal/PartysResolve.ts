import {Inject, Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs";
import {PartyOverview, PartyRestService} from "../../_internal/api/PartyRestService";

@Injectable()
export class PartysResolve implements Resolve<Array<PartyOverview>> {

    constructor(@Inject(PartyRestService) private partyService: PartyRestService) {
    }

    public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Array<PartyOverview>> {
        return this.partyService.findAll();
    }

}