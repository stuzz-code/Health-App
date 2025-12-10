import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Client },
  { path: 'stats', renderMode: RenderMode.Server },
  { path: 'goals', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Server },
];







