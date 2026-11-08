import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderApi } from '../api/api';
import { Condiment, CondimentId, hasId, Order, Party, Status } from '../api/models';
import { backendMessage } from '../auth/auth';
import { BASE_CATEGORY, groupByCategory } from './condiments';
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
                  <li class="list-group-item" [class.has-error]="nameMissing()">
                    <input
                      #nameInput
                      type="text"
                      class="form-control"
                      placeholder="Name"
                      required
                      [(ngModel)]="name"
                      (ngModelChange)="nameMissing.set(false)"
                      name="name"
                    />
                    @if (nameMissing()) {
                      <span class="help-block" style="margin-bottom: 0">
                        Bitte gib deinen Namen ein.
                      </span>
                    }
                  </li>
                  @for (category of categories(); track category[0]) {
                    <li class="list-group-item">
                      <h3>{{ category[0] }}</h3>
                      @for (condiment of category[1]; track condiment.id.value) {
                        @let soldOut = isSoldOut(condiment.id);
                        <div [class.text-muted]="soldOut">
                          <input
                            type="checkbox"
                            id="condiment.order{{ condiment.id.value }}"
                            name="condiment.order{{ condiment.id.value }}"
                            [disabled]="soldOut"
                            [ngModel]="selected[condiment.id.value]"
                            (ngModelChange)="select(condiment, $event)"
                          />
                          <label for="condiment.order{{ condiment.id.value }}">
                            {{ condiment.name }}
                            @if (soldOut) {
                              (leer)
                            }
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
  /** Order whose name and condiments are taken over into the form */
  readonly template = input<{ order: Order } | null>(null);
  /** Ran out during the party, shown but can't be ordered */
  readonly soldOut = input<CondimentId[]>([]);
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
  protected readonly nameMissing = signal(false);
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  constructor() {
    effect(() => {
      const template = this.template();
      if (template === null) {
        return;
      }
      this.name = template.order.name;
      this.comment = '';
      // Only condiments that are still offered, others would be ordered without being visible
      this.selected = {};
      template.order.condiments
        .filter((condiment) => hasId(untracked(this.party).condiments, condiment))
        .filter((condiment) => !untracked(() => this.isSoldOut(condiment)))
        .forEach((condimentId) => {
          // Old orders may have two bases, the first one is kept
          const condiment = untracked(this.condiments).find(
            (c) => c.id.value === condimentId.value,
          );
          if (condiment) {
            this.select(condiment, true, false);
          }
        });
      this.show.set(true);
      scrollTo(0, 0);
    });
  }

  /** A base replaces the base chosen before, like a radio button that can be unticked */
  protected select(condiment: Condiment, selected: boolean, replaceBase = true): void {
    const isBase = condiment.category === BASE_CATEGORY;
    if (selected && isBase) {
      const otherBase = this.bases().find(
        (base) => base.id.value !== condiment.id.value && this.selected[base.id.value],
      );
      if (otherBase && !replaceBase) {
        return;
      }
      if (otherBase) {
        this.selected[otherBase.id.value] = false;
      }
    }
    this.selected[condiment.id.value] = selected;
  }

  /** Bases offered at the party */
  private readonly bases = computed(() =>
    this.condiments().filter(
      (condiment) =>
        condiment.category === BASE_CATEGORY && hasId(this.party().condiments, condiment.id),
    ),
  );

  protected isSoldOut(condimentId: CondimentId): boolean {
    return hasId(this.soldOut(), condimentId);
  }

  protected sendOrder(): void {
    // The backend rejects orders without a name, which used to show the connection error
    const name = this.name.trim();
    if (name === '') {
      this.nameMissing.set(true);
      this.nameInput()?.nativeElement.focus();
      return;
    }
    const available = this.bases().filter((base) => !this.isSoldOut(base.id));
    const withBase = available.some((base) => this.selected[base.id.value]);
    if (
      available.length > 0 &&
      !withBase &&
      !window.confirm(
        `Du hast keine Basis wie ${available[0].name} gewählt. Möchtest du die Pizza trotzdem so bestellen?`,
      )
    ) {
      return;
    }
    const party = this.party();
    const condiments: CondimentId[] = Object.entries(this.selected)
      .filter(([, selected]) => selected)
      .map(([condimentId]): CondimentId => ({ value: Number(condimentId) }))
      // Ticked before the kitchen marked it as sold out
      .filter((condiment) => !this.isSoldOut(condiment));
    // Orders before the party are pre-orders, the kitchen activates them on the day
    const status: Status = isToday(party.date) ? 'WAITING' : 'INACTIVE';

    this.orderApi
      .order(party.id, party.key, {
        orderId: { value: crypto.randomUUID() },
        name,
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
        error: (error: unknown) => {
          this.notifications.error(
            backendMessage(
              error,
              'Es ist ein Fehler bei der Bestellung aufgetreten, bitte überprüfe ' +
                'deine Internetverbindung und probiere es später nocheinmal.',
            ),
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
