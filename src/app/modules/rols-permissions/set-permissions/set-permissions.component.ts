import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CeraorService } from '../../../services/ceraor.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-set-permissions',
  standalone: false,
  templateUrl: './set-permissions.component.html',
  styleUrl: './set-permissions.component.scss'
})
export class SetPermissionsComponent implements OnInit{
  id: string;
  permissions: any[] = []; // Permisos asignados al rol
  allpermissions: any[] = []; // Todos los permisos disponibles
  groupedPermissions: { [key: string]: any[] } = {}; // Permisos agrupados por categoría

  selectedPermissions: { id_permission: string; id_rol: string }[] = [];
  
  constructor(private route: ActivatedRoute, private api: CeraorService, private cdr: ChangeDetectorRef) {
    this.id = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit(): void {
    this.loadPermissions();
  }

  /**
   * Carga los permisos asignados y todos los permisos disponibles antes de ejecutar la lógica de selección inicial.
   */
  loadPermissions() {
    forkJoin({
        assigned: this.api.getDataById('rolpermission/getpermissionsbyrol', this.id),
        all: this.api.getData('permission/getall')
    }).subscribe((response) => {
        this.permissions = (response.assigned as any).data || []; 
        this.allpermissions = (response.all as any).data || [];

        this.setInitialSelectedPermissions();
    }, error => {
        console.error('Error al cargar permisos:', error);
    });
}


  /**
   * Marca los checkboxes de los permisos ya asignados y llena la lista de permisos seleccionados.
   */
  setInitialSelectedPermissions() {
    if (!this.allpermissions.length) {
      return; // Evita errores si aún no hay datos
    }

    // Agrupar permisos por categoría
    this.groupPermissionsByCategory();

    // Llenamos `selectedPermissions` con los permisos que ya están asignados
    this.selectedPermissions = this.allpermissions
      .filter(perm => this.permissions.some(p => p.id === perm.id))
      .map(perm => ({
        id_permission: perm.id,
        id_rol: this.id
      }));

    // Marcar los permisos seleccionados en la lista de `allpermissions`
    this.allpermissions.forEach(perm => {
      perm.selected = this.selectedPermissions.some(p => p.id_permission === perm.id);
    });
  }

  /**
   * Agrupa los permisos por entidad/categoría basado en el sufijo del nombre del permiso
   */
  groupPermissionsByCategory() {
    const entityCategories: { [key: string]: { title: string, icon: string, color: string } } = {
      user: { title: 'Usuarios', icon: 'bi-person-circle', color: 'primary' },
      service: { title: 'Servicios', icon: 'bi-list-check', color: 'success' },
      subsidiary: { title: 'Sucursales', icon: 'bi-building', color: 'info' },
      order: { title: 'Órdenes', icon: 'bi-list-ul', color: 'warning' },
      appointment: { title: 'Citas', icon: 'bi-calendar-date', color: 'purple' },
      permission: { title: 'Permisos', icon: 'bi-shield-check', color: 'dark' },
      rol: { title: 'Roles', icon: 'bi-ui-radios', color: 'secondary' },
      rolpermission: { title: 'Roles y Permisos', icon: 'bi-gear', color: 'dark' },
      cashcut: { title: 'Corte de Caja', icon: 'bi-wallet', color: 'success' },
      admingraphic: { title: 'Gráficas Admin', icon: 'bi-bar-chart', color: 'info' },
      client: { title: 'Clientes', icon: 'bi-person-video2', color: 'primary' }
    };

    this.groupedPermissions = {};

    this.allpermissions.forEach(permission => {
      let category = 'others'; // categoría por defecto
      let categoryInfo = { title: 'Otros', icon: 'bi-shield', color: 'secondary' };

      // Determinar categoría basado en el sufijo del nombre del permiso
      if (permission.name) {
        const permissionName = permission.name.toLowerCase();
        
        for (const [entityName, info] of Object.entries(entityCategories)) {
          // Buscar patrones como: see_user, create_user, get_user, etc.
          if (permissionName.includes('_' + entityName) || 
              permissionName.endsWith(entityName) ||
              permissionName.startsWith(entityName)) {
            category = entityName;
            categoryInfo = info;
            break;
          }
        }
      }

      if (!this.groupedPermissions[category]) {
        this.groupedPermissions[category] = [];
      }

      // Agregar información de categoría al permiso
      permission.categoryInfo = categoryInfo;
      this.groupedPermissions[category].push(permission);
    });

    // Ordenar permisos dentro de cada categoría por tipo de acción
    Object.keys(this.groupedPermissions).forEach(category => {
      this.groupedPermissions[category].sort((a, b) => {
        const actionOrder = ['see', 'get', 'getall', 'create', 'update', 'delete'];
        const getActionPriority = (name: string) => {
          for (let i = 0; i < actionOrder.length; i++) {
            if (name.toLowerCase().startsWith(actionOrder[i])) {
              return i;
            }
          }
          return actionOrder.length;
        };
        
        return getActionPriority(a.name) - getActionPriority(b.name);
      });
    });
  }

  /**
   * Obtiene las claves de las categorías para el template
   */
  getCategoryKeys(): string[] {
    return Object.keys(this.groupedPermissions);
  }

  /**
   * Obtiene el título de una categoría
   */
  getCategoryTitle(category: string): string {
    if (this.groupedPermissions[category] && this.groupedPermissions[category].length > 0) {
      return this.groupedPermissions[category][0].categoryInfo?.title || 'Sin categoría';
    }
    return 'Sin categoría';
  }

  /**
   * Obtiene el ícono de una categoría
   */
  getCategoryIcon(category: string): string {
    if (this.groupedPermissions[category] && this.groupedPermissions[category].length > 0) {
      return this.groupedPermissions[category][0].categoryInfo?.icon || 'bi-shield';
    }
    return 'bi-shield';
  }

  /**
   * Obtiene el color de una categoría
   */
  getCategoryColor(category: string): string {
    if (this.groupedPermissions[category] && this.groupedPermissions[category].length > 0) {
      return this.groupedPermissions[category][0].categoryInfo?.color || 'secondary';
    }
    return 'secondary';
  }

  /**
   * Maneja la selección y deselección de permisos en los switches.
   * @param permission El permiso que se está modificando
   */
  onSwitchChange(permission: any) {
    if (permission.selected) {
      // Verificar que no exista ya en selectedPermissions para evitar duplicados
      const exists = this.selectedPermissions.find(p => p.id_permission === permission.id);
      if (!exists) {
        this.selectedPermissions.push({ id_permission: permission.id, id_rol: this.id });
      }
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(p => p.id_permission !== permission.id);
    }
    console.log('Switch individual cambiado:', permission.name, 'Seleccionado:', permission.selected);
  }

  /**
   * Cuenta los permisos activos en una categoría
   */
  getActivePermissionsCount(category: string): number {
    if (!this.groupedPermissions[category]) return 0;
    return this.groupedPermissions[category].filter(p => p.selected).length;
  }

  /**
   * Cuenta los permisos inactivos en una categoría
   */
  getInactivePermissionsCount(category: string): number {
    if (!this.groupedPermissions[category]) return 0;
    return this.groupedPermissions[category].filter(p => !p.selected).length;
  }

  /**
   * Selecciona todos los permisos de una categoría
   */
  selectAllPermissions(category: string) {
    if (!this.groupedPermissions[category]) return;
    
    console.log('Seleccionando todos los permisos de la categoría:', category);
    
    this.groupedPermissions[category].forEach(permission => {
      if (!permission.selected) {
        permission.selected = true;
        // Verificar que no exista ya en selectedPermissions
        const exists = this.selectedPermissions.find(p => p.id_permission === permission.id);
        if (!exists) {
          this.selectedPermissions.push({ id_permission: permission.id, id_rol: this.id });
        }
      }
    });
    
    console.log('Permisos seleccionados después:', this.selectedPermissions.length);
    this.cdr.detectChanges(); // Forzar detección de cambios
  }

  /**
   * Deselecciona todos los permisos de una categoría
   */
  deselectAllPermissions(category: string) {
    if (!this.groupedPermissions[category]) return;
    
    console.log('Deseleccionando todos los permisos de la categoría:', category);
    
    this.groupedPermissions[category].forEach(permission => {
      if (permission.selected) {
        permission.selected = false;
        this.selectedPermissions = this.selectedPermissions.filter(p => p.id_permission !== permission.id);
      }
    });
    
    console.log('Permisos seleccionados después:', this.selectedPermissions.length);
    this.cdr.detectChanges(); // Forzar detección de cambios
  }

  /**
   * Verifica si todos los permisos de una categoría están seleccionados
   */
  areAllPermissionsSelected(category: string): boolean {
    if (!this.groupedPermissions[category] || this.groupedPermissions[category].length === 0) return false;
    return this.groupedPermissions[category].every(p => p.selected);
  }

  /**
   * Verifica si al menos un permiso de una categoría está seleccionado
   */
  hasAnyPermissionSelected(category: string): boolean {
    if (!this.groupedPermissions[category]) return false;
    return this.groupedPermissions[category].some(p => p.selected);
  }

  /**
   * Alterna la selección de todos los permisos de una categoría
   */
  toggleAllPermissions(category: string) {
    console.log('Toggle ejecutado para categoría:', category);
    console.log('Todos seleccionados?', this.areAllPermissionsSelected(category));
    
    if (this.areAllPermissionsSelected(category)) {
      console.log('Ejecutando deseleccionar todos');
      this.deselectAllPermissions(category);
    } else {
      console.log('Ejecutando seleccionar todos');
      this.selectAllPermissions(category);
    }
    
    console.log('Toggle completado');
    this.cdr.detectChanges(); // Forzar detección de cambios adicional
  }

  savePermissions() {
    const payload = {
        id_rol: this.id,
        permissions: this.selectedPermissions
    };

    this.api.createData('rolpermission/updatepermissions', payload).subscribe(
        (resp: any)=>{
          Swal.fire({
            icon: 'success',
            title: 'Exito',
            text: resp.msg
          })
        },
        (error) => {
          Swal.fire({
            icon: 'error',
            title: "Error",
            text: "Ocurrió un error"
          })
            console.error('Error al actualizar permisos:', error);
        }
    );
}


}
