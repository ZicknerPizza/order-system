import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PartyOverview } from '../api/models';
import { EventTabs } from './event-tabs';

@Component({
  imports: [DatePipe, RouterLink, EventTabs],
  template: `
    <app-event-tabs active="list" />
    <div class="panel panel-default panel-table">
      <table class="table table-condensed">
        <thead>
          <tr>
            <th>Event</th>
            <th class="td_center">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          @for (party of parties(); track party.id.value) {
            <tr>
              <td>
                <div class="row">
                  <div class="col-md-8">{{ party.name }}</div>
                  <div class="col-md-4">
                    {{ party.date | date: 'dd.MM.yyyy' }} | Key:
                    <a [routerLink]="['/order', party.id.value, party.key]">{{ party.key }}</a>
                  </div>
                </div>
              </td>
              <td class="td_center">
                <a [routerLink]="['/event/edit', party.id.value]"
                  ><span class="glyphicon glyphicon-pencil margin-right" aria-hidden="true"></span
                ></a>
                <a [routerLink]="['/kitchen', party.id.value]"
                  ><span class="glyphicon glyphicon-circle-arrow-right" aria-hidden="true"></span
                ></a>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class PartyList {
  readonly parties = input.required<PartyOverview[]>();
}
