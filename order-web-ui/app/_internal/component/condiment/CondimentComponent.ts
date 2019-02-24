import {Component, Inject, Input, OnInit} from "@angular/core";
import {CondimentService} from "./CondimentService";
import {CondimentId} from "../../api/CondimentRestService";

@Component({
    selector: "condiment",
    templateUrl: "./Condiment.html"
})
export class CondimentComponent implements OnInit {

    @Input()
    private id: CondimentId;

    private name: string;

    constructor(@Inject(CondimentService) private condimentService: CondimentService) {
    }

    ngOnInit() {
        this.condimentService.getCondimentName(this.id)
            .subscribe((name) => {
                this.name = name;
            });
    }

}