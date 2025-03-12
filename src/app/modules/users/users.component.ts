import { Component, OnInit, ChangeDetectorRef, AfterViewInit, NgZone} from '@angular/core';
import { Router } from '@angular/router';
import { CeraorService } from '../../services/ceraor.service';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';
import { PermissionsService } from '../../services/permissions.service';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit, AfterViewInit {
  permissions: any;
  users: any[] = [];
  filtered: any[] = [];
  filterText: string = '';
  dataInstance = {
    parentId: '',
    name: '',
    lastname: '',
    email: '',
    password: '',
    birthday: '',
    phone: '',
    related: '',
    address: '',
    id_rol: null
  }
  id: string = localStorage.getItem('userId');
  user: string = localStorage.getItem('userName');
  rols: any;

  constructor(private api: CeraorService, private permissionsService: PermissionsService, private cd: ChangeDetectorRef, private router: Router, private zone: NgZone) {}

  ngOnInit() {
    this.getData();
    this.getRols();
  }

  ngAfterViewInit(): void {
    this.loadPermissions();
  }

  loadPermissions(){
    this.permissionsService.getPermissions().subscribe(
      value=>{
        this.zone.run(
          ()=>{
            this.permissions = value;
            this.cd.detectChanges();
          }
        );
      }
    );
  }

  updatePermissions(token: string){
    this.permissionsService.setPermissions(token);
  }

  hasPermissions(permission: string): boolean {
    return this.permissions && this.permissions.includes(permission);
  }

  canShow(option: string): boolean{
    return this.hasPermissions(option);
  }

  getData() {
    this.api.getData('user/getall').subscribe(
      (data: any) => {
        this.users = data.data;
        console.log(this.users);
        this.filtered = [...this.users]; // Inicializa con todos los usuarios
      },
      (error) => {
        console.log(error.error);
      }
    );
  }

  filter() {
    const searchText = this.filterText.toLowerCase();
    this.filtered = this.users.filter(user =>
      user.email.toLowerCase().includes(searchText) ||
      user.name.toLowerCase().includes(searchText) ||
      user.lastname.toLowerCase().includes(searchText)
    );
  }

  getInstance(user: any, id: string) {
    this.dataInstance = user;
    this.id = id;
  }


  create(form: NgForm) {
    if (form.invalid) {
      Swal.fire({
        title: 'Formulario inválido',
        icon: 'error',
        text: 'Por favor, complete todos los campos correctamente antes de enviar.',
        confirmButtonColor: '#198754'
      });
      return;
    }
  
    this.dataInstance.parentId = this.id;
    this.dataInstance.related = this.user;
  
    this.api.createData('user/register', this.dataInstance).subscribe(
      (data: any) => {
        Swal.fire({
          title: 'Usuario Creado',
          icon: 'success',
          text: data.message,
          confirmButtonColor: '#198754'
        });
  
        // Restablecer formulario
        form.resetForm();
        this.resetForm();
  
        // Cerrar modal
        this.closeModal('#createModal');
  
        // Actualizar la lista de usuarios
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
  
        // Restablecer formulario
        form.resetForm();
        this.resetForm();
  
        // Cerrar modal
        this.closeModal('#editModal');
  
        // Actualizar la lista de usuarios
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
  
  

  delete(id: string, name: string) {
    Swal.fire({
      title: "Borrar Usuario",
      icon: 'info',
      text: `¿Desea borrar "${name}"?`,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#d33',
      showConfirmButton: true,
      showCancelButton: true
    }).then((resp)=>{
      if(resp.isConfirmed){
        this.api.deleteData('user/deleteuser', id).subscribe(
          (data: any) => {
            console.log(data);
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

  resetForm() {
    this.dataInstance = {
      parentId: '',
      name: '',
      lastname: '',
      email: '',
      password: '',
      birthday: '',
      phone: '',
      related: '',
      address: '',
      id_rol: null
    }
  }

  getRols(){
    this.api.getData('rol/getall').subscribe(
      (resp: any)=>{
        console.log(resp);
        this.rols = resp.data;
      },
      (error)=>{
        console.log(error);
      }
    );
  }


}
