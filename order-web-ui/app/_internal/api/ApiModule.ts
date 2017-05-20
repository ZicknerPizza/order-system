import {ModuleWithProviders, NgModule} from "@angular/core";
import {CondimentRestService} from "./CondimentRestService";
import {LinkRestService} from "./LinkRestService";
import {OrderRestService} from "./OrderRestService";
import {PartyRestService} from "./PartyRestService";

@NgModule()
export class ApiModule {
    ngDoBootstrap() {

    }

    public static forRoot(): ModuleWithProviders {
        return {
            ngModule: ApiModule,
            providers: [
                CondimentRestService,
                LinkRestService,
                OrderRestService,
                PartyRestService
            ]
        };
    }
}