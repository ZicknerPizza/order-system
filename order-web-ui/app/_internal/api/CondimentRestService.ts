import {Inject, Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {Http, Response} from "@angular/http";

@Injectable()
export class CondimentRestService {

    constructor(@Inject(Http) private http: Http) {
    }

    findAllOld(): Observable<any> {
        return this.http.get('api/condiments/').map((res: Response) => res.json());
    }

    findCondimentsStatistic(): Observable<Map<number, CondimentStatistic>> {
        return this.http.get("api/condiments/statistic")
            .map((response: Response) => {
                return response.json();
            })
            .map((condimentStatistics: Array<CondimentStatistic>) =>
                condimentStatistics.reduce(
                    (map: Map<number, CondimentStatistic>, condimentStatistic: CondimentStatistic) => {
                        map.set(condimentStatistic.id.value, condimentStatistic);
                        return map;
                    },
                    new Map<number, CondimentStatistic>()
                )
            );
    }

    findAll(): Observable<Array<Condiment>> {
        return this.http.get('api/condiments')
            .map((response: Response) => response.json());
    }

}

export class CondimentId {
    public value: number;

    constructor(value) {
        this.value = value;
    }
}

export class Condiment {
    public id: CondimentId;
    public category: string;
    public name: string;
    public unit: string;

    constructor(id: CondimentId, category: string, name: string, unit: string) {
        this.id = id;
        this.category = category;
        this.name = name;
        this.unit = unit;
    }
}

export class CondimentStatistic {
    public id: CondimentId;
    public percentageOfOrders: number;
    public statistic: Statistic;

    constructor(id: CondimentId, percentageOfOrders: number, statistic: Statistic) {
        this.id = id;
        this.percentageOfOrders = percentageOfOrders;
        this.statistic = statistic;
    }
}

export class Statistic {
    public greater: Array<number>;
    public match: Array<number>;
    public less: Array<number>;

    constructor(greater: Array<number>, match: Array<number>, less: Array<number>) {
        this.greater = greater;
        this.match = match;
        this.less = less;
    }

    public getMinimum(): number {
        let min = Number.MAX_SAFE_INTEGER;
        let checkMinAndSet = (min: number, array: Array<number>): number => {
            if (array != undefined && min > array[0]) {
                min = array[0];
            }
            return min;
        };
        min = checkMinAndSet(min, this.greater);
        min = checkMinAndSet(min, this.match);
        min = checkMinAndSet(min, this.less);
        return min;
    }

    public getMaximum(): number {
        let max = 0;
        let checkMaxAndSet = (max: number, array: Array<number>): number => {
            if (array != undefined && max < array[array.length - 1]) {
                max = array[array.length - 1];
            }
            return max;
        };
        max = checkMaxAndSet(max, this.greater);
        max = checkMaxAndSet(max, this.match);
        max = checkMaxAndSet(max, this.less);
        return max;
    }
}