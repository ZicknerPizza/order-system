import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {HttpModule} from "@angular/http";
import {FormsModule} from "@angular/forms";
import {PartyEditComponent} from "./PartyEditComponent";
import {PartyListComponent} from "./PartyListComponent";
import {PartyRouting, PartyRoutingProviders} from "./PartyRouting";
import {PartysResolve} from "./_internal/PartysResolve";
import {PartyResolve} from "./_internal/PartyResolve";
import {CondimentStatisticChartComponent} from "./_internal/CondimentStatisticChartComponent";
import {CondimentsStatisticResolve} from "./_internal/CondimentStatisticResolve";
import {OrdersResolve} from "./_internal/OrdersResolve";

@NgModule({
    declarations: [
        PartyEditComponent,
        PartyListComponent,
        CondimentStatisticChartComponent
    ],
    imports: [
        PartyRouting,
        CommonModule,
        FormsModule,
        HttpModule
    ],
    providers: [
        PartyRoutingProviders,
        PartysResolve,
        PartyResolve,
        OrdersResolve,
        CondimentsStatisticResolve
    ],
    exports: [
        CondimentStatisticChartComponent
    ]
})
export class PartyModule {
}