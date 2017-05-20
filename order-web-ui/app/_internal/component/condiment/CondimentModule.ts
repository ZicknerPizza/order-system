import {ModuleWithProviders, NgModule} from "@angular/core";
import {CondimentComponent} from "./CondimentComponent";
import {CondimentService} from "./CondimentService";
import {CondimentPipe} from "./CondimentPipe";
import {CondimentResolve} from "./CondimentResolve";

@NgModule({
    declarations: [
        CondimentComponent,
        CondimentPipe
    ],
    providers: [
        CondimentService
    ],
    exports: [
        CondimentComponent,
        CondimentPipe
    ]
})
export class CondimentModule {

    public static forRoot(): ModuleWithProviders {
        return {
            ngModule: CondimentModule,
            providers: [
                CondimentResolve
            ]
        }
    }

}