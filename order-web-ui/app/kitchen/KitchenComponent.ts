import {Component, Inject, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Observable} from "rxjs";
import {PizzaService} from "./_internal/PizzaService";
import {Order, Status} from "../_internal/api/OrderRestService";
import {Party} from "../_internal/api/PartyRestService";
import {Condiment} from "../_internal/api/CondimentRestService";
import {map} from "rxjs/operators";

@Component({
    templateUrl: './Kitchen.html',
    providers: []
})
export class KitchenComponent implements OnInit, OnDestroy {

    private party: Party;
    private condiments: Array<Condiment>;

    private orders: {
        WAITING: Observable<Order[]>,
        INACTIVE_AND_WAITING: Observable<Order[]>,
        TOPPING: Observable<Order[]>,
        BAKING: Observable<Order[]>,
        EATING: Observable<Order[]>
    };

    constructor(@Inject(PizzaService) private pizzaService: PizzaService,
                @Inject(ActivatedRoute) private route: ActivatedRoute) {
    }

    ngOnInit(): void {
        this.party = <Party>this.route.snapshot.data['party'];
        this.condiments = <Array<Condiment>>this.route.snapshot.data['condiments'];

        this.pizzaService.init(this.party.id);

        let pizzas = this.pizzaService.pizzas$;
        this.orders = {
            INACTIVE_AND_WAITING: pizzas.pipe(map(PizzaService.filterStatus([Status.INACTIVE, Status.WAITING]))),
            WAITING: pizzas.pipe(map(PizzaService.filterStatus([Status.WAITING]))),
            TOPPING: pizzas.pipe(map(PizzaService.filterStatus([Status.TOPPING]))),
            BAKING: pizzas.pipe(map(PizzaService.filterStatus([Status.BAKING]))),
            EATING: pizzas.pipe(map(PizzaService.filterStatus([Status.EATING])))
        };

    }

    ngOnDestroy(): void {
        this.pizzaService.destroy();
    }

}