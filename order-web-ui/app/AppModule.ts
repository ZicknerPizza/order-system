import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";
import {AppComponent} from "./AppComponent";
import {NavigationComponent} from "./_internal/navigation/NavigationComponent";
import {AppRouting, AppRoutingProviders} from "./AppRouting";
import {FormsModule} from "@angular/forms";
import {ApiModule} from "./_internal/api/ApiModule";
import {NotificationModule} from "./_internal/component/notification/NotificationModule";
import {LoginModule} from "./login/LoginModule";
import {GeneralModule} from "./general/GeneralModule";
import {PartyModule} from "./event/PartyModule";
import {KitchenModule} from "./kitchen/KitchenModule";
import {LinkModule} from "./link/LinkModule";
import {AuthenticationModule} from "./_internal/authentication/AuthenticationModule";
import {OrderModule} from "./order/OrderModule";
import {HashLocationStrategy, LocationStrategy} from "@angular/common";
import {HttpClientModule} from "@angular/common/http";

@NgModule({
    declarations: [
        AppComponent,
        NavigationComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        FormsModule,
        AppRouting,
        ApiModule.forRoot(),
        AuthenticationModule.forRoot(),
        NotificationModule.forRoot(),
        LoginModule,
        GeneralModule,
        PartyModule,
        KitchenModule,
        LinkModule,
        OrderModule
    ],
    providers: [
        AppRoutingProviders,
        {provide: LocationStrategy, useClass: HashLocationStrategy}
    ],
    bootstrap: [
        AppComponent
    ]
})
export class PizzaModule {

    ngDoBootstrap() {
    }

}