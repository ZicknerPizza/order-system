import {NgModule} from "@angular/core";
import {OrderComponent} from "./OrderComponent";
import {OrderRouting, OrderRoutingProviders} from "./OrderRouting";
import {OrderPartyResolve} from "./_internal/OrderPartyResolve";
import {CommonModule} from "@angular/common";
import {OrderCreateModule} from "../_internal/component/ordercreate/OrderCreateModule";
import {CondimentModule} from "../_internal/component/condiment/CondimentModule";

@NgModule({
    declarations: [
        OrderComponent
    ],
    imports: [
        OrderRouting,
        CommonModule,
        OrderCreateModule,
        CondimentModule.forRoot()
    ],
    providers: [
        OrderRoutingProviders,
        OrderPartyResolve
    ]
})
export class OrderModule {
}