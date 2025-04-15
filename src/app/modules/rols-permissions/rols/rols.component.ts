import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { CeraorService } from '../../../services/ceraor.service';

@Component({
  selector: 'app-rols',
  standalone: false,
  templateUrl: './rols.component.html',
  styleUrl: './rols.component.scss'
})
export class RolsComponent {
  rols: any;
  filtered: any[] = [];
  filterText: string = '';
  userId = localStorage.getItem('userId');
  id: string = '';
  dataInstance = {
    name: '',
    description: ''
  }
  ngOnInit(): void {
    this.getData();
  }

  constructor(private api: CeraorService) { }

  getData() {
    this.api.getData('rol/getall').subscribe(
      (resp: any) => {
        this.rols = resp.data;
        this.filtered = [...this.rols];
      },
      (error) => {
        console.log(error);
      }
    );
  }

  filter() {
    const searchText = this.filterText.toLowerCase();
    this.filtered = this.rols.filter(rol =>
      rol.name.toLowerCase().includes(searchText)
    );
  }

  getInstance(data: any, id: string) {
    this.dataInstance = data;
    this.id = id;
  }

  editInstance(form: any) {
    this.api.updateData('rol/update', this.id, this.dataInstance).subscribe(
      (data: any) => {
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

  create(form: any) {
    let data = [
      this.dataInstance
    ];
    this.api.createData('rol/create', data).subscribe(
      (data: any) => {
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
    this.resetForm();
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
    }).then((resp) => {
      if (resp.isConfirmed) {
        this.api.deleteData('rol/delete', id).subscribe(
          (data: any) => {
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

  resetForm() {
    this.dataInstance = {
      name: '',
      description: ''
    }
  }
}
