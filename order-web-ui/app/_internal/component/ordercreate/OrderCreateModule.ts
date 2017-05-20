import {NgModule} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {OrderCreateComponent} from "./OrderCreateComponent";
import {CondimentModule} from "../condiment/CondimentModule";

@NgModule({
    declarations: [
        OrderCreateComponent
    ],
    exports: [
        OrderCreateComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        CondimentModule
    ]
})
export class OrderCreateModule {
}