import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CeraorService } from '../../../services/ceraor.service';
import { PermissionsService } from '../../../services/permissions.service';

@Component({
  selector: 'app-create-order',
  standalone: false,
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.scss'
})
export class CreateOrderComponent {
  form!: FormGroup;
  clients: any[] = [];
  id: string;

  constructor(private fb: FormBuilder, private api: CeraorService, private permissionsService: PermissionsService) {}

  ngOnInit(): void {
    this.loadId();
    this.getMyClients();
    this.createForm();
  }

  createForm(){
    this.form = this.fb.group({
      patient: [''],
      birthdate: [''],
      phone: [''],
      doctor: [''],
      address: [''],
      professional_id: [''],
      email: [''],

      acetate_print: [false],
      paper_print: [false],
      send_email: [false],
      rx_panoramic: [false],
      rx_arc_panoramic: [false],
      rx_lateral_skull: [false],
      ap_skull: [false],
      pa_skull: [false],
      paranasal_sinuses: [false],
      atm_open_close: [false],
      profilogram: [false],
      watters_skull: [false],
      palmar_digit: [false],
      others_radiography: [''],
      occlusal_xray: [false],
      superior: [false],
      inferior: [false],
      complete_periapical: [false],
      individual_periapical: [false],
      conductometry: [false],
      clinical_photography: [false],
      rickets: [false],
      mcnamara: [false],
      downs: [false],
      jaraback: [false],
      steiner: [false],
      others_analysis: [''],
      analysis_bolton: [false],
      analysis_moyers: [false],
      others_models_analysis: [''],
      risina: [false],
      dentalprint: [false],
      '3d_risina': [false],
      surgical_guide: [false],
      studio_piece: [''],
      complete_tomography: [false],
      two_jaws_tomography: [false],
      maxilar_tomography: [false],
      jaw_tomography: [false],
      snp_tomography: [false],
      ear_tomography: [false],
      atm_tomography_open_close: [false],
      lateral_left_tomography_open_close: [false],
      lateral_right_tomography_open_close: [false],
      ondemand: [''],
      dicom: [''],
      tomography_piece: [''],
      implant: [''],
      impacted_tooth: [''],
      others_tomography: [''],
      stl: [false],
      obj: [false],
      ply: [false],
      invisaligh: [false],
      others_scanners: [''],
      maxilar_superior: [false],
      maxilar_inferior: [false],
      maxilar_both: [false],
      maxilar_others: [''],
      dental_interpretation: [false],
    });
  }

  submitForm() {
    const rawData = this.form.value;

    // Convertimos true/false a 1/0 donde corresponde
    const finalData: any = {};
    for (const key in rawData) {
      if (typeof rawData[key] === 'boolean') {
        finalData[key] = rawData[key] ? 1 : 0;
      } else {
        finalData[key] = rawData[key] === '' ? '-' : rawData[key];
      }
    }

    console.log('Objeto final para guardar:', finalData);
  }

  loadId(){
    this.permissionsService.getId().subscribe(
      (resp: any)=>{
        this.id = resp;
      },
      (error)=>{
        console.log(error);
      }
    );
  }

  getMyClients() {
    this.api.getDataById('user/getmyusers', this.id).subscribe(
      (resp: any) => {
        this.clients = resp.data;
      },
      (error) => {
        console.log(error);
      }
    );
  }
}
