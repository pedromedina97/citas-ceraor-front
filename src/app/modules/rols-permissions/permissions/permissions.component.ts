import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { CeraorService } from '../../../services/ceraor.service';

@Component({
  selector: 'app-permissions',
  standalone: false,
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.scss'
})
export class PermissionsComponent {
  permissions: any;
  filtered: any[] = [];
  filterText: string = '';
  userId = localStorage.getItem('userId');
  id: string = '';
  dataInstance = {
    id_user: this.userId,
    name: '',
    address: ''
  }
  ngOnInit(): void {
    console.log(this.userId);
    this.getData();
  }

  constructor(private api: CeraorService){}

  getData(){
    this.api.getData('permission/getall').subscribe(
      (resp: any)=>{
        console.log(resp);
        this.permissions = resp.data;
        this.filtered = [...this.permissions];
      },
      (error)=>{
        console.log(error);
      }
    );
  }

  filter() {
      const searchText = this.filterText.toLowerCase();
      this.filtered = this.permissions.filter(permission =>
        permission.name.toLowerCase().includes(searchText)
      );
    }
  
    getInstance(data: any, id: string) {
      this.dataInstance = data;
      this.id = id;
    }
  
    editInstance(form: any) {
      this.api.updateData('subsidiary/update', this.id, this.dataInstance).subscribe(
        (data: any) => {
          console.log(data);
          Swal.fire({
            title: 'Actualizado',
            icon: 'success',
            text: data.message,
            confirmButtonColor: '#198754'
          });
          this.getData();
        },
        (error) => {
          console.log(error);
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
      let data = [
        this.dataInstance
      ];
      this.api.createData('subsidiary/create', data).subscribe(
        (data: any) => {
          console.log(data);
          Swal.fire({
            title: 'Creado',
            icon: 'success',
            text: data.message,
            confirmButtonColor: '#198754'
          });
          this.getData();
        },
        (error) => {
          console.log(error);
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
        title: "Borrar",
        icon: 'info',
        text: `¿Desea borrar "${name}"?`,
        confirmButtonColor: '#198754',
        cancelButtonColor: '#d33',
        showConfirmButton: true,
        showCancelButton: true
      }).then((resp)=>{
        if(resp.isConfirmed){
          this.api.deleteData('subsidiary/delete', id).subscribe(
            (data: any) => {
              console.log(data);
              Swal.fire({
                title: 'Borrado',
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
        id_user: this.userId,
        name: '',
        address: ''
      }
    }
}
