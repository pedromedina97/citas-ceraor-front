import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CeraorService } from '../services/ceraor.service';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(CeraorService);
  const router = inject(Router);

  // Si el usuario ya está autenticado, redirigirlo a /home
  if (authService.estadoAutenticado()) {
    return router.createUrlTree(['/home']);
  }

  return true;
};
