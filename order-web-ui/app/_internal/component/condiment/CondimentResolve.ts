import {Inject, Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs";
import {Condiment} from "../../api/CondimentRestService";
import {CondimentService} from "./CondimentService";

@Injectable()
export class CondimentResolve implements Resolve<Array<Condiment>> {

    constructor(@Inject(CondimentService) private condimentService: CondimentService) {
    }

    public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Array<Condiment>> {
        return this.condimentService.getCondiments();
    }

}