import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(c => c.DashboardComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/users/user-list.component').then(c => c.UserListComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/product-catalog.component').then(c => c.ProductCatalogComponent)
  },
  {
    path: 'analytics',
    loadComponent: () => import('./pages/analytics/analytics.component').then(c => c.AnalyticsComponent)
  }
];
