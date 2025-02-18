import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CeraorService } from '../services/ceraor.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(CeraorService);
  const router = inject(Router);
  if (authService.estadoAutenticado()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};