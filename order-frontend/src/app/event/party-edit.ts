import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResolveFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CondimentApi, OrderApi, PartyApi } from '../api/api';
import {
  Condiment,
  CondimentStatistic,
  hasId,
  Order,
  Party,
  PartyCondiment,
  PartySave,
  Rating,
} from '../api/models';
import { AuthService, backendMessage } from '../auth/auth';
import { CondimentCatalog, groupByCategory } from '../shared/condiments';
import { NotificationService } from '../shared/notifications';
import { EventTabs } from './event-tabs';
import { PartyCalculation } from './statistic';

/** Editable state of one condiment row, kept apart from the shared condiment list. */
interface CondimentRow extends Condiment {
  active: boolean;
  amount: string;
  /** Ratings are no longer given, saved ones of past parties are kept */
  rating: Rating | null;
}

@Component({
  imports: [FormsModule, DatePipe, DecimalPipe, EventTabs],
  templateUrl: './party-edit.html',
})
export class PartyEdit implements OnInit {
  readonly party = input<Party>();
  readonly orders = input<Order[]>([]);
  readonly condiments = input.required<Condiment[]>();
  readonly statistics = input.required<CondimentStatistic[]>();

  private readonly partyApi = inject(PartyApi);
  private readonly condimentApi = inject(CondimentApi);
  private readonly catalog = inject(CondimentCatalog);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly calculation = computed(
    () => new PartyCalculation(this.statistics(), this.orders()),
  );

  /** Form model, initialized from the loaded party */
  protected model = {
    name: '',
    date: '',
    estimatedNumberOfPizzas: 0,
    blendStatistics: 50,
  };
  protected categories: [string, CondimentRow[]][] = [];

  /** The amount per pizza applies to all parties, so only admins change it */
  protected readonly canEditAmountPerPizza = inject(AuthService).hasRole('ADMIN');

  ngOnInit(): void {
    const party = this.party();
    if (party) {
      this.model = {
        name: party.name,
        date: party.date,
        estimatedNumberOfPizzas: party.estimatedNumberOfPizzas,
        blendStatistics: party.blendStatistics,
      };
    }
    const calculation = new Map(
      (party?.condimentCalculation ?? [])
        .filter((condiment) => condiment.condimentId !== null)
        .map((condiment) => [condiment.condimentId.value, condiment]),
    );
    const rows: CondimentRow[] = this.condiments().map((condiment) => {
      const saved = calculation.get(condiment.id.value);
      return {
        ...condiment,
        active: party !== undefined && hasId(party.condiments, condiment.id),
        amount: saved?.amount == null ? '' : String(saved.amount),
        rating: saved?.rating ?? null,
      };
    });
    this.categories = groupByCategory(rows);
  }

  protected changeEstimatedNumberOfPizzas(change: number): void {
    this.model.estimatedNumberOfPizzas = Math.max(
      (Number(this.model.estimatedNumberOfPizzas) || 0) + change,
      0,
    );
  }

  /** Saved right away, it does not belong to this party. An empty field falls back to the statistic. */
  protected async saveAmountPerPizza(row: CondimentRow, value: string): Promise<void> {
    const amountPerPizza = parseAmount(value);
    try {
      await firstValueFrom(this.condimentApi.setAmountPerPizza(row.id, amountPerPizza));
      row.amountPerPizza = amountPerPizza;
      this.catalog.setAmountPerPizza(row.id, amountPerPizza);
      // The rows are plain objects, without signals the calculation is not refreshed by itself
      this.changeDetector.markForCheck();
      this.notifications.success(`Menge je Pizza für ${row.name} gespeichert.`);
    } catch (error) {
      this.notifications.error(
        backendMessage(error, 'Die Menge je Pizza konnte nicht gespeichert werden.'),
      );
    }
  }

  protected orderLabel(order: Order): string {
    return order.comment ? `${order.name}: ${order.comment}` : order.name;
  }

  protected percentage(row: CondimentRow): number {
    return this.calculation().percentage(row, Number(this.model.blendStatistics));
  }

  protected amountCalculated(row: CondimentRow): number {
    return this.calculation().amountCalculated(
      row,
      Number(this.model.blendStatistics),
      Number(this.model.estimatedNumberOfPizzas) || 0,
    );
  }

  protected print(): void {
    window.print();
  }

  protected save(): void {
    const data: PartySave = {
      name: this.model.name,
      date: this.model.date,
      estimatedNumberOfPizzas: Number(this.model.estimatedNumberOfPizzas) || 0,
      blendStatistics: Number(this.model.blendStatistics),
      condiments: this.categories
        .flatMap(([, rows]) => rows)
        .filter((row) => row.active)
        .map((row): PartyCondiment => ({
          condimentId: row.id,
          amount: parseAmount(row.amount),
          rating: row.rating,
        })),
    };

    const party = this.party();
    const result = party
      ? this.partyApi.update(party.id, data)
      : this.partyApi.create({
          ...data,
          id: { value: crypto.randomUUID() },
          key: crypto.randomUUID().substring(0, 8),
        });

    result.subscribe({
      next: async () => {
        this.notifications.success('Erfolgreich gespeichert');
        await this.router.navigate(['/event/list']);
        window.scrollTo(0, 0);
      },
      error: () => this.notifications.error('Speichern fehlgeschlagen'),
    });
  }
}

function parseAmount(amount: string): number | null {
  const value = parseFloat(String(amount).replace(',', '.'));
  return Number.isNaN(value) ? null : value;
}

export const partyResolver: ResolveFn<Party> = (route) =>
  inject(PartyApi).findOne(route.paramMap.get('partyId')!);

export const ordersResolver: ResolveFn<Order[]> = (route) =>
  inject(OrderApi).findForParty({ value: route.paramMap.get('partyId')! });
