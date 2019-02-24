import {Component, Inject, OnInit} from "@angular/core";
import {CondimentRestService} from "../_internal/api/CondimentRestService";
import {Observable} from "rxjs";

@Component({
    templateUrl: './Statistic.html',
    providers: [
        CondimentRestService
    ]
})
export class StatisticComponent implements OnInit {
    private condiments: Observable<any>;
    private percent: number;

    constructor(@Inject(CondimentRestService) private condimentRestService: CondimentRestService) {
    }

    ngOnInit(): void {
        this.condiments = this.condimentRestService.findAllOld();
        this.percent = 50;
    }

}