import "zone.js";
import "reflect-metadata";
import "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap";
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {PizzaModule} from "./AppModule";
import {enableProdMode} from "@angular/core";

require('./app.css');
require('./print.css');

if (process.env.NODE_ENV == "production") {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(PizzaModule);