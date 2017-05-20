import {ModuleWithProviders} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {OrderPartyResolve} from "./_internal/OrderPartyResolve";
import {OrderComponent} from "./OrderComponent";
import {CondimentResolve} from "../_internal/component/condiment/CondimentResolve";

const OrderRoutes: Routes = [
    {
        path: 'order/:id/:key',
        component: OrderComponent,
        resolve: {
            party: OrderPartyResolve,
            condiments: CondimentResolve
        }
    }
];

export const OrderRoutingProviders: any[] = [];

export const OrderRouting: ModuleWithProviders = RouterModule.forChild(OrderRoutes);