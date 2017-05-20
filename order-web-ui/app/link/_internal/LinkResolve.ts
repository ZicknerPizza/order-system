import {Inject, Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs";
import {Link, LinkId, LinkRestService} from "../../_internal/api/LinkRestService";

@Injectable()
export class LinkResolve implements Resolve<Link> {

    constructor(@Inject(LinkRestService) private linkRestService: LinkRestService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Link> {
        return this.linkRestService.findByIdentifier(route.params["id"]);
    }
}