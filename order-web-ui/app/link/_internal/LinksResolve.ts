import {Inject, Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {Link, LinkRestService} from "../../_internal/api/LinkRestService";
import {Observable} from "rxjs";

@Injectable()
export class LinksResolve implements Resolve<Array<Link>> {

    constructor(@Inject(LinkRestService) private linkRestService: LinkRestService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Array<Link>> {
        return this.linkRestService.findAll();
    }
}