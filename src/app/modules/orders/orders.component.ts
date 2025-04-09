import { Component, OnInit, ChangeDetectorRef, NgZone} from '@angular/core';
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
export class OrdersComponent implements OnInit{
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
    id: string;
    idUser: string;
    user: string = localStorage.getItem('userName');
    rol: string;
    rols: any;
    env = Environment;
  
    constructor(private api: CeraorService, private permissionsService: PermissionsService, private cd: ChangeDetectorRef, private router: Router, private zone: NgZone) {}
  
    ngOnInit() {
      this.setPermissions();
     
      this.setPetitions();
      this.getRols();
    }
  
    setPetitions(){
      if(this.rol == 'Owner' || this.rol == 'Superadmin'){
        this.getData();
      }if(this.rol == 'Doctor' || this.rol == 'Recepcionista'){
        console.log("entra");
        this.getData();
      }
    }
  
    setPermissions(){
      this.permissionsService.getId().subscribe(
        (value)=>{
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
      this.api.getData('order/getall').subscribe(
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
    
      this.dataInstance.parentId = this.idUser;
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
          this.rols = resp.data;
        },
        (error)=>{
          console.log(error);
        }
      );
    }
  
    getClients(){
      this.api.getDataById('user/getmyusers', this.idUser).subscribe(
        (resp: any) =>{
          console.log(resp);
          this.users = resp.data;
          console.log(this.users);
          this.filtered = [...this.users];
        },
        (error)=>{
          console.log(error);
          Swal.fire({
            icon: 'warning',
            title: 'Sin usuarios',
            text: error.error.msg
          });
        }
      );
    }
}
