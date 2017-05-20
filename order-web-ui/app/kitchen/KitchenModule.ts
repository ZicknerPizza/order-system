import {NgModule} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {PartyResolve} from "./_internal/PartyResolve";
import {OrderCreateModule} from "../_internal/component/ordercreate/OrderCreateModule";
import {KitchenComponent} from "./KitchenComponent";
import {OrderListComponent} from "./_internal/OrderListComponent";
import {PizzaDetailComponent} from "./_internal/PizzaDetailCondiment";
import {PizzaListComponent} from "./_internal/PizzaListComponent";
import {KitchenRouting, KitchenRoutingProviders} from "./KitchenRouting";
import {PizzaService} from "./_internal/PizzaService";
import {BakeryComponent} from "./_internal/BakeryComponent";
import {CondimentModule} from "../_internal/component/condiment/CondimentModule";

@NgModule({
    declarations: [
        KitchenComponent,
        OrderListComponent,
        PizzaDetailComponent,
        PizzaListComponent,
        BakeryComponent
    ],
    exports: [
    ],
    imports: [
        KitchenRouting,
        CommonModule,
        FormsModule,
        OrderCreateModule,
        CondimentModule.forRoot()
    ],
    providers: [
        KitchenRoutingProviders,
        PartyResolve,
        PizzaService
    ]
})
export class KitchenModule {
}