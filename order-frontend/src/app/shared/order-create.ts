import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderApi } from '../api/api';
import { Condiment, CondimentId, hasId, Party, Status } from '../api/models';
import { groupByCategory } from './condiments';
import { NotificationService } from './notifications';

@Component({
  selector: 'app-order-create',
  imports: [FormsModule],
  template: `
    <div class="panel panel-default">
      <div
        (click)="show.set(!show())"
        [class.panel-heading-standalone]="!isOpen()"
        class="panel-heading panel-expand"
      >
        <h3 class="panel-title">{{ title() }}</h3>
      </div>
      <ul class="list-group">
        @if (isOpen()) {
          <li class="list-group-item">
            <div class="row row-standalone">
              <form (ngSubmit)="sendOrder()">
                <ul class="list-group showCondiment" style="margin-bottom: 0">
                  <li class="list-group-item">
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Name"
                      required
                      [(ngModel)]="name"
                      name="name"
                    />
                  </li>
                  @for (category of categories(); track category[0]) {
                    <li class="list-group-item">
                      <h3>{{ category[0] }}</h3>
                      @for (condiment of category[1]; track condiment.id.value) {
                        <div>
                          <input
                            type="checkbox"
                            id="condiment.order{{ condiment.id.value }}"
                            name="condiment.order{{ condiment.id.value }}"
                            [(ngModel)]="selected[condiment.id.value]"
                          />
                          <label for="condiment.order{{ condiment.id.value }}">
                            {{ condiment.name }}
                          </label>
                        </div>
                      }
                    </li>
                  }
                  <li class="list-group-item">
                    <textarea
                      class="form-control custom-control"
                      rows="2"
                      style="resize: none"
                      placeholder="Kommentar, Unverträglichkeiten ..."
                      [(ngModel)]="comment"
                      name="comment"
                    ></textarea>
                    <button
                      type="submit"
                      class="btn btn-default"
                      style="width: 100%; margin-top: 10px"
                    >
                      Pizza wünschen
                    </button>
                  </li>
                </ul>
              </form>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
})
export class OrderCreateForm {
  readonly title = input.required<string>();
  readonly party = input.required<Party>();
  readonly condiments = input.required<Condiment[]>();
  readonly alwaysOpen = input(false);
  readonly ordered = output<void>();

  private readonly orderApi = inject(OrderApi);
  private readonly notifications = inject(NotificationService);

  protected readonly show = signal(false);
  protected readonly isOpen = computed(() => this.show() || this.alwaysOpen());
  protected readonly categories = computed(() =>
    groupByCategory(
      this.condiments().filter((condiment) => hasId(this.party().condiments, condiment.id)),
    ),
  );

  protected name = '';
  protected comment = '';
  protected selected: Record<number, boolean> = {};

  protected sendOrder(): void {
    const party = this.party();
    const condiments: CondimentId[] = Object.entries(this.selected)
      .filter(([, selected]) => selected)
      .map(([condimentId]) => ({ value: Number(condimentId) }));
    // Orders before the party are pre-orders, the kitchen activates them on the day
    const status: Status = isToday(party.date) ? 'WAITING' : 'INACTIVE';

    this.orderApi
      .order(party.id, party.key, {
        orderId: { value: crypto.randomUUID() },
        name: this.name,
        comment: this.comment,
        condiments,
        status,
      })
      .subscribe({
        next: () => {
          this.name = '';
          this.comment = '';
          this.selected = {};
          this.notifications.success(
            status === 'INACTIVE'
              ? 'Die Pizza wurde erfolgreich vorbestellt.'
              : 'Die Pizza wurde erfolgreich bestellt.',
          );
          this.ordered.emit();
          scrollTo(0, 0);
        },
        error: () => {
          this.notifications.error(
            'Es ist ein Fehler bei der Bestellung aufgetreten, bitte überprüfe ' +
              'deine Internetverbindung und probiere es später nocheinmal.',
          );
          scrollTo(0, 0);
        },
      });
  }
}

/** Compares with the local date, the old frontend used the UTC date and was wrong after midnight. */
export function isToday(date: string, now = new Date()): boolean {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` === date;
}
