import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CeraorService } from '../../services/ceraor.service';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-subsidiaries',
  standalone: false,
  templateUrl: './subsidiaries.component.html',
  styleUrl: './subsidiaries.component.scss'
})
export class SubsidiariesComponent implements OnInit{
  subsidiaries: any;
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
    this.api.getData('subsidiary/getall').subscribe(
      (resp: any)=>{
        console.log(resp);
        this.subsidiaries = resp.data;
        this.filtered = [...this.subsidiaries];
      },
      (error)=>{
        console.log(error);
      }
    );
  }

  filter() {
      const searchText = this.filterText.toLowerCase();
      this.filtered = this.subsidiaries.filter(subsidiary =>
        subsidiary.name.toLowerCase().includes(searchText)
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

