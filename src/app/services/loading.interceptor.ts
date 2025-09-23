import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from './loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Only show loading for API calls, not for assets
  if (!req.url.includes('assets/')) {
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      loadingService.hide();
    })
  );
};