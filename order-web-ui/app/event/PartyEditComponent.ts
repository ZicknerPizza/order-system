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
import {UUID} from "angular2-uuid";
import {Observable} from "rxjs";

@Component({
    template: require('./PartyEdit.html'),
    providers: [
        CondimentRestService,
        PartyRestService
    ]
})
export class PartyEditComponent {

    private party: Party;
    private categories: Array<[string, Array<CondimentWithRating>]>;
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
        this.categories = <Array<[string, Array<CondimentWithRating>]>>CondimentCategoryService.groupCondimentsByCategory(condiments);
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

    changeEstimatedNumberOfPizzas(factor: number): void {
        this.party.estimatedNumberOfPizzas = this.party.estimatedNumberOfPizzas + factor;
        if (this.party.estimatedNumberOfPizzas < 0) {
            this.party.estimatedNumberOfPizzas = 0;
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
        let percentageOverall = 0;
        if (condimentStatistic) {
            percentageOverall = condimentStatistic.percentageOfOrders;
        }
        let percentageParty: number = 0;
        if (this.orders.length > 0) {
            percentageParty = numberOfOrdersWithCondiment / this.orders.length * 100;
        }
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

        if (num == 0) {
            return 0;
        }

        return all / num;
    };

    public getCondimentStatistic(condiment: Condiment): Statistic {
        return this.condimentsStatistic.get(condiment.id.value).statistic;
    }

    amountCalculated(condiment: Condiment): number {
        return this.blendCondimentStatistic(condiment) * this.amountPerPizza(condiment) * this.party.estimatedNumberOfPizzas / 100;
    };

    saveData(): void {
        let condiments: PartyCondiment[] = [];

        for (const category of this.categories) {
            const categoryCondiments = category[1];
            for (const categoryCondiment of categoryCondiments) {
                if (this.availableCondiments[categoryCondiment.id.value] === true) {
                    condiments.push({
                        condimentId: categoryCondiment.id,
                        amount: categoryCondiment.amount,
                        rating: categoryCondiment.rating + 1
                    })
                }
            }
        }
        let info: any = this.party;
        info.condiments = condiments;

        let result: Observable<void>;

        if (info.id != null) {
            result = this.eventService.update(info.id, {
                name: info.name,
                date: info.date,
                estimatedNumberOfPizzas: info.estimatedNumberOfPizzas,
                blendStatistics: info.blendStatistics,
                condiments: info.condiments
            });
        } else {
            info.id = {
                value: UUID.UUID()
            };
            info.key = UUID.UUID().substring(0, 8);
            result = this.eventService.create(info);
        }

        result.subscribe(
            (): void => {
                this.notificationService.success('Erfolgreich gespeichert');
                this.router.navigate(['/event/list'])
                    .then(() => window.scrollTo(0, 0));
            },
            (): void => {
                this.notificationService.error('Speichern fehlgeschlagen');
            }
        );
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

export class CondimentWithRating extends Condiment {
    public amount: number;
    public rating: number;
}
