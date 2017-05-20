import {Component, Inject, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Link} from "../_internal/api/LinkRestService";

@Component({
    template: ""
})
export class LinkComponent implements OnInit {

    constructor(@Inject(ActivatedRoute) private route: ActivatedRoute,
                @Inject(Router) private router: Router) {
    }

    ngOnInit(): void {
        let link = <Link>this.route.snapshot.data['link'];
        this.router.navigate(['/order', link.partyId.value, link.partyKey]);
    }

}