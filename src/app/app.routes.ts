import { Routes } from '@angular/router';
import {
  canActivate,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';
import { ForgotPasswordComponent } from './auth/forgot-password.component';

const redirectUnauthorizedToLogin = () =>
  redirectUnauthorizedTo(['auth/login']);
const redirectLoggedInToHome = () => redirectLoggedInTo(['/']);

export const routes: Routes = [
  {
    path: 'home',
    pathMatch: 'full',
    ...canActivate(redirectUnauthorizedToLogin),
    loadComponent: () =>
      import('./pages/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'auth',
    ...canActivate(redirectLoggedInToHome),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./auth/login.component').then((m) => {
            return m.LoginComponent;
          }),
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
      },
    ],
  },
  {
    path: 'account',
    ...canActivate(redirectUnauthorizedToLogin),
    children: [
      {
        path: 'account-list',
        loadComponent: () =>
          import('./accounts/account-list.component').then(
            (m) => m.AccountListComponent,
          ),
      },
      {
        path: 'between',
        loadComponent: () =>
          import('./accounts/account-between.component').then(
            (m) => m.AccountBetweenComponent,
          ),
      },
      {
        path: 'between-detail',
        loadComponent: () =>
          import('./accounts/account-between-detail.component').then(
            (m) => m.AccountBetweenDetailComponent,
          ),
      },
      {
        path: 'allyear',
        loadComponent: () =>
          import('./accounts/calculate-expenses-income.component').then(
            (m) => m.CalculateExpensesIncomeComponent,
          ),
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: 'home',
  },
];
