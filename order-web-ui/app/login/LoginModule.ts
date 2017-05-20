import {NgModule} from "@angular/core";
import {LoginComponent} from "./LoginComponent";
import {FormsModule} from "@angular/forms";

@NgModule({
    declarations: [
        LoginComponent
    ],
    exports: [
        LoginComponent
    ],
    imports: [
        FormsModule
    ]
})
export class LoginModule {
}