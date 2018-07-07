import {Component, Inject, Input, OnChanges, SimpleChanges} from "@angular/core";
import {OrderId, OrderRestService, Status} from "../../api/OrderRestService";
import {NotificationService} from "../notification/NotificationService";
import {Party} from "../../api/PartyRestService";
import {Condiment, CondimentId} from "../../api/CondimentRestService";
import {UUID} from "angular2-uuid";
import {CondimentCategoryService} from "../../CondimentCategoryService";

@Component({
    selector: 'orderCreate',
    template: require('./OrderCreate.html'),
    providers: []
})
export class OrderCreateComponent implements OnChanges {

    private show: boolean;

    private name: string;
    private comment: string;
    private requestForPizza: {[condimentId: number]: boolean} = {};

    @Input()
    public title: string;

    @Input()
    public party: Party;

    @Input()
    private alwaysOpen: boolean = false;

    @Input()
    private condiments: Array<Condiment>;

    private categories: Array<[string, Array<Condiment>]>;

    constructor(@Inject(OrderRestService) private orderService: OrderRestService,
                @Inject(NotificationService) private notificationService: NotificationService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        let condiments = this.condiments.filter(condiment => this.showCondiment(condiment.id));
        this.categories = CondimentCategoryService.groupCondimentsByCategory(condiments);
    }

    public showCondiment(condimentId: CondimentId): boolean {
        return OrderCreateComponent.includes(this.party.condiments, condimentId);
    }

    public sendOrder = () => {
        let condiments: Array<CondimentId> = [];

        for (let condiment in this.requestForPizza) {
            if (this.requestForPizza[condiment]) {
                condiments.push(new CondimentId(condiment));
            }
        }

        let status = Status.INACTIVE;
        if (OrderCreateComponent.isToday(this.party.date)) {
            status = Status.WAITING;
        }

        this.orderService.order(this.party.id, this.party.key, {
            orderId: new OrderId(UUID.UUID()),
            name: this.name,
            comment: this.comment,
            condiments: condiments,
            status
        })
            .subscribe(() => {
                this.name = "";
                this.comment = "";
                this.requestForPizza = {};
                if (status == Status.INACTIVE) {
                    this.notificationService.success('Die Pizza wurde erfolgreich vorbestellt.');
                } else {
                    this.notificationService.success('Die Pizza wurde erfolgreich bestellt.');
                }
                scrollTo(0, 0);
            }, () => {
                this.notificationService.error('Es ist ein Fehler bei der Bestellung aufgetreten, bitte überprüfe ' +
                    'deine Internetverbindung und probiere es später nocheinmal.');
                scrollTo(0, 0);
            });
    };

    private static includes(condiments: Array<CondimentId>, search: CondimentId) {
        for (let condiment of condiments) {
            if (condiment.value === search.value) {
                return true;
            }
        }
        return false;
    }

    private static isToday(date: string) {
        return new Date().toISOString().startsWith(date);
    }
}