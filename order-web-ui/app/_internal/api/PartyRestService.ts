import {Inject, Injectable} from "@angular/core";
import {Response} from "@angular/http";
import {Observable} from "rxjs";
import {CondimentId} from "./CondimentRestService";
import {HttpClient} from "@angular/common/http";

@Injectable()
export class PartyRestService {

    constructor(@Inject(HttpClient) private http: HttpClient) {
    }

    public findAll(): Observable<Array<PartyOverview>> {
        return this.http.get<Array<PartyOverview>>('api/partys');
    }

    public findOne(partyId: PartyId, key?: string): Observable<Party> {
        if (key != null) {
            key = `/${key}`;
        } else {
            key = "";
        }
        return this.http.get<Party>(`api/partys/${partyId.value}${key}`);
    }

    public update(id: PartyId, info: UpdateParty): Observable<void> {
        return this.http.put<void>(`api/partys/${id.value}`, info);
    }

    public create(info: CreateParty): Observable<void> {
        return this.http.post<void>(`api/partys`, info);
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
    estimatedNumberOfPizzas: number;
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