import {ModuleWithProviders} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {KitchenComponent} from "./KitchenComponent";
import {PartyResolve} from "./_internal/PartyResolve";
import {CondimentResolve} from "../_internal/component/condiment/CondimentResolve";

const KitchenRoutes: Routes = [
    {
        path: 'kitchen/:id',
        component: KitchenComponent,
        resolve: {
            party: PartyResolve,
            condiments: CondimentResolve
        }
    }
];

export const KitchenRoutingProviders: any[] = [];

export const KitchenRouting: ModuleWithProviders = RouterModule.forChild(KitchenRoutes);