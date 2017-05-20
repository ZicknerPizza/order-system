import {RouterModule, Routes} from "@angular/router";
import {AboutUsComponent} from "./AboutUsComponent";
import {HistoryComponent} from "./HistoryComponent";
import {StatisticComponent} from "./StatisticComponent";
import {ImprintComponent} from "./ImprintComponent";
import {ModuleWithProviders} from "@angular/core";

const GeneralRoutes: Routes = [
    {path: 'general/aboutUs', component: AboutUsComponent},
    {path: 'general/history', component: HistoryComponent},
    {path: 'general/statistic', component: StatisticComponent},
    {path: 'general/imprint', component: ImprintComponent}
];

export const GeneralRoutingProviders: any[] = [];

export const GeneralRouting: ModuleWithProviders = RouterModule.forChild(GeneralRoutes);