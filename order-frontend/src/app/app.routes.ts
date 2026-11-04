import { Routes } from '@angular/router';
import { authGuard } from './auth/auth';
import { partyResolver, ordersResolver } from './event/party-edit';
import { linkRedirectGuard, linksResolver, partiesResolver } from './links';
import { partyByKeyResolver } from './order';
import { condimentsResolver, condimentStatisticResolver } from './shared/condiments';

/** Same URLs as the old frontend, links to them are handed out to guests. */
export const routes: Routes = [
  { path: '', redirectTo: 'general/aboutUs', pathMatch: 'full' },
  {
    path: 'general/aboutUs',
    loadComponent: () => import('./general/about-us').then((m) => m.AboutUs),
  },
  {
    path: 'general/history',
    loadComponent: () => import('./general/history').then((m) => m.History),
  },
  {
    path: 'general/imprint',
    loadComponent: () => import('./general/imprint').then((m) => m.Imprint),
  },
  { path: 'login', loadComponent: () => import('./login').then((m) => m.Login) },
  {
    path: 'order/:id/:key',
    loadComponent: () => import('./order').then((m) => m.OrderPage),
    resolve: { party: partyByKeyResolver, condiments: condimentsResolver },
  },
  { path: 'l/:id', canActivate: [linkRedirectGuard], children: [] },
  {
    path: 'links',
    loadComponent: () => import('./links').then((m) => m.LinkAdmin),
    canActivate: [authGuard],
    resolve: { links: linksResolver, parties: partiesResolver },
  },
  {
    path: 'event/list',
    loadComponent: () => import('./event/party-list').then((m) => m.PartyList),
    canActivate: [authGuard],
    resolve: { parties: partiesResolver },
  },
  {
    path: 'event/edit',
    loadComponent: () => import('./event/party-edit').then((m) => m.PartyEdit),
    canActivate: [authGuard],
    resolve: { condiments: condimentsResolver, statistics: condimentStatisticResolver },
  },
  {
    path: 'event/edit/:partyId',
    loadComponent: () => import('./event/party-edit').then((m) => m.PartyEdit),
    canActivate: [authGuard],
    resolve: {
      party: partyResolver,
      orders: ordersResolver,
      condiments: condimentsResolver,
      statistics: condimentStatisticResolver,
    },
  },
  {
    path: 'kitchen/:partyId',
    loadComponent: () => import('./kitchen/kitchen').then((m) => m.Kitchen),
    canActivate: [authGuard],
    resolve: { party: partyResolver, condiments: condimentsResolver },
  },
  { path: '**', redirectTo: 'general/aboutUs' },
];
