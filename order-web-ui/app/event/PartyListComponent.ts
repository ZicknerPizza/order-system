import {PartyOverview, PartyRestService} from "../_internal/api/PartyRestService";
import {Component, Inject} from "@angular/core";
import {ActivatedRoute} from "@angular/router";

@Component({
    templateUrl: './PartyList.html',
    providers: [
        PartyRestService
    ]
})
export class PartyListComponent {
    private partys: Array<PartyOverview>;

    constructor(@Inject(ActivatedRoute) private routeParams: ActivatedRoute) {
        this.partys = <Array<PartyOverview>>this.routeParams.snapshot.data["partys"];
    }

}