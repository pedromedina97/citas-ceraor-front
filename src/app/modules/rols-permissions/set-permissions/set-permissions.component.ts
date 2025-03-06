import { Component, OnInit } from '@angular/core';
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

  selectedPermissions: { id_permission: string; id_rol: string }[] = [];
  
  constructor(private route: ActivatedRoute, private api: CeraorService) {
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
    if (!this.allpermissions.length || !this.permissions.length) {
      return; // Evita errores si aún no hay datos
    }

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
   * Maneja la selección y deselección de permisos en los checkboxes.
   * @param event Evento de cambio del checkbox
   * @param permissionId ID del permiso seleccionado
   */
  onCheckboxChange(event: any, permissionId: string) {
    if (event.target.checked) {
      this.selectedPermissions.push({ id_permission: permissionId, id_rol: this.id });
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(p => p.id_permission !== permissionId);
    }
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
