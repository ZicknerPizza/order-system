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

    public update(id: PartyId, info: UpdateParty): Observable<void> {
        return this.http.put(`api/partys/${id.value}`, info)
            .map(() => {
            });
    }

    public create(info: CreateParty): Observable<void> {
        return this.http.post(`api/partys`, info)
            .map(() => {
            });
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

export class CreateParty {
    id: PartyId;
    name: String;
    key: String;
    date: string;
    countPizza: number;
    blendStatistics: number;
    condiments: PartyCondiment[];
}

export interface UpdateParty {
    name: string;
    date: string;
    blendStatistics: number;
    estimatedNumberOfPizzas: number;
    condiments: PartyCondiment[];
}

export class Party {
    public id: PartyId;
    public name: string;
    public key: string;
    public date: string;
    public estimatedNumberOfPizzas: number;
    public blendStatistics: number;
    public condiments: Array<CondimentId>;

    constructor(id?: PartyId, name?: string, key?: string, date?: string, estimatedNumberOfPizzas?: number, blendStatistics?: number, condiments?: Array<CondimentId>) {
        this.id = id;
        this.name = name;
        this.key = key;
        this.date = date;
        this.estimatedNumberOfPizzas = estimatedNumberOfPizzas;
        this.blendStatistics = blendStatistics;
        this.condiments = condiments;
    }
}

export class PartyCondiment {
    public condimentId: CondimentId;
    public amount: number;
    public rating: number; // TODO: should be an enum
}