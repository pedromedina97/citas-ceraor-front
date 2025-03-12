import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CeraorService } from '../services/ceraor.service';
import { PermissionsService } from '../services/permissions.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(CeraorService);
  const router = inject(Router);

  if (!authService.estadoAutenticado()) {
    return router.createUrlTree(['/login']); // Si no está autenticado, redirige a login
  }

  return true; // Si está autenticado, permite el acceso
};