import {ModuleWithProviders} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {LoginComponent} from "./login/LoginComponent";
import {GeneralModule} from "./general/GeneralModule";
import {PartyModule} from "./event/PartyModule";
import {KitchenModule} from "./kitchen/KitchenModule";
import {AuthenticationGuard} from "./_internal/authentication/AuthenticationGuard";
import {OrderModule} from "./order/OrderModule";
import {LinkModule} from "./link/LinkModule";

const AppRoutes: Routes = [
    {path: 'general', loadChildren: () => GeneralModule},
    {path: 'login', component: LoginComponent},
    {path: 'order', loadChildren: () => OrderModule},
    {path: 'links', loadChildren: () => LinkModule},
    {path: 'l', loadChildren: () => LinkModule},
    {
        path: 'event',
        loadChildren: () => PartyModule,
        canActivate: [AuthenticationGuard],
        canActivateChild: [AuthenticationGuard]
    },
    {path: 'kitchen', loadChildren: () => KitchenModule, canActivate: [AuthenticationGuard]},
    {path: '', redirectTo: 'general/aboutUs', pathMatch: 'full'}
];

export const AppRoutingProviders: any[] = [];

export const AppRouting: ModuleWithProviders = RouterModule.forRoot(AppRoutes);