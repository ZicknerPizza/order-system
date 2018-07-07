import {Component, Inject} from "@angular/core";
import {NotificationService} from "../_internal/component/notification/NotificationService";
import {Link, LinkRestService} from "../_internal/api/LinkRestService";
import {Party, PartyId} from "../_internal/api/PartyRestService";
import {ActivatedRoute} from "@angular/router";

@Component({
    template: require("./LinkAdmin.html")
})
export class LinkAdminComponent {
    private links: Array<Link>;
    private partysById: Map<number, Party>;
    private upcomingPartys: Array<Party>;
    private pagePath: string;

    constructor(@Inject(ActivatedRoute) private route: ActivatedRoute,
                @Inject(NotificationService) private notificationService: NotificationService,
                @Inject(LinkRestService) private linkService: LinkRestService) {
        let urlParts = window.location.href.split("/");
        this.pagePath = urlParts[0] + "//" + urlParts[2];
    }

    ngOnInit(): void {
        this.links = <Array<Link>>this.route.snapshot.data["links"];
        let partys = <Array<Party>>this.route.snapshot.data["partys"];
        this.upcomingPartys = partys.filter((party) => LinkAdminComponent.eventUpcoming(party));
        this.partysById = partys.reduce(
            (partysById: Map<number, Party>, party: Party) => {
                partysById.set(party.id.value, party);
                return partysById;
            },
            new Map<number, Party>()
        );
    }

    setParty(link: Link, party: Party): void {
        link.partyId = party.id;
        link.partyKey = party.key;
    }

    getName(partyId: PartyId) {
        return this.partysById.get(partyId.value);
    }

    save(link: Link) {
        this.linkService.update(link.id, link).subscribe(() => {
            this.notificationService.success('Link erfolgreich gespeichert.');
        }, () => {
            this.notificationService.error('Fehler beim Speichern des Links.');
        });
    }

    private static eventUpcoming(party: Party) {
        const date = new Date(new Date().getTime() - 86400000);
        const dateEvent = party.date.split("-");
        let year = parseInt(dateEvent[0], 10);
        let month = parseInt(dateEvent[1], 10) - 1;
        let day = parseInt(dateEvent[2], 10);
        return new Date(year, month, day) >= date;
    }
}