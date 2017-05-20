import {RouterModule, Routes} from "@angular/router";
import {ModuleWithProviders} from "@angular/core";
import {PartyListComponent} from "./PartyListComponent";
import {PartyEditComponent} from "./PartyEditComponent";
import {AuthenticationGuard} from "../_internal/authentication/AuthenticationGuard";
import {PartysResolve} from "./_internal/PartysResolve";
import {PartyResolve} from "./_internal/PartyResolve";
import {CondimentResolve} from "../_internal/component/condiment/CondimentResolve";
import {CondimentsStatisticResolve} from "./_internal/CondimentStatisticResolve";
import {OrdersResolve} from "./_internal/OrdersResolve";

const PartyRoutes: Routes = [
    {
        path: 'event/list',
        component: PartyListComponent,
        canActivate: [AuthenticationGuard],
        resolve: {
            partys: PartysResolve
        }
    },
    {
        path: 'event/edit',
        component: PartyEditComponent,
        canActivate: [AuthenticationGuard],
        resolve: {
            condiments: CondimentResolve,
            condimentsStatistic: CondimentsStatisticResolve
        }
    },
    {
        path: 'event/edit/:partyId',
        component: PartyEditComponent,
        canActivate: [AuthenticationGuard],
        resolve: {
            party: PartyResolve,
            condiments: CondimentResolve,
            orders: OrdersResolve,
            condimentsStatistic: CondimentsStatisticResolve
        }
    }
];

export const PartyRoutingProviders: any[] = [];

export const PartyRouting: ModuleWithProviders = RouterModule.forChild(PartyRoutes);