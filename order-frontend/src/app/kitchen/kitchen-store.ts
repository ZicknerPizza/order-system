import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OrderApi, PartyApi } from '../api/api';
import { CondimentId, Order, Party, PartyId, Status, Stove } from '../api/models';
import { AuthService } from '../auth/auth';

const REFRESH_INTERVAL = 15000;

export const STOVE_LABELS: Record<Stove, string> = { go: 'oben', gu: 'unten' };

/** Baking time of a pizza in milliseconds */
export const BAKE_TIME = 4 * 60 * 1000;

/** A done pizza blinks this long in the oven list before it moves to the finished pizzas */
export const DONE_BLINK_TIME = 1800;

/** Milliseconds until the pizza of this order is done, 0 when it can be taken out */
export function remainingBakeTime(order: Order, now: number): number {
  if (order.timeStove === null) {
    return 0;
  }
  return Math.max(new Date(order.timeStove).getTime() + BAKE_TIME - now, 0);
}

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
  private readonly partyApi = inject(PartyApi);
  private readonly auth = inject(AuthService);

  /** Service takes orders but does not bake, the backend checks this as well */
  readonly canBake = () => this.auth.hasRole('KITCHEN');
  private partyId: PartyId | null = null;

  readonly orders = signal<Order[]>([]);

  /** Condiments that ran out, they can't be ordered until available again */
  readonly soldOut = signal<CondimentId[]>([]);

  /** Order taken over into the order form, wrapped so copying the same order twice fills it again */
  readonly orderToCopy = signal<{ order: Order } | null>(null);

  readonly open = this.withStatus('INACTIVE', 'WAITING');
  readonly waiting = this.withStatus('WAITING');
  readonly topping = this.withStatus('TOPPING');
  readonly baking = this.withStatus('BAKING');
  readonly eating = this.withStatus('EATING');

  /** Current time, ticking every second for the oven clocks */
  readonly now = signal(Date.now());

  /** Pizza in each oven compartment, null when it is free */
  readonly compartments = computed(() => {
    const pizzas = toPizzas(this.baking());
    const inCompartment = (stove: Stove) =>
      pizzas.find((pizza) => pizza.order1.stove === stove) ?? null;
    return { go: inCompartment('go'), gu: inCompartment('gu') };
  });

  /** Orders that are being taken out of the oven, so the clock doesn't send them twice */
  private readonly takingOut = new Set<string>();

  constructor() {
    const refresh = setInterval(() => this.refresh(), REFRESH_INTERVAL);
    const clock = setInterval(() => {
      this.now.set(Date.now());
      this.takeOutBakedPizzas();
    }, 1000);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(refresh);
      clearInterval(clock);
    });
  }

  async bake(pizza: Pizza, stove: Stove): Promise<void> {
    await this.changeStatus(pizzaOrders(pizza), 'BAKING', stove);
  }

  /**
   * Pizzas are done after BAKE_TIME, the kitchen takes them out, not the backend. When another
   * kitchen page was faster the backend rejects the change, which only needs a refresh.
   */
  private async takeOutBakedPizzas(): Promise<void> {
    if (!this.canBake()) {
      return;
    }
    const baked = this.baking().filter(
      (order) =>
        !this.takingOut.has(order.orderId.value) &&
        remainingBakeTime(order, this.now() - DONE_BLINK_TIME) === 0,
    );
    if (baked.length === 0) {
      return;
    }
    baked.forEach((order) => this.takingOut.add(order.orderId.value));
    try {
      await this.changeStatus(baked, 'EATING');
    } catch {
      await this.refresh();
    } finally {
      baked.forEach((order) => this.takingOut.delete(order.orderId.value));
    }
  }

  init(party: Party): void {
    this.partyId = party.id;
    this.soldOut.set(party.soldOut);
    this.refresh();
  }

  /** Other kitchen pages may have marked condiments as sold out meanwhile */
  async refresh(): Promise<void> {
    if (this.partyId === null) {
      return;
    }
    const [orders, party] = await Promise.all([
      firstValueFrom(this.orderApi.findForParty(this.partyId)),
      firstValueFrom(this.partyApi.findOne(this.partyId.value)),
    ]);
    this.orders.set(orders);
    this.soldOut.set(party.soldOut);
  }

  async setSoldOut(condimentId: CondimentId, soldOut: boolean): Promise<void> {
    await firstValueFrom(this.partyApi.setSoldOut(this.partyId!, condimentId, soldOut));
    await this.refresh();
  }

  /** Fills the order form with name and condiments, so the order can be changed and ordered again. */
  copyToForm(order: Order): void {
    this.orderToCopy.set({ order });
  }

  /** Orders the same pizza again, so a single remaining order can be baked as a whole pizza. */
  async copy(order: Order): Promise<void> {
    await firstValueFrom(
      this.orderApi.orderAsAdmin(this.partyId!, {
        orderId: { value: crypto.randomUUID() },
        name: order.name,
        comment: order.comment ?? '',
        condiments: order.condiments,
        status: 'WAITING',
      }),
    );
    await this.refresh();
  }

  async changeStatus(orders: Order[], status: Status, stove?: Stove): Promise<void> {
    await firstValueFrom(
      this.orderApi.changeStatus(
        this.partyId!,
        orders.map((order) => order.orderId),
        status,
        stove,
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
