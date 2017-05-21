import {Inject, Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {Condiment, CondimentId, CondimentRestService} from "../../api/CondimentRestService";

@Injectable()
export class CondimentService {

    private condimentMapObservable: Observable<Map<number, Condiment>>;
    private condimentMap: Map<number, Condiment> = null;

    constructor(@Inject(CondimentRestService) private condimentRestService: CondimentRestService) {
        this.condimentMapObservable = condimentRestService.findAll()
            .map(
                (condiments) => condiments.reduce(
                    (condimentMap: Map<number, Condiment>, condiment: Condiment) => {
                        condimentMap.set(condiment.id.value, condiment);
                        return condimentMap;
                    },
                    new Map<number, Condiment>()
                )
            );
        this.condimentMapObservable.subscribe((condimentMap) => {
            this.condimentMap = condimentMap;
        });
    }

    private getCondimentMapObservable() {
        if (this.condimentMap !== null) {
            return Observable.of(this.condimentMap);
        }
        return this.condimentMapObservable;
    }

    public getCondiments(): Observable<Array<Condiment>> {
        return this.getCondimentMapObservable().map(condiments => Array.from(this.condimentMap.values()));
    }

    public getCondimentName(condimentId: CondimentId): Observable<string> {
        return this.getCondimentMapObservable().map((condimentMap) => {
            return CondimentService.determineCondimentName(condimentMap, condimentId);
        });
    }

    private static determineCondimentName(condimentMap, condimentId: CondimentId) {
        let condiment: Condiment = condimentMap.get(condimentId.value);
        if (condiment == undefined) {
            return "";
        }
        return condiment.name;
    }

}