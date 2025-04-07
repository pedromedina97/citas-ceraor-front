import { Component, ViewChild, TemplateRef, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CeraorService } from '../../services/ceraor.service';
import { PermissionsService } from '../../services/permissions.service';
interface Event {
  id: number;
  id_order: string;
  title: string;
  start: string;
  color: string;
  personal: string;
  id_subsidiary: string;
  service: string;
}

// Nueva interfaz para el formulario
interface EventForm extends Event {
  startTime: string;
  endTime: string;
}



@Component({
  selector: 'app-agenda',
  standalone: false,
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss'
})
export class AgendaComponent implements OnInit {
  @ViewChild('eventModal') eventModal!: TemplateRef<any>;
  selectedEvent: Event | null = null;
  currentDate: Date = new Date();
  view: string = 'month';
  events: Event[] = [];
  subsidiaries: any;
  doctors: any;
  clients: any;
  eventForm: EventForm = {
    id: 0,
    id_order: '',
    title: '',
    start: '',
    startTime: '',
    endTime: '',
    color: '#007bff',
    personal: '',
    id_subsidiary: '',
    service: ''
  };
  weekDays: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  services: any;
  editing: boolean = false;
  permissions: any;
  id: string;
  rol: string;
  name: any;
  lastname: any;
  catalogOrders: any;

  constructor(private modalService: NgbModal, private api: CeraorService, private permissionsService: PermissionsService, private zone: NgZone, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadPermissions();
    this.loadId();
    this.loadRol();
    this.loadData();
    this.getAllAppointments(); // Cargar eventos desde la API al iniciar
    this.getAllSubsidiary();  // Cargar sucursales
  }

  loadData(){
    if(this.hasPermissions('see_client')){
      if(this.rol == 'Owner' || this.rol == 'Superadmin', this.rol === 'Admin' || this.rol == 'Recepcionista'){
        this.getClients();
        this.getDoctors();
      }else{
        this.getMyClients();
        this.getMyInfo();
        this.loadDoctor();
        this.getOrdersByDoctor();
      }
    }
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

  loadDoctor(){
    this.permissionsService.getName().subscribe(
      (resp: any)=>{
        this.name = resp;
      }
    );
    this.permissionsService.getLastname().subscribe(
      (resp: any)=>{
        this.lastname = resp;
      }
    );
  }

  loadRol(){
    this.permissionsService.getRol().subscribe(
      (resp: any)=>{
        this.rol = resp;
      },
      (error)=>{
        console.log(error);
      }
    );
  }

  generateRandomColor(): string {
    // 🎨 Paleta de colores Frutiger Aero
    const frutigerAeroColors = [
      '#00AEEF', // Azul eléctrico
      '#0096FF', // Azul vibrante
      '#00FF7F', // Verde neón
      '#39FF14', // Verde fosforescente
      '#FF007F', // Rosado neón
      '#FF00FF', // Magenta brillante
      '#8A2BE2', // Morado vibrante
      '#9400D3', // Púrpura oscuro
      '#FFD700', // Amarillo oro
      '#FF4500'  // Naranja intenso
    ];

    // 🔄 Elegir un color aleatorio de la lista
    return frutigerAeroColors[Math.floor(Math.random() * frutigerAeroColors.length)];
  }

  openEventDetails(event: Event, modal: any) {
    this.selectedEvent = event; // Guardar el evento seleccionado
    this.modalService.open(modal, { size: 'lg' }); // Abrir el modal
  }


  getAllAppointments() {
    this.api.getData('appointment/getall').subscribe(
      (resp: any) => {
        console.log('Eventos cargados:', resp.data); // Verificar si el color viene desde la API

        this.events = resp.data.map((event: any) => ({
          id: event.id,
          title: event.client,
          start: event.appointment,
          personal: event.personal,
          id_subsidiary: event.id_subsidiary,
          service: event.service,
          color: event.color ? event.color : this.generateRandomColor(), // 🟢 Si no hay color en la BD, genera uno aleatorio
        }));
      },
      (error) => {
        console.error('Error al cargar eventos:', error);
      }
    );
  }




  changeView(view: string) {
    this.view = view;
  }

  prev() {
    if (this.view === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    } else if (this.view === 'week') {
      this.currentDate = new Date(this.currentDate.setDate(this.currentDate.getDate() - 7));
    } else if (this.view === 'day') {
      this.currentDate = new Date(this.currentDate.setDate(this.currentDate.getDate() - 1));
    }
  }

  next() {
    if (this.view === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    } else if (this.view === 'week') {
      this.currentDate = new Date(this.currentDate.setDate(this.currentDate.getDate() + 7));
    } else if (this.view === 'day') {
      this.currentDate = new Date(this.currentDate.setDate(this.currentDate.getDate() + 1));
    }
  }

  getDaysOfMonth(): Date[] {
    let days: Date[] = [];
    let year = this.currentDate.getFullYear();
    let month = this.currentDate.getMonth();
    let firstDayOfMonth = new Date(year, month, 1);
    let lastDayOfMonth = new Date(year, month + 1, 0);
    let daysInMonth = lastDayOfMonth.getDate();

    let firstDayIndex = firstDayOfMonth.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

    // Ajustar para que la semana empiece en Lunes
    if (firstDayIndex === 0) {
      firstDayIndex = 6; // Si el mes empieza en Domingo, ponerlo al final
    } else {
      firstDayIndex -= 1; // Restar 1 para que Lunes sea el índice 0
    }

    // Agregar espacios en blanco para los días antes del inicio del mes
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null as any); // Espacio vacío
    }

