import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CeraorService } from '../../../services/ceraor.service';
import { PermissionsService } from '../../../services/permissions.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-order',
  standalone: false,
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.scss'
})
export class CreateOrderComponent {
  defaultNavActiveId = 1;

  order = {
    patient: "",
    birthdate: "",
    phone: "",
    doctor: "",
    address: "",
    professional_id: "",
    email: "",
    acetate_print: 0,
    paper_print: 0,
    send_email: 0,
    rx_panoramic: 0,
    rx_arc_panoramic: 0,
    rx_lateral_skull: 0,
    ap_skull: 0,
    pa_skull: 0,
    paranasal_sinuses: 0,
    atm_open_close: 0,
    profilogram: 0,
    watters_skull: 0,
    palmar_digit: 0,
    others_radiography: "",
    occlusal_xray: 0,
    superior: 0,
    inferior: 0,
    complete_periapical: 0,
    individual_periapical: 0,
    conductometry: 0,
    clinical_photography: 0,
    rickets: 0,
    mcnamara: 0,
    downs: 0,
    jaraback: 0,
    steiner: 0,
    others_analysis: "",
    analysis_bolton: 0,
    analysis_moyers: 0,
    others_models_analysis: "",
    risina: 0,
    dentalprint: 0,
    risina_3d: 0,
    surgical_guide: 0,
    studio_piece: "",
    complete_tomography: 0,
    two_jaws_tomography: 0,
    maxilar_tomography: 0,
    jaw_tomography: 0,
    snp_tomography: 0,
    ear_tomography: 0,
    atm_tomography_open_close: 0,
    lateral_left_tomography_open_close: 0,
    lateral_right_tomography_open_close: 0,
    ondemand: "",
    dicom: "",
    tomography_piece : "",
    implant: "",
    impacted_tooth: "",
    others_tomography: "",
    stl: 0,
    obj: 0,
    ply: 0,
    invisaligh: 0,
    others_scanners: "",
    maxilar_superior: 0,
    maxilar_inferior: 0,
    maxilar_both: 0,
    maxilar_others: "",
    dental_interpretation: 0
}

  clients: any[] = [];
  id: string;

  constructor(private fb: FormBuilder, private api: CeraorService, private permissionsService: PermissionsService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadId();
    this.getMyClients();
    this.cd.detectChanges();
  }



  create() {
        const orderCopy = { ...this.order };

    this.api.createData('order/create', this.order).subscribe(
      (resp: any)=>{
        Swal.fire({
          icon: 'success',
          title: 'Orden Creada',
          text: resp.msg
        });
      },
      (error)=>{
        console.log(error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error
        });
      }
    );
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
