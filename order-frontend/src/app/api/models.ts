/** Ids are serialized as {"value": ...} by the backend. */
export interface Id<T> {
  value: T;
}

export type CondimentId = Id<number>;
export type PartyId = Id<string>;
export type OrderId = Id<string>;
export type PizzaId = Id<string>;
export type LinkId = Id<number>;

export interface Condiment {
  id: CondimentId;
  category: string;
  name: string;
  unit: string;
  /** Set by admins for the shopping list, null falls back to the statistic */
  amountPerPizza: number | null;
}

/** Minimum, average and maximum amount per pizza. */
export type StatisticValues = [number, number, number];

export interface Statistic {
  greater: StatisticValues | null;
  match: StatisticValues | null;
  less: StatisticValues | null;
}

export interface CondimentStatistic {
  id: CondimentId;
  percentageOfOrders: number;
  statistic: Statistic;
}

export interface PartyOverview {
  id: PartyId;
  name: string;
  key: string;
  /** yyyy-MM-dd */
  date: string;
}

export interface Party extends PartyOverview {
  estimatedNumberOfPizzas: number;
  blendStatistics: number;
  condiments: CondimentId[];
  /** Ran out during the party, can't be ordered until available again */
  soldOut: CondimentId[];
  /** Saved amounts and ratings, only included for logged in users */
  condimentCalculation?: PartyCondiment[];
}

export type Rating = 'NOT_ENOUGH' | 'ENOUGH' | 'TO_MUCH';

export interface PartyCondiment {
  condimentId: CondimentId;
  amount: number | null;
  rating: Rating | null;
}

export interface PartySave {
  name: string;
  date: string;
  estimatedNumberOfPizzas: number;
  blendStatistics: number;
  condiments: PartyCondiment[];
}

export interface PartyCreate extends PartySave {
  id: PartyId;
  key: string;
}

export type Status = 'INACTIVE' | 'WAITING' | 'TOPPING' | 'BAKING' | 'EATING' | 'DELETED';

/** Oven compartment: upper (go) or lower (gu) */
export type Stove = 'go' | 'gu';

export interface Order {
  orderId: OrderId;
  /** Shared by the two orders that are baked as one pizza, only set from TOPPING on. */
  pizzaId: PizzaId | null;
  partyId: PartyId;
  name: string;
  comment: string | null;
  /** yyyy-MM-ddTHH:mm:ss in local time */
  date: string | null;
  timeStove: string | null;
  stove: Stove | null;
  status: Status;
  condiments: CondimentId[];
}

export interface OrderCreate {
  orderId: OrderId;
  name: string;
  comment: string;
  condiments: CondimentId[];
  status: Status;
}

export interface Link {
  id: LinkId;
  identifier: string;
  partyId: PartyId | null;
  partyKey: string | null;
}

/** SERVICE takes orders, KITCHEN also bakes and manages parties, ADMIN also manages users */
export type Role = 'ADMIN' | 'KITCHEN' | 'SERVICE';

export interface CurrentUser {
  name: string;
  role: Role;
  /** Logs in with a code of an authenticator app as second factor */
  totp: boolean;
}

export interface Session extends CurrentUser {
  token: string;
}

export interface User {
  id: number;
  name: string;
  /** null for deactivated users of the old systems */
  role: Role | null;
  totp: boolean;
}

export interface TotpSetup {
  /** base32, for typing it into the app instead of scanning */
  secret: string;
  /** otpauth:// link shown as QR code */
  uri: string;
}

export interface UserCreate {
  name: string;
  role: Role;
  password: string;
}

/** Person and address of the imprint, configured in the backend */
export interface Imprint {
  name: string;
  address: string[];
  email: string | null;
  phone: string | null;
}

export function hasId<T>(ids: Id<T>[], search: Id<T>): boolean {
  return ids.some((id) => id.value === search.value);
}
