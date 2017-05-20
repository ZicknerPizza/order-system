import "zone.js";
import "reflect-metadata";
import "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap";
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {PizzaModule} from "./AppModule";

require('./app.css');
require('./print.css');

platformBrowserDynamic().bootstrapModule(PizzaModule);