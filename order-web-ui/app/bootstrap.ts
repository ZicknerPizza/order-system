import "zone.js";
import "reflect-metadata";
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {PizzaModule} from "./AppModule";
import {enableProdMode} from "@angular/core";
import {environment} from "./environments/environment";

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(PizzaModule);