import {Inject, Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {CondimentRestService, CondimentStatistic} from "../../_internal/api/CondimentRestService";
import {Observable} from "rxjs/Observable";

@Injectable()
export class CondimentsStatisticResolve implements Resolve<Map<number, CondimentStatistic>> {

    constructor(@Inject(CondimentRestService) private condimentRestService: CondimentRestService) {
    }

    public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Map<number, CondimentStatistic>> {
        return this.condimentRestService.findCondimentsStatistic();
    }

}