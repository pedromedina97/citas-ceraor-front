import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CeraorService } from '../../services/ceraor.service';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';
@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  filtered: any[] = [];
  filterText: string = '';
  dataInstance = {
    name: '',
    lastname: '',
    email: '',
    password: '',
    birthday: ''
  }
  id: string = '';


  constructor(private api: CeraorService) {}

  ngOnInit() {
    this.getData();
  }

  getData() {
    this.api.getData('user/getall').subscribe(
      (data: any) => {
        this.users = data.data;
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

  editInstance(form: any) {
    console.log(form.value);
    this.api.updateData('user/updateuser', this.id, form.value).subscribe(
      (data: any) => {
        console.log(data);
        Swal.fire({
          title: 'Usuario Actualizado',
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

  create(form: any){
    console.log(form.value);
    this.api.createData('user/register', form.value).subscribe(
      (data: any) => {
        console.log(data);
        Swal.fire({
          title: 'Usuario Creado',
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
    this.resetForm(form);
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

  resetForm(form: NgForm) {
    form.resetForm();
    this.dataInstance = {
      name: '',
      lastname: '',
      email: '',
      password: '',
      birthday: ''
    }
  }


}
