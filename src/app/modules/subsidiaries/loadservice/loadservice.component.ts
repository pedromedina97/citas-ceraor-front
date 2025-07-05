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

  constructor(private route: ActivatedRoute, private api: CeraorService, private fb: FormBuilder) {
    this.form = this.fb.group({
      items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadRoute();
    this.ensureAtLeastOneItem();
  }

  loadRoute(): void {
    this.route.params.subscribe(params => {
      this.id = params['id'];
    });
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ensureAtLeastOneItem(): void {
    if (this.items.length === 0) {
      this.addItem();
    }
  }

  addItem(): void {
    const itemForm = this.fb.group({
      name: ['', Validators.required],
      id_subsidiary: [this.id, Validators.required],
      description: ['', Validators.required],
      price: ['', Validators.required]
    });

    this.items.push(itemForm);
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Debe haber al menos un servicio en la lista'
      });
    }
  }

  isFieldInvalid(index: number, field: string): boolean {
    const item = this.items.at(index);
    return item.get(field)?.invalid && (item.get(field)?.touched || item.get(field)?.dirty);
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.api.createData('service/create', this.form.value.items).subscribe(
        (resp: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: resp.message
          });
        },
        error => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error.message
          });
        }
      );
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor complete todos los campos antes de enviar'
      });
    }
  }

}
