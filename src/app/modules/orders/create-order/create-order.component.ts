import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Location } from '@angular/common';
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
  patient: any;
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
    packet: 0,
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
    tomography_piece: "",
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
  filteredClients: any[] = [];
  searchTerm: string = '';
  showCreateForm: boolean = false;
  directCreate: boolean = false;
  newPatient = {
    name: '',
    lastname: '',
    email: '',
    phone: '',
    birthday: '',
    address: ''
  };
  id: string;
  idUser: string; // ID del usuario actual para parentId
  user: string = localStorage.getItem('userName') || ''; // Nombre del usuario actual
  instance: any;
  basicEnabled: boolean = false;
  basicDigitalEnabled: boolean = false;
  switch3DEnabled: boolean = false;
  rols: any[] = []; // Lista de roles disponibles
  clienteRolId: string | null = null; // ID del rol Cliente

  private readonly CHECKBOX_KEYS = [
    // Entrega
    'acetate_print','paper_print','send_email',
    // Radiografías
    'rx_panoramic','rx_arc_panoramic','rx_lateral_skull','ap_skull','pa_skull','paranasal_sinuses',
    'atm_open_close','profilogram','watters_skull','palmar_digit',
    // Intraorales
    'occlusal_xray','superior','inferior','complete_periapical','individual_periapical','conductometry',
    // Fotografía/Clínica
    'clinical_photography','dental_interpretation',
    // Cefalométricos
    'rickets','mcnamara','downs','jaraback','steiner','analysis_bolton','analysis_moyers',
    // Modelos de estudio
    'risina','dentalprint','risina_3d','surgical_guide',
    // Tomografías 3D
    'complete_tomography','two_jaws_tomography','maxilar_tomography','jaw_tomography','snp_tomography',
    'ear_tomography','atm_tomography_open_close','lateral_left_tomography_open_close',
    'lateral_right_tomography_open_close','stl','obj','ply','invisaligh','dicom',
    // Estereolitografía
    'maxilar_superior','maxilar_inferior','maxilar_both'
  ];

  /** Qué casillas marca cada paquete automáticamente */
  private readonly CEPHALO_KEYS = [
    'rickets','mcnamara','downs','jaraback','steiner'
  ] as const;

  private readonly PACKET_INCLUDED = {
    1: [ // Básico
      'rx_panoramic','rx_lateral_skull','risina','clinical_photography','dentalprint'
    ],
    2: [ // Básico Digital
      'clinical_photography','rx_panoramic','rx_lateral_skull'
    ],
    3: [ // 3D (Con Tomografía)
      'rx_arc_panoramic','rx_lateral_skull','clinical_photography','risina','complete_tomography','stl'
    ]
  };

  /** Limpia todos los checkboxes de estudios */
  private resetStudyCheckboxes(): void {
    this.CHECKBOX_KEYS.forEach(k => (this.order[k] = 0 as number));
  }

  onCephChange(changedKey: string): void {
    const current = this.order.packet;
    // Solo restringir si es Básico Digital (2) o 3D (3)
    if ((current === 2 || current === 3) && this.order[changedKey]) {
      // Dejar solo el recién marcado y desmarcar los demás
      this.CEPHALO_KEYS
        .filter(k => k !== changedKey)
        .forEach(k => (this.order[k] = 0 as number));
    }
    // Luego valida extras como siempre
    this.onAnyOptionChange();
  }

  /** Marca las casillas incluidas por el paquete seleccionado */
  private applyPacketIncluded(packet: number): void {
    const included = this.PACKET_INCLUDED[packet] || [];
    included.forEach(k => (this.order[k] = 1 as number));
  }

  /**
   * Se llama en cada cambio de un checkbox de estudios.
   * Si hay algo seleccionado fuera de lo que incluye el paquete actual, pasa packet a 0.
   */
  onAnyOptionChange(): void {
  const current = this.order.packet;
  if (![1, 2, 3].includes(current)) return;

  const included = new Set(this.PACKET_INCLUDED[current] || []);

  // ✅ Permitir 1 cefalométrico cuando packet es 2 o 3
  if (current === 2 || current === 3) {
    const cephSelected = this.CEPHALO_KEYS.filter(k => !!this.order[k]);
    if (cephSelected.length > 1) {
      // Resguardo (debería manejarse en onCephChange, pero por si acaso):
      cephSelected.slice(1).forEach(k => (this.order[k] = 0 as number));
    }
    // Si hay 1 seleccionado, considéralo permitido (no “rompe” el paquete)
    cephSelected.forEach(k => included.add(k));
  }

  const selected = this.CHECKBOX_KEYS.filter(k => !!this.order[k]);
  const extras = selected.filter(k => !included.has(k));

  if (extras.length > 0) {
    this.order.packet = 0; // personalizado
  }
}

  // === Actualiza tus toggles para limpiar + aplicar correctamente ===
  toggleBasic() {
    if (this.basicEnabled) {
      this.basicDigitalEnabled = false;
      this.switch3DEnabled = false;
    }
    // Primero limpiar todo:
    this.resetStudyCheckboxes();

    // Fijar packet y marcar incluidas
    this.order.packet = this.basicEnabled ? 1 : 0;
    if (this.basicEnabled) this.applyPacketIncluded(1);
  }

  toggleBasicDigital() {
    if (this.basicDigitalEnabled) {
      this.basicEnabled = false;
      this.switch3DEnabled = false;
      this.defaultNavActiveId = 5;
    }
    this.resetStudyCheckboxes();

    this.order.packet = this.basicDigitalEnabled ? 2 : 0;
    if (this.basicDigitalEnabled) this.applyPacketIncluded(2);
  }

  toggle3D() {
    if (this.switch3DEnabled) {
      this.basicEnabled = false;
      this.basicDigitalEnabled = false;
      this.defaultNavActiveId = 5;
    }
    this.resetStudyCheckboxes();

    this.order.packet = this.switch3DEnabled ? 3 : 0;
    if (this.switch3DEnabled) this.applyPacketIncluded(3);
  }

  constructor(private fb: FormBuilder, private api: CeraorService, private permissionsService: PermissionsService, private cd: ChangeDetectorRef, private location: Location) { }

  ngOnInit(): void {
    this.loadId();
    this.getInstance();
    this.getMyClients();
    this.getRols(); // Obtener roles disponibles
    this.cd.detectChanges();
  }



  create() {
    const orderCopy = { ...this.order };

    this.api.createData('order/create', this.order).subscribe(
      (resp: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Orden Creada',
          text: resp.msg
        });
        this.back();
      },
      (error) => {
        console.log(error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error
        });
      }
    );

  }

  back(): void {
    this.location.back();
  }

  loadId() {
    this.permissionsService.getId().subscribe(
      (resp: any) => {
        this.id = resp;
        this.idUser = resp; // También establecer idUser para la creación de pacientes
      },
      (error) => {
        console.log(error);
      }
    );
  }

  onSelectChange(event: Event) {
    let value = (event.target as HTMLSelectElement).value;
    this.patient = JSON.parse(value);
    this.order.patient = this.patient.name + " " + this.patient.lastname;
    this.order.email = this.patient.email;
    this.order.phone = this.patient.phone;
    this.order.birthdate = this.patient.birthday;
  }

  getMyClients() {
    this.api.getDataById('user/getmyusers', this.id).subscribe(
      (resp: any) => {
        this.clients = resp.data;
        this.filteredClients = [...this.clients];
      },
      (error) => {
        console.log(error);
      }
    );
  }

  getInstance() {
    this.api.getDataById('user/getinstance', this.id).subscribe(
      (resp: any) => {
        this.instance = resp.data[0];
        this.order.doctor = this.instance.name + " " + this.instance.lastname;
        this.order.address = this.instance.address;
        this.order.professional_id = this.instance.professional_id;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  /**
   * Obtiene la lista de roles disponibles y encuentra el ID del rol Cliente
   */
  getRols() {
    this.api.getData('rol/getall').subscribe(
      (resp: any) => {
        this.rols = resp.data || [];
        // Buscar el ID del rol "Cliente"
        const clienteRole = this.rols.find(rol => rol.name === 'Paciente');
        if (clienteRole) {
          this.clienteRolId = clienteRole.id;
          console.log('🎯 Rol Cliente encontrado con ID:', this.clienteRolId);
        } else {
          console.warn('⚠️ No se encontró el rol "Paciente" en la lista de roles');
          console.log('📋 Roles disponibles:', this.rols.map(r => r.name));
        }
      },
      (error) => {
        console.error('❌ Error al obtener roles:', error);
      }
    );
  }

  /**
   * Filtra los clientes basado en el término de búsqueda
   */
  filterClients() {
    if (!this.searchTerm.trim()) {
      this.filteredClients = [...this.clients];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(client => 
      (client.name && client.name.toLowerCase().includes(searchLower)) ||
      (client.lastname && client.lastname.toLowerCase().includes(searchLower)) ||
      (client.email && client.email.toLowerCase().includes(searchLower)) ||
      ((client.name + ' ' + client.lastname).toLowerCase().includes(searchLower))
    );
  }

  /**
   * Selecciona un cliente de la lista filtrada
   */
  selectClient(client: any) {
    this.patient = client;
    this.order.patient = client.name + " " + client.lastname;
    this.order.email = client.email;
    this.order.phone = client.phone;
    this.order.birthdate = client.birthday;
    this.searchTerm = client.name + " " + client.lastname;
    this.filteredClients = [];
  }

  /**
   * Muestra el formulario para crear nuevo paciente
   */
  showCreatePatientForm() {
    this.showCreateForm = true;
    this.newPatient = {
      name: '',
      lastname: '',
      email: '',
      phone: '',
      birthday: '',
      address: ''
    };
  }

  /**
   * Cancela la creación de nuevo paciente
   */
  cancelCreatePatient() {
    this.showCreateForm = false;
    this.newPatient = {
      name: '',
      lastname: '',
      email: '',
      phone: '',
      birthday: '',
      address: ''
    };
  }

  /**
   * Crea un nuevo paciente usando la misma estructura que en usuarios
   */
  createNewPatient() {
    // Validaciones básicas
    if (!this.newPatient.name || !this.newPatient.lastname || !this.newPatient.email) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor complete nombre, apellido y email'
      });
      return;
    }

    // Verificar que se haya obtenido el ID del rol Cliente
    if (!this.clienteRolId) {
      Swal.fire({
        icon: 'error',
        title: 'Error de configuración',
        text: 'No se pudo obtener el rol de Cliente. Intente recargar la página.'
      });
      return;
    }

    // Crear el objeto paciente con la misma estructura que en users.component
    const patientData = {
      parentId: this.idUser,
      name: this.newPatient.name,
      lastname: this.newPatient.lastname,
      email: this.newPatient.email,
      password: this.generateTemporaryPassword(), // Generar contraseña temporal
      birthday: this.newPatient.birthday,
      phone: this.newPatient.phone,
      related: this.user,
      address: this.newPatient.address,
      id_rol: this.clienteRolId // Usar ID numérico del rol Cliente
    };

    console.log('📤 Enviando datos del paciente:', patientData);

    // Usar el mismo endpoint que en users.component
    this.api.createData('user/register', patientData).subscribe(
      (resp: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Paciente creado',
          text: 'El paciente ha sido registrado exitosamente'
        });

        // Agregar el nuevo paciente a la lista local
        const newClient = {
          id: resp.data?.id || Date.now(), // Usar ID del response o timestamp
          name: this.newPatient.name,
          lastname: this.newPatient.lastname,
          email: this.newPatient.email,
          phone: this.newPatient.phone,
          birthday: this.newPatient.birthday,
          address: this.newPatient.address
        };

        this.clients.push(newClient);
        this.selectClient(newClient);
        this.cancelCreatePatient();
      },
      (error) => {
        console.error('❌ Error al crear paciente:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.msg || error.error?.message || 'Error al crear el paciente'
        });
      }
    );
  }

  /**
   * Genera una contraseña temporal para el nuevo paciente
   */
  generateTemporaryPassword(): string {
    // Generar contraseña con las primeras 4 letras del nombre + las primeras 4 del apellido
    const namePart = this.newPatient.name.replace(/\s+/g, '').substring(0, 4).toLowerCase();
    const lastnamePart = this.newPatient.lastname.replace(/\s+/g, '').substring(0, 4).toLowerCase();
    return namePart + lastnamePart + '123';
  }

  /**
   * Maneja el cambio del checkbox "Crear directa"
   */
  onDirectCreateChange() {
    if (this.directCreate) {
      // Limpiar campos cuando se activa modo directo
      this.searchTerm = '';
      this.filteredClients = [];
      this.patient = null;
      this.order.patient = '';
      this.order.email = '';
      this.order.phone = '';
      this.order.birthdate = '';
    } else {
      // Restaurar lista de clientes cuando se desactiva
      this.filteredClients = [...this.clients];
    }
  }

  /**
   * Maneja el cambio en el campo de texto directo
   */
  onDirectPatientChange() {
    if (this.directCreate) {
      this.order.patient = this.searchTerm;
    }
  }

  /**
   * Limpia la búsqueda de clientes
   */
  clearSearch() {
    this.searchTerm = '';
    this.filteredClients = [...this.clients];
    this.patient = null;
    this.order.patient = '';
    this.order.email = '';
    this.order.phone = '';
    this.order.birthdate = '';
  }
}
