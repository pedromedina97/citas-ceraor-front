import { Component, OnInit } from '@angular/core';
import { CeraorService } from '../../services/ceraor.service';
import { NgForm } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-services',
  standalone: false,
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent implements OnInit {

  subsidiaries: any;
  subsidiary: string;
  filtered: any[] = [];
  filterText: string = '';
  services: any;
  id: string = '';
  dataInstance = {
    name: '',
    id_subsidiary: '',
    description: ''
  }
  remainingId: string;

  constructor(private api: CeraorService) { }

  ngOnInit(): void {
    this.getSubsidiaries();
  }

  filter() {
    const searchText = this.filterText.toLowerCase();
    this.filtered = this.services.filter(service =>
      service.name.toLowerCase().includes(searchText)
    );
  }

  getSubsidiaries() {
    this.api.getData('subsidiary/getall').subscribe(
      (resp: any) => {
        console.log(resp);
        this.subsidiaries = resp.data;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  search(form: NgForm) {
    console.log(form.value);
    let id = form.value.id_subsidiary;
    Swal.showLoading();
    this.api.getDataById('service/getbysubsidiary', id).subscribe(
      (resp: any) => {
        Swal.close();
        console.log(resp);
        this.services = resp.data;
        this.remainingId = resp.data.id;
        this.filtered = [...this.services];
      },
      (error) => {
        console.log(error);
      }
    );
  }

  getInstance(data: any, id: string) {
    this.dataInstance = data;
    this.id = id;
  }

  getServices() {
    Swal.showLoading();
    this.api.getDataById('service/getbysubsidiary', this.remainingId).subscribe(
      (resp: any) => {
        Swal.close();
        console.log(resp);
        this.services = resp.data;
        this.remainingId = resp.data.id;
        this.filtered = [...this.services];
      },
      (error) => {
        console.log(error);
      }
    );
  }

  editInstance(form: any) {
    console.log(this.dataInstance);
    this.api.updateData('service/update', this.id, this.dataInstance).subscribe(
      (data: any) => {
        console.log(data);
        Swal.fire({
          title: 'Actualizado',
          icon: 'success',
          text: data.message,
          confirmButtonColor: '#198754'
        });
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
        this.api.deleteData('service/delete', id).subscribe(
          (data: any) => {
            console.log(data);
            Swal.fire({
              title: 'Borrado',
              icon: 'success',
              text: data.msg,
              confirmButtonColor: '#198754'
            });
            this.filtered = [];
          },
          (error) => {
            Swal.fire({
              title: 'Error',
              icon: 'error',
              text: error.error.msg,
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
      id_subsidiary: '',
      description: ''
    }
  }
}
