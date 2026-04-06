import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard, loginGuard } from './core/auth.guard';

export const routes: Routes = [

  // Страница логина — если уже залогинен, редирект на /home
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./auth/auth-page/auth-page').then(m => m.AuthPage)
  },

  // Все страницы через Layout — только для залогиненных
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      // Главная
      {
        path: 'home',
        loadComponent: () =>
          import('./home/home.component').then(m => m.HomeComponent)
      },

      // Профиль
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile').then(m => m.ProfileComponent)
      },

      // ── Отчеты ──────────────────────────────────────────
      {
        path: 'reports/internal',
        loadComponent: () =>
          import('./report/internal-reports/internal-reports.component')
            .then(m => m.InternalReportsComponent)
      },

      // ── Журналы ─────────────────────────────────────────
      {
        path: 'journals/emd',
        loadComponent: () =>
          import('./journals/journal-emd-list/journal-emd-list.component')
            .then(m => m.JournalEmdListComponent)
      },
      {
        path: 'journals/emd/new/zayavlenie',
        loadComponent: () =>
          import('./journals/zayavlenie-form/zayavlenie-form.component')
            .then(m => m.ZayavlenieFormComponent)
      },
      {
        path: 'journals/emd/:id',
        loadComponent: () =>
          import('./journals/journal-emd-card/journal-emd-card.component')
            .then(m => m.JournalEmdCardComponent)
      },
      {
        path: 'journals/emd/:id/zayavlenie',
        loadComponent: () =>
          import('./journals/zayavlenie-form/zayavlenie-form.component')
            .then(m => m.ZayavlenieFormComponent)
      },
      {
        path: 'journals/emd/:id/zayavlenie/:maketId',
        loadComponent: () =>
          import('./journals/zayavlenie-form/zayavlenie-form.component')
            .then(m => m.ZayavlenieFormComponent)
      },
      {
        path: 'journals/zayavleniy',
        loadComponent: () =>
          import('./journals/journal-zayavleniy/journal-zayavleniy.component')
            .then(m => m.JournalZayavleniyComponent)
      },
      {
        path: 'journals/electronic-applications',
        loadComponent: () =>
          import('./journals/journal-electronic-applications/journal-electronic-applications')
            .then(m => m.JournalElectronicApplications)
      },
      {
        path: 'journals/digitized-cases',
        loadComponent: () =>
          import('./journals/journal-digitized-cases/journal-digitized-cases.component')
            .then(m => m.JournalDigitizedCasesComponent)
      },
      {
        path: 'journals/auto-signing',
        loadComponent: () =>
          import('./journals/journal-automated-signs/journal-automated-signs.component')
            .then(m => m.JournalAutomatedSignsComponent)
      },
      {
        path: 'journals/gos-guarantee',
        loadComponent: () =>
          import('./journals/journal-gos-guarantee/journal-gos-guarantee')
            .then(m => m.JournalGosGuaranteeComponent)
      },

      // ── Разное ──────────────────────────────────────────
      {
        path: 'raznoe/lgot-ministry',
        loadComponent: () =>
          import('./raznoe/lgot-ministry/lgot-ministry').then(m => m.LgotMinistryComponent)
      },
      {
        path: 'raznoe/editing-social-contribution',
        loadComponent: () =>
          import('./raznoe/editing-social-contribution/editing-social-contribution')
            .then(m => m.EditingSocialContribution)
      },
      {
        path: 'raznoe/eaes-journal',
        loadComponent: () =>
          import('./raznoe/eaes-journal/eaes-journal').then(m => m.EaesJournalComponent)
      },
      {
        path: 'raznoe/sv-payers-registry',
        loadComponent: () =>
          import('./raznoe/sv-payers-registry/sv-payers-registry')
            .then(m => m.SvPayersRegistryComponent)
      },
      {
        path: 'raznoe/kgd-income',
        loadComponent: () =>
          import('./raznoe/kgd-income/kgd-income').then(m => m.KgdIncomeComponent)
      },

      // Все неизвестные пути → home (не на логин!)
      { path: '**', redirectTo: 'home' }
    ]
  },

  // Корневой редирект
  { path: '**', redirectTo: 'login' }
];