import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CeraorService } from '../../services/ceraor.service';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';
import { PermissionsService } from '../../services/permissions.service';
import * as bootstrap from 'bootstrap';
import { Environment } from '../../Env/env';

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  permissions: any;
  orders: any[] = [];
  filtered: any[] = [];
  filterText: string = '';
  id: string;
  idUser: string;
  name: String;
  lastname: String;
  rol: string;
  rols: any;
  env = Environment;
  page: number = 1;
  itemsPerPage: number = 5;

  constructor(private api: CeraorService, private permissionsService: PermissionsService, private cd: ChangeDetectorRef, private router: Router, private zone: NgZone) { }

  ngOnInit() {
    this.setPermissions();

    this.setPetitions();
    this.getRols();
  }

  setPetitions() {
    if (this.rol == 'Owner' || this.rol == 'Superadmin' || this.rol == 'Admin') {
      this.getData();
    } if (this.rol == 'Doctor') {
      let complete = this.name + " " + this.lastname;
      this.getOrdersByDoctor(complete);
    }
  }

  setPermissions() {
    this.permissionsService.getId().subscribe(
      (value) => {
        this.idUser = value;
        this.cd.detectChanges();
      }
    );
    this.permissionsService.getRol().subscribe(value => {
      this.rol = value;
      this.cd.detectChanges();
    });

    this.permissionsService.getPermissions().subscribe(value => {
      this.permissions = value;
      this.cd.detectChanges();
    });

    this.permissionsService.getName().subscribe(value => {
      this.name = value;
      this.cd.detectChanges();
    });

    this.permissionsService.getLastname().subscribe(value => {
      this.lastname = value;
      this.cd.detectChanges();
    });
  }


  updatePermissions(token: string) {
    this.permissionsService.setPermissions(token);
  }

  hasPermissions(permission: string): boolean {
    return this.permissions && this.permissions.includes(permission);
  }

  canShow(option: string): boolean {
    return this.hasPermissions(option);
  }

  getData() {
    this.api.getData('order/getall').subscribe(
      (data: any) => {
        this.orders = data.data;
        this.filtered = [...this.orders]; // Inicializa con todos los usuarios
      },
      (error) => {
        console.log(error.error);
      }
    );
  }

  filter() {
    const searchText = this.filterText.toLowerCase();
    this.filtered = this.orders.filter(order =>
      order.patient.toLowerCase().includes(searchText) ||
      order.appointment_code.toLowerCase().includes(searchText)
    );
  }

  /*  getInstance(user: any, id: string) {
     this.dataInstance = user;
     this.id = id;
   } */

  getOrdersByDoctor(name: String) {
    this.api.getDataById('order/getbydoctor', name).subscribe(
      (resp: any) => {
        this.orders = resp.data;
        this.filtered = this.orders;
      },
      (error) => {
        console.log(error);
      }
    );
  }
  editInstance(form: NgForm) {
    if (form.invalid) {
      Swal.fire({
        title: 'Formulario inválido',
        icon: 'error',
        text: 'Por favor, complete todos los campos correctamente antes de enviar.',
        confirmButtonColor: '#198754'
      });
      return;
    }

    this.api.updateData('user/updateuser', this.id, form.value).subscribe(
      (data: any) => {
        Swal.fire({
          title: 'Usuario Actualizado',
          icon: 'success',
          text: data.message,
          confirmButtonColor: '#198754'
        });


        // Cerrar modal
        this.closeModal('#editModal');

        // Actualizar la lista de usuarios
        this.setPetitions();
      },
      (error) => {
        Swal.fire({
          title: 'Error',
          icon: 'error',
          text: error.error.message,
          confirmButtonColor: '#198754'
        });
      }
    );
  }
  closeModal(modalId: string) {
    const modalElement = document.querySelector(modalId) as HTMLElement;
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      modalInstance.hide();

      // Esperar un pequeño tiempo y eliminar el backdrop manualmente
      setTimeout(() => {
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        document.body.classList.remove('modal-open'); // Evita que la página quede bloqueada
      }, 300);
    }
  }

  downloadPdf(url: string, fileName: string) {
    Swal.fire({
      title: 'Descargando PDF...',
      text: 'Por favor espera unos segundos.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.api.http.get(url, { responseType: 'blob' }).subscribe(
      blob => {
        Swal.close();

        const downloadURL = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadURL;
        a.download = `${fileName}.pdf`; // Nombre dinámico
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadURL); // Limpia memoria
      },
      error => {
        Swal.close();
        console.error('Error al descargar el PDF:', error);
        Swal.fire('Error', 'No se pudo descargar el PDF.', 'error');
      }
    );
  }

  delete(id: string, name: string) {
    Swal.fire({
      title: "Borrar Usuario",
      icon: 'info',
      text: `¿Desea borrar "${name}"?`,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#d33',
      showConfirmButton: true,
      showCancelButton: true
    }).then((resp) => {
      if (resp.isConfirmed) {
        this.api.deleteData('user/deleteuser', id).subscribe(
          (data: any) => {
            Swal.fire({
              title: 'Usuario Borrado',
              icon: 'success',
              text: data.message,
              confirmButtonColor: '#198754'
            });
            this.getData();
          },
          (error) => {
            Swal.fire({
              title: 'Error',
              icon: 'error',
              text: error.error.message,
              confirmButtonColor: '#198754'
            });
          }
        );
      }
    });

  }


  getRols() {
    this.api.getData('rol/getall').subscribe(
      (resp: any) => {
        this.rols = resp.data;
      },
      (error) => {
        console.log(error);
      }
    );
  }
}
