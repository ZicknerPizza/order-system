import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Condiment,
  CondimentStatistic,
  Imprint,
  Link,
  LinkId,
  Order,
  OrderCreate,
  OrderId,
  Party,
  PartyCreate,
  PartyId,
  PartyOverview,
  PartySave,
  Status,
  Stove,
  User,
  UserCreate,
} from './models';

@Injectable({ providedIn: 'root' })
export class CondimentApi {
  private readonly http = inject(HttpClient);

  findAll(): Observable<Condiment[]> {
    return this.http.get<Condiment[]>('api/condiments');
  }

  findStatistic(): Observable<CondimentStatistic[]> {
    return this.http.get<CondimentStatistic[]>('api/condiments/statistic');
  }
}

@Injectable({ providedIn: 'root' })
export class PartyApi {
  private readonly http = inject(HttpClient);

  findAll(): Observable<PartyOverview[]> {
    return this.http.get<PartyOverview[]>('api/partys');
  }

  findOne(partyId: string, key?: string): Observable<Party> {
    const path = key === undefined ? partyId : `${partyId}/${key}`;
    return this.http.get<Party>(`api/partys/${path}`);
  }

  create(party: PartyCreate): Observable<void> {
    return this.http.post<void>('api/partys', party);
  }

  update(partyId: PartyId, party: PartySave): Observable<void> {
    return this.http.put<void>(`api/partys/${partyId.value}`, party);
  }
}

@Injectable({ providedIn: 'root' })
export class OrderApi {
  private readonly http = inject(HttpClient);

  findForParty(partyId: PartyId): Observable<Order[]> {
    return this.http.get<Order[]>(`api/orders/${partyId.value}`);
  }

  order(partyId: PartyId, key: string, order: OrderCreate): Observable<void> {
    return this.http.post<void>(`api/orders/${partyId.value}/${key}`, order);
  }

  /** Same as order(), for logged in users without the party key */
  orderAsAdmin(partyId: PartyId, order: OrderCreate): Observable<void> {
    return this.http.post<void>(`api/orders/${partyId.value}`, order);
  }

  changeStatus(
    partyId: PartyId,
    orderIds: OrderId[],
    status: Status,
    stove?: Stove,
  ): Observable<void> {
    return this.http.put<void>(`api/orders/${partyId.value}/status`, { status, orderIds, stove });
  }

  delete(partyId: PartyId, orderId: OrderId): Observable<void> {
    return this.http.delete<void>(`api/orders/${partyId.value}/${orderId.value}`);
  }
}

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);

  findAll(): Observable<User[]> {
    return this.http.get<User[]>('api/users');
  }

  create(user: UserCreate): Observable<void> {
    return this.http.post<void>('api/users', user);
  }

  setPassword(userId: number, password: string): Observable<void> {
    return this.http.put<void>(`api/users/${userId}/password`, { password });
  }

  delete(userId: number): Observable<void> {
    return this.http.delete<void>(`api/users/${userId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class ImprintApi {
  private readonly http = inject(HttpClient);

  find(): Observable<Imprint> {
    return this.http.get<Imprint>('api/imprint');
  }
}

@Injectable({ providedIn: 'root' })
export class LinkApi {
  private readonly http = inject(HttpClient);

  findAll(): Observable<Link[]> {
    return this.http.get<Link[]>('api/links');
  }

  findByIdentifier(identifier: string): Observable<Link> {
    return this.http.get<Link>('api/links/search', { params: { identifier } });
  }

  update(link: Link): Observable<void> {
    return this.http.put<void>(`api/links/${link.id.value}`, link);
  }
}
