import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  // Страница логина — БЕЗ layout (без sidebar)
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/auth-page/auth-page')
        .then(m => m.AuthPage)
  },

  // Все остальные страницы — ЧЕРЕЗ layout (sidebar всегда виден)
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },

      // Главная страница
      {
        path: 'home',
        loadComponent: () =>
          import('./home/home.component')
            .then(m => m.HomeComponent)
      },

      // Разное
      {
        path: 'raznoe/lgot-ministry',
        loadComponent: () =>
          import('./raznoe/lgot-ministry/lgot-ministry')
            .then(m => m.LgotMinistryComponent)
      },
      // Отчеты
      {
        path: 'reports/internal',
        loadComponent: () =>
          import('./report/internal-reports/internal-reports.component')
            .then(m => m.InternalReportsComponent)
      },

      // Журналы
      //Журнал ЭМD
      {
        path: 'journals/emd',
        loadComponent: () =>
          import('./journals/journal-emd-list/journal-emd-list.component')
            .then(m => m.JournalEmdListComponent)   // ← новый список
      },
      { path: 'journals/emd/new/zayavlenie', 
        loadComponent: () => 
          import('./journals/zayavlenie-form/zayavlenie-form.component')
            .then(m => m.ZayavlenieFormComponent) },
      {
        path: 'journals/emd/:id',
        loadComponent: () =>
          import('./journals/journal-emd-card/journal-emd-card.component')
            .then(m => m.JournalEmdCardComponent)   // ← карточка
      },
      {
        path: 'journals/emd/:id/zayavlenie',   
        loadComponent: () =>
          import('./journals/zayavlenie-form/zayavlenie-form.component')
            .then(m => m.ZayavlenieFormComponent)
      },
      //Журнал заявлений
      {
        path: 'journals/zayavleniy',
        loadComponent: () =>
          import('./journals/journal-zayavleniy/journal-zayavleniy.component')
            .then(m => m.JournalZayavleniyComponent)
      },
    ]
  },

  // Редирект неизвестных путей на главную
  {
    path: '**',
    redirectTo: 'home'
  }
];