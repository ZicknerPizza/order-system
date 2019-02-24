import {Component, Inject} from "@angular/core";
import {Party} from "../_internal/api/PartyRestService";
import {ActivatedRoute} from "@angular/router";
import {Condiment} from "../_internal/api/CondimentRestService";

@Component({
    templateUrl: "./Order.html"
})
export class OrderComponent {
    private party: Party;
    private condiments: Array<Condiment>;

    constructor(@Inject(ActivatedRoute) private route: ActivatedRoute) {
        this.party = <Party>this.route.snapshot.data['party'];
        this.condiments = <Array<Condiment>>this.route.snapshot.data['condiments'];
    }
}