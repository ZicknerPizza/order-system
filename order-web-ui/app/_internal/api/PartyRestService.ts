import {Inject, Injectable} from "@angular/core";
import {Http, Response} from "@angular/http";
import {Observable} from "rxjs";
import {CondimentId} from "./CondimentRestService";

@Injectable()
export class PartyRestService {

    constructor(@Inject(Http) private http: Http) {
    }

    public findAll(): Observable<Array<PartyOverview>> {
        return this.http.get('api/partys')
            .map((res: Response) => res.json());
    }

    public findOne(partyId: PartyId, key?: string): Observable<Party> {
        if (key != null) {
            key = `/${key}`;
        } else {
            key = "";
        }
        return this.http.get(`api/partys/${partyId.value}${key}`)
            .map((res: Response) => res.json());
    }

    public update(id: string | number, info: any): Observable<any> {
        return this.http.put(`api/events/${id}`, info)
            .map((res: Response) => res.json());
    }

    public save(info: any): Observable<any> {
        return this.http.post(`api/events/`, info)
            .map((res: Response) => res.json());
    }

}

export class PartyId {
    public value: number;

    constructor(value: number) {
        this.value = value;
    }
}

export class PartyOverview {
    public id: PartyId;
    public name: string;
    public key: string;
    public date: string;

    constructor(id: PartyId, name: string, key: string, date: string) {
        this.id = id;
        this.name = name;
        this.key = key;
        this.date = date;
    }
}

export class Party {
    public id: PartyId;
    public name: string;
    public key: string;
    public date: string;
    public countPizza: number;
    public blendStatistics: number;
    public condiments: Array<CondimentId>;

    constructor(id?: PartyId, name?: string, key?: string, date?: string, countPizza?: number, blendStatistics?: number, condiments?: Array<CondimentId>) {
        this.id = id;
        this.name = name;
        this.key = key;
        this.date = date;
        this.countPizza = countPizza;
        this.blendStatistics = blendStatistics;
        this.condiments = condiments;
    }
}

export class PartyCondiment {
    public amount: number;
    public rating: number; // TODO: should be an enum
}