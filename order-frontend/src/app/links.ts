import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanActivateFn, ResolveFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { LinkApi, PartyApi } from './api/api';
import { Link, LinkId, PartyId, PartyOverview } from './api/models';
import { NotificationService } from './shared/notifications';

/** Short links like #/l/ordernow lead to the order page of the party they currently point to. */
export const linkRedirectGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const notifications = inject(NotificationService);
  return inject(LinkApi)
    .findByIdentifier(route.paramMap.get('id')!)
    .pipe(
      map((link) => router.createUrlTree(['/order', link.partyId?.value, link.partyKey])),
      catchError(() => {
        notifications.error('Link konnte nicht aufgelöst werden.');
        return of(false);
      }),
    );
};

export const linksResolver: ResolveFn<Link[]> = () => inject(LinkApi).findAll();

export const partiesResolver: ResolveFn<PartyOverview[]> = () => inject(PartyApi).findAll();

@Component({
  imports: [FormsModule],
  template: `
    <div class="panel panel-default panel-table">
      <table class="table table-condensed">
        <thead>
          <tr>
            <th width="70%">Link</th>
            <th width="30%">Party</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (link of links(); track link.id.value) {
            <tr>
              <td>
                <div class="input-group">
                  <span class="input-group-addon">{{ pagePath }}/#/l/</span>
                  <input
                    type="text"
                    [(ngModel)]="link.identifier"
                    class="form-control"
                    [id]="'identifier_' + link.id.value"
                  />
                  <span class="input-group-btn">
                    <button
                      class="btn btn-default"
                      type="button"
                      title="In die Zwischenablage kopieren"
                      (click)="copy(link)"
                    >
                      <span class="glyphicon glyphicon-copy" aria-hidden="true"></span>
                    </button>
                  </span>
                </div>
              </td>
              <td>
                <div class="btn-group btn-justified dropdown" [class.open]="isOpen(link.id)">
                  <button
                    type="button"
                    class="btn btn-default btn-justified"
                    aria-haspopup="true"
                    [attr.aria-expanded]="isOpen(link.id)"
                    title="Event auswählen"
                    [id]="'dropdown_' + link.id.value"
                    (click)="toggleDropdown(link.id)"
                  >
                    {{ partyName(link.partyId) }}
                  </button>
                  <ul class="dropdown-menu" [attr.aria-labelledby]="'dropdown_' + link.id.value">
                    @for (party of upcomingParties(); track party.id.value) {
                      <li class="dropdown-item">
                        <a (click)="setParty(link, party)" class="pointer">{{ party.name }}</a>
                      </li>
                    }
                  </ul>
                </div>
              </td>
              <td>
                <button
                  (click)="save(link)"
                  type="button"
                  class="btn btn-default"
                  title="Speichern"
                >
                  <span class="glyphicon glyphicon-floppy-disk" aria-hidden="true"></span>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class LinkAdmin {
  readonly links = input.required<Link[]>();
  readonly parties = input.required<PartyOverview[]>();

  private readonly linkApi = inject(LinkApi);
  private readonly notifications = inject(NotificationService);

  protected readonly pagePath = location.origin;
  protected readonly openDropdown = signal<number | null>(null);

  private readonly partiesById = computed(
    () => new Map(this.parties().map((party) => [party.id.value, party])),
  );
  protected readonly upcomingParties = computed(() =>
    this.parties().filter((party) => isUpcoming(party.date)),
  );

  protected partyName(partyId: PartyId | null): string {
    return partyId === null ? '' : (this.partiesById().get(partyId.value)?.name ?? '');
  }

  protected isOpen(linkId: LinkId): boolean {
    return this.openDropdown() === linkId.value;
  }

  protected toggleDropdown(linkId: LinkId): void {
    this.openDropdown.set(this.isOpen(linkId) ? null : linkId.value);
  }

  protected setParty(link: Link, party: PartyOverview): void {
    link.partyId = party.id;
    link.partyKey = party.key;
    this.openDropdown.set(null);
  }

  protected copy(link: Link): void {
    navigator.clipboard.writeText(`${this.pagePath}/#/l/${link.identifier}`);
  }

  protected save(link: Link): void {
    this.linkApi.update(link).subscribe({
      next: () => this.notifications.success('Link erfolgreich gespeichert.'),
      error: () => this.notifications.error('Fehler beim Speichern des Links.'),
    });
  }
}

/** Parties from yesterday on can be selected for a link. */
function isUpcoming(date: string): boolean {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day) >= new Date(Date.now() - 86400000);
}