    // Agregar los días reales del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }

  isToday(day: Date): boolean {
    const today = new Date();
    return day.getFullYear() === today.getFullYear() &&
      day.getMonth() === today.getMonth() &&
      day.getDate() === today.getDate();
  }


  getDaysOfWeek(): Date[] {
    let days: Date[] = [];
    let startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay()); // Lunes de la semana

    for (let i = 0; i < 7; i++) {
      let day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }

  // 🟢 Método para actualizar la hora de finalización automáticamente
  updateEndTime() {
    if (!this.eventForm.startTime) return;

    let startHour = parseInt(this.eventForm.startTime.split(':')[0], 10);
    let startMinutes = parseInt(this.eventForm.startTime.split(':')[1], 10);

    // 📌 Aseguramos que la hora final sea 30 minutos después de la hora de inicio
    let endMinutes = startMinutes + 30;
    let endHour = startHour;

    if (endMinutes >= 60) {
      endMinutes -= 60;
      endHour += 1;
    }

    // 📌 Formateamos en HH:mm
    this.eventForm.endTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  // 🟢 Método para validar si todos los campos del formulario están llenos
  isFormValid(): boolean {
    return (
      this.eventForm.title.trim() !== '' &&
      this.eventForm.start.trim() !== '' &&
      this.eventForm.startTime.trim() !== '' &&
      this.eventForm.endTime.trim() !== '' &&
      this.eventForm.personal.trim() !== '' &&
      this.eventForm.id_subsidiary.trim() !== '' &&
      this.eventForm.service.trim() !== ''
    );
  }


  getDayEvents(): Event[] {
    return this.events.filter(event => new Date(event.start).toDateString() === this.currentDate.toDateString());
  }

  getEventsForDay(day: Date): Event[] {
    return this.events.filter(event => new Date(event.start).toDateString() === day.toDateString());
  }

  openModal(day: Date | null = null, event?: MouseEvent) {
    if (!day) return; // No hacer nada si no se selecciona un día

    // 🟢 Verificar si el clic ocurrió dentro de un evento
    if (event) {
      const targetElement = event.target as HTMLElement;
      if (targetElement.closest('.event')) return; // Si se hizo clic en un evento, no abrir el modal de creación
    }

    const isoDate = day.toISOString().slice(0, 10); // Formato YYYY-MM-DD

    this.eventForm = {
      id: Date.now(),
      id_order: '',
      title: '',
      start: isoDate,
      startTime: '12:00',
      endTime: '13:00',
      color: this.generateRandomColor(), // 🟢 Color aleatorio siempre
      personal: '',
      id_subsidiary: '',
      service: ''
    };

    this.editing = false;
    this.modalService.open(this.eventModal); // 🟢 Ahora se abre sin importar si ya hay eventos en el día
  }

  saveEvent() {
    const startDate = new Date(`${this.eventForm.start}T${this.eventForm.startTime}`);
    const endDate = new Date(`${this.eventForm.start}T${this.eventForm.endTime}`);

    // 🟢 Generar un color aleatorio siempre antes de guardar
    this.eventForm.color = this.generateRandomColor();

    const eventData = {
      id_order: this.eventForm.id_order,
      client: this.eventForm.title,
      personal: this.eventForm.personal,
      id_subsidiary: this.eventForm.id_subsidiary,
      service: this.eventForm.service,
      appointment: startDate.toISOString(),
      end_appointment: endDate.toISOString(),
      color: this.eventForm.color  // 🟢 Ahora enviamos siempre un color aleatorio
    };
    
    this.api.createData('appointment/setappointment', eventData).subscribe(
      (resp: any) => {
        console.log('Evento guardado:', resp);
        this.getAllAppointments(); // Recargar la lista de eventos después de guardar
        this.modalService.dismissAll();
      },
      (error) => {
        console.error('Error al guardar evento:', error);
      }
    );
  }

  getMyInfo(){
    this.api.getDataById('user/getbyid', this.id).subscribe(
      (resp: any) =>{
        this.doctors = resp.data
      },
      (error)=>{
        console.log(error.error);
      }
    );
  }

  getOrdersByDoctor(){
    this.api.getDataById('order/getbydoctor', this.name+' '+this.lastname).subscribe(
      (resp: any) =>{
        console.log(resp);
        this.catalogOrders = resp.data;
      },
      (error)=>{
        console.log(error.error);
      }
    );
  }

  getDoctors() {
    this.api.getDataById('user/getbyidrol', 77).subscribe(
      (resp: any) => {
        console.log(resp.data);
        this.doctors = resp.data;
      },
      (error) => {
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

  getClients() {
    this.api.getDataById('user/getbyidrol', 4).subscribe(
      (resp: any) => {
        console.log(resp.data);
        this.clients = resp.data;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  deleteEvent(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.events = this.events.filter(e => e.id !== id);
  }

  // 🟢 Cargar todas las sucursales desde la API
  getAllSubsidiary() {
    this.api.getData('subsidiary/getall').subscribe(
      (resp: any) => {
        console.log('Sucursales cargadas:', resp.data);
        this.subsidiaries = resp.data;
      },
      (error) => {
        console.error('Error al cargar sucursales:', error);
      }
    );
  }

  getServices(id: string) {
    this.services = []; // Limpiar servicios anteriores
    this.api.getDataById('service/getbysubsidiary', id).subscribe(
      (resp: any) => {
        console.log('Servicios cargados:', resp.data);
        this.services = resp.data;
      },
      (error) => {
        console.error('Error al cargar servicios:', error);
      }
    );
  }

  loadPermissions() {
    this.permissionsService.getPermissions().subscribe(
      value => {
        this.zone.run(
          () => {
            this.permissions = value;
            this.cd.detectChanges();
          }
        );
      }
    );
  }

  updatePermissions(token: string) {
    this.permissionsService.setPermissions(token);
  }

  hasPermissions(permission: string): boolean {
    return this.permissions && this.permissions.includes(permission);
  }

  canShow(option: string): boolean {
    return this.hasPermissions(option);
  }


}
