import {CommonModule} from "@angular/common";
import {ModuleWithProviders, NgModule} from "@angular/core";
import {NotificationService} from "./NotificationService";
import {NotificationComponent} from "./NotificationComponent";

@NgModule({
    declarations: [
        NotificationComponent
    ],
    imports: [
        CommonModule
    ],
    exports: [
        NotificationComponent
    ]
})
export class NotificationModule {

    public static forRoot(): ModuleWithProviders {
        return {
            ngModule: NotificationModule,
            providers: [
                NotificationService
            ]
        };
    }
}