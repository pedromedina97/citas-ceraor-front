import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CeraorService } from '../../../services/ceraor.service';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-loadservice',
  standalone: false,
  templateUrl: './loadservice.component.html',
  styleUrl: './loadservice.component.scss'
})
export class LoadserviceComponent implements OnInit{
  form: FormGroup;
  id: string;

  constructor(private route: ActivatedRoute, private api: CeraorService, private fb: FormBuilder){
    this.form = this.fb.group({
      items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadRoute();
  }


  loadRoute(): void {
    this.route.params.subscribe(
      (params)=>{
        this.id = params['id'];
      }
    );
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  addItem(): void {
    const itemForm = this.fb.group({
      name: ['', Validators.required],
      id_subsidiary: [this.id, Validators.required],
      description: ['', Validators.required]
    });

    this.items.push(itemForm);
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log(this.form.value.items);
      this.api.createData('service/create', this.form.value.items).subscribe(
        (resp: any) =>{
          console.log(resp);
          Swal.fire({
            icon: 'success',
            title: 'Exito',
            text: resp.message
          });
        },
        (error)=>{
          console.log(error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error.message
          });
        }
      );
    } else {
      console.log('Formulario inválido');
    }
  }

}
