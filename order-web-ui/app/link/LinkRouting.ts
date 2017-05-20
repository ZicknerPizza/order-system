import {RouterModule, Routes} from "@angular/router";
import {LinkComponent} from "./LinkComponent";
import {LinkResolve} from "./_internal/LinkResolve";
import {ModuleWithProviders} from "@angular/core";
import {LinkAdminComponent} from "./LinkAdminComponent";
import {LinksResolve} from "./_internal/LinksResolve";
import {AuthenticationGuard} from "../_internal/authentication/AuthenticationGuard";
import {PartysResolve} from "./_internal/PartysResolve";

const LinkRoutes: Routes = [
    {
        path: 'links',
        component: LinkAdminComponent,
        resolve: {
            links: LinksResolve,
            partys: PartysResolve
        },
        canActivate: [AuthenticationGuard]
    },
    {
        path: 'l/:id',
        component: LinkComponent,
        resolve: {
            link: LinkResolve
        }
    }
];

export const LinkRoutingProviders: any[] = [];

export const LinkRouting: ModuleWithProviders = RouterModule.forChild(LinkRoutes);