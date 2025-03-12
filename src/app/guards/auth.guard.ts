import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CeraorService } from '../services/ceraor.service';
import { PermissionsService } from '../services/permissions.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(CeraorService);
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado
  if (!authService.estadoAutenticado()) {
    return router.createUrlTree(['/login']);
  }

  // Obtener el permiso requerido desde la configuración de la ruta
  const requiredPermission = route.data?.['permissions'];
  const userPermissions = permissionsService.getPermissionsValue();

  // Si la ruta requiere un permiso y el usuario no lo tiene, redirigir a /unauthorized-access
  if (requiredPermission && !userPermissions.includes(requiredPermission)) {
    return router.createUrlTree(['/unauthorized-access']);
  }

  return true; // Permitir acceso si cumple con los permisos
};