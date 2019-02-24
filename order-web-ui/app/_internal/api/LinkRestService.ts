import {Inject, Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {PartyId} from "./PartyRestService";
import {HttpClient} from "@angular/common/http";

@Injectable()
export class LinkRestService {

    constructor(@Inject(HttpClient) private http: HttpClient) {
    }

    public findAll(): Observable<Array<Link>> {
        return this.http.get<Array<Link>>("api/links");
    }

    public findByIdentifier(linkIdentifier: string): Observable<Link> {
        return this.http.get<Link>(`api/links/search?identifier=${linkIdentifier}`);
    }

    public update(linkId: LinkId, link: Link): Observable<void> {
        return this.http.put<void>(`api/links/${linkId.value}`, link);
    }
}

export class LinkId {
    public value;

    constructor(value) {
        this.value = value;
    }
}

export class Link {
    public id: LinkId;
    public identifier: string;
    public partyId: PartyId;
    public partyKey: string;


    constructor(id: LinkId, identifier: string, partyId: PartyId, partyKey: string) {
        this.id = id;
        this.identifier = identifier;
        this.partyId = partyId;
        this.partyKey = partyKey;
    }
}