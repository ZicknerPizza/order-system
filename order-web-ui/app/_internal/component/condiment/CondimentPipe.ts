import {Pipe, PipeTransform} from "@angular/core";
import {CondimentId} from "../../api/CondimentRestService";

@Pipe({
    name: "condiment"
})
export class CondimentPipe implements PipeTransform {


    transform(condimentId: CondimentId, ...args: Array<CondimentId>): CondimentId {
        return condimentId;
    }
}