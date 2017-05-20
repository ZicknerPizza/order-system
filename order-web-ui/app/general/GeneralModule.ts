import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {AboutUsComponent} from "./AboutUsComponent";
import {HistoryComponent} from "./HistoryComponent";
import {StatisticComponent} from "./StatisticComponent";
import {ImprintComponent} from "./ImprintComponent";
import {GeneralRouting, GeneralRoutingProviders} from "./GeneralRouting";

@NgModule({
    declarations: [
        AboutUsComponent,
        HistoryComponent,
        StatisticComponent,
        ImprintComponent
    ],
    imports: [
        GeneralRouting,
        CommonModule
    ],
    providers: [
        GeneralRoutingProviders
    ]
})
export class GeneralModule {
}