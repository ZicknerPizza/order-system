import {Inject, Injectable} from "@angular/core";
import {Http, RequestOptions, Response, URLSearchParams} from "@angular/http";
import {Observable} from "rxjs";
import {PartyId} from "./PartyRestService";

@Injectable()
export class LinkRestService {

    constructor(@Inject(Http) private http: Http) {
    }

    public findAll(): Observable<Array<Link>> {
        return this.http.get("api/links")
            .map((res: Response) => res.json());
    }

    public findByIdentifier(linkIdentifier: string): Observable<Link> {
        let urlSearchParams = new URLSearchParams();
        urlSearchParams.set("identifier", linkIdentifier);
        return this.http.get(`api/links/search`, new RequestOptions({
            search: urlSearchParams
        }))
            .map((res: Response) => res.json());
    }

    public update(linkId: LinkId, link: Link): Observable<void> {
        return this.http.put(`api/links/${linkId.value}`, link)
            .map(() => {
            });
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