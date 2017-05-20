import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {LinkComponent} from "./LinkComponent";
import {LinkRouting, LinkRoutingProviders} from "./LinkRouting";
import {LinkAdminComponent} from "./LinkAdminComponent";
import {LinkResolve} from "./_internal/LinkResolve";
import {LinksResolve} from "./_internal/LinksResolve";
import {PartysResolve} from "./_internal/PartysResolve";
import {ClipboardModule} from "ngx-clipboard";

@NgModule({
    declarations: [
        LinkComponent,
        LinkAdminComponent
    ],
    imports: [
        LinkRouting,
        CommonModule,
        FormsModule,
        ClipboardModule
    ],
    providers: [
        LinkRoutingProviders,
        LinkResolve,
        LinksResolve,
        PartysResolve
    ]
})
export class LinkModule {
}