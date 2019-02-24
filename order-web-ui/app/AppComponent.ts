import {Component, OnInit} from "@angular/core";

@Component({
    selector: 'pizza-app',
    templateUrl: './App.html',
    providers: []
})
export class AppComponent implements OnInit {

    private lastExpand: boolean = false;

    ngOnInit(): void {
    }
}