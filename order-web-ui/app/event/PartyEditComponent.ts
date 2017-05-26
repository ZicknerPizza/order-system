import {Component, Inject} from "@angular/core";
import {
    Condiment,
    CondimentId,
    CondimentRestService,
    CondimentStatistic,
    Statistic
} from "../_internal/api/CondimentRestService";
import {Party, PartyCondiment, PartyRestService} from "../_internal/api/PartyRestService";
import {ActivatedRoute, Router} from "@angular/router";
import {NotificationService} from "../_internal/component/notification/NotificationService";
import {Order} from "../_internal/api/OrderRestService";
import {CondimentCategoryService} from "../_internal/CondimentCategoryService";

@Component({
    template: require('./PartyEdit.html'),
    providers: [
        CondimentRestService,
        PartyRestService
    ]
})
export class PartyEditComponent {

    private party: Party;
    private categories: Array<[string, Array<Condiment>]>;
    private orders: Array<Order>;
    private availableCondiments: Object = {};
    private condimentSettings: Object = {};
    private condimentsStatistic: Map<number, CondimentStatistic> = new Map<number, CondimentStatistic>();

    constructor(@Inject(PartyRestService) private eventService: PartyRestService,
                @Inject(NotificationService) private notificationService: NotificationService,
                @Inject(Router) private router: Router,
                @Inject(ActivatedRoute) private routeParams: ActivatedRoute) {
        this.party = <Party>this.routeParams.snapshot.data["party"];
        this.condimentsStatistic = <Map<number, CondimentStatistic>>this.routeParams.snapshot.data["condimentsStatistic"];
        this.orders = <Array<Order>>this.routeParams.snapshot.data["orders"];

        if (this.party === undefined) {
            this.party = new Party();
            this.orders = [];
        } else {
            for (let condimentId of this.party.condiments) {
                this.availableCondiments[condimentId.value] = true;
            }
        }
        let condiments = <Array<Condiment>>this.routeParams.snapshot.data["condiments"];
        this.categories = CondimentCategoryService.groupCondimentsByCategory(condiments);
        for (let condiment of condiments) {
            this.condimentSettings[condiment.id.value] = {
                showDetails: false
            };
        }
    }

    public showCondimentDetails(condimentId: CondimentId): void {
        this.condimentSettings[condimentId.value].showDetails = !this.condimentSettings[condimentId.value].showDetails
    }

    public isCondimentSelected(condimentId: CondimentId): boolean {
        return this.availableCondiments[condimentId.value] === true;
    }

    changeCountPizza(factor: number): void {
        this.party.countPizza = this.party.countPizza + factor;
        if (this.party.countPizza < 0) {
            this.party.countPizza = 0;
        }
    }

    blendCondimentStatistic(condiment: Condiment): number {
        let numberOfOrdersWithCondiment = 0;
        for (let order of this.orders) {
            if (order.hasCondiment(condiment.id)) {
                numberOfOrdersWithCondiment++;
            }
        }
        let condimentStatistic = this.condimentsStatistic.get(condiment.id.value);
        let percentageOverall = condimentStatistic.percentageOfOrders;
        let percentageParty = numberOfOrdersWithCondiment / this.orders.length * 100;
        return (this.party.blendStatistics * percentageOverall + (100 - this.party.blendStatistics) * percentageParty) / 100;
    }

    showOrderLabel(order: Order) {
        if (order.comment) {
            return order.name + ": " + order.comment;
        } else {
            return order.name;
        }
    }

    amountPerPizza(condiment: Condiment): number {
        let statistic = this.getCondimentStatistic(condiment);
        let all = 0;
        let num = 0;
        let addInformation = (array: Array<number>): void => {
            if (array) {
                let middleOfArray = Math.floor(array.length / 2);
                all = all + array[middleOfArray];
                num++;
            }
        };
        addInformation(statistic.less);
        addInformation(statistic.match);
        addInformation(statistic.greater);

        return all / num;
    };

    public getCondimentStatistic(condiment: Condiment): Statistic {
        return this.condimentsStatistic.get(condiment.id.value).statistic;
    }

    amountCalculated(condiment: Condiment): number {
        return this.blendCondimentStatistic(condiment) * this.amountPerPizza(condiment) * this.party.countPizza / 100;
    };

    saveData(): void {
        let condiments: any[] = [];

        let info: any = this.party;
        info.condiments = condiments;

        if (info.id != null) {
            this.eventService.update(info.id, info).subscribe(this.saveSuccess, this.saveError);
        } else {
            this.eventService.save(info).subscribe(this.saveSuccess, this.saveError);
        }
    }

    saveSuccess(): void {
        this.notificationService.success('Erfolgreich gespeichert');
        this.router.navigate(['/event/list']);
    }

    saveError(): void {
        this.notificationService.error('Speichern fehlgeschlagen');
    }

    changeRating(condiment: PartyCondiment, newRating: number) {
        if (condiment.rating == newRating) {
            condiment.rating = undefined;
        } else {
            condiment.rating = newRating;
        }
    };

    isCurrentRating(condiment: PartyCondiment, neededRating: number) {
        return condiment.rating == neededRating;
    }

}