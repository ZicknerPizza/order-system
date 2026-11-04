import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OrderApi } from '../api/api';
import { Order, PartyId, Status } from '../api/models';

const REFRESH_INTERVAL = 15000;

/** Two orders are baked together as one pizza. */
export interface Pizza {
  order1: Order;
  order2: Order | null;
}

/**
 * Orders of the party shown in the kitchen, polled from the backend. Provided per kitchen page.
 */
@Injectable()
export class KitchenStore {
  private readonly orderApi = inject(OrderApi);
  private partyId: PartyId | null = null;

  readonly orders = signal<Order[]>([]);

  readonly open = this.withStatus('INACTIVE', 'WAITING');
  readonly waiting = this.withStatus('WAITING');
  readonly topping = this.withStatus('TOPPING');
  readonly baking = this.withStatus('BAKING');
  readonly eating = this.withStatus('EATING');

  constructor() {
    const interval = setInterval(() => this.refresh(), REFRESH_INTERVAL);
    inject(DestroyRef).onDestroy(() => clearInterval(interval));
  }

  init(partyId: PartyId): void {
    this.partyId = partyId;
    this.refresh();
  }

  async refresh(): Promise<void> {
    if (this.partyId !== null) {
      this.orders.set(await firstValueFrom(this.orderApi.findForParty(this.partyId)));
    }
  }

  async changeStatus(orders: Order[], status: Status): Promise<void> {
    await firstValueFrom(
      this.orderApi.changeStatus(
        this.partyId!,
        orders.map((order) => order.orderId),
        status,
      ),
    );
    await this.refresh();
  }

  async delete(order: Order): Promise<void> {
    await firstValueFrom(this.orderApi.delete(this.partyId!, order.orderId));
    await this.refresh();
  }

  private withStatus(...status: Status[]) {
    return computed(() => this.orders().filter((order) => status.includes(order.status)));
  }
}

/** Groups orders by the pizza id the backend assigns to two orders from TOPPING on. */
export function toPizzas(orders: Order[]): Pizza[] {
  const pizzas = new Map<string, Pizza>();
  for (const order of orders) {
    const pizzaId = order.pizzaId?.value ?? order.orderId.value;
    const pizza = pizzas.get(pizzaId);
    if (pizza) {
      pizza.order2 = order;
    } else {
      pizzas.set(pizzaId, { order1: order, order2: null });
    }
  }
  return [...pizzas.values()];
}

export function pizzaOrders(pizza: Pizza): Order[] {
  return pizza.order2 === null ? [pizza.order1] : [pizza.order1, pizza.order2];
}
