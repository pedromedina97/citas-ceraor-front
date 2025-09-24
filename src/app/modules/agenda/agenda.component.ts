import { Component, ViewChild, TemplateRef, OnInit, NgZone, ChangeDetectorRef, inject, signal, WritableSignal, HostListener } from '@angular/core';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CeraorService } from '../../services/ceraor.service';
import { PermissionsService } from '../../services/permissions.service';
import { Environment } from '../../Env/env';
import Swal from 'sweetalert2';
interface Event {
  id: string;
  id_order: string;
  title: string;
  start: string;
  end?: string;
  color: string;
  personal: string;
  id_subsidiary: string;
  service: string;
  service_name?: string;
  subsidiary_name?: string;
  // Nuevos campos del endpoint getdetailbyid
  appointment_id?: string;
  patient_name?: string;
  service_price?: string;
  appointment_datetime?: string;
  staff_name?: string;
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
  loadingEventDetails: boolean = false;
  currentDate: Date = new Date();
  view: string = 'month';
  events: Event[] = [];
  subsidiaries: any;
  doctors: any;
  clients: any;
  eventForm: EventForm = {
    id: '',
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
  closeResult: WritableSignal<string> = signal('');
  private buffer: string = '';
  private timeout: any;
  barcodeBuffer: string = '';
  barcodeTimer: any;
  appointment: any;
  doctor: any;
  selectedSubsidiary: string = '';
  isManualClient: boolean = false;
  idCashcut: String;
  isSaving: boolean = false;

  constructor(private modalService: NgbModal, private api: CeraorService, private permissionsService: PermissionsService, private zone: NgZone, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadPermissions();
    this.loadId();
    this.loadRol();
    this.getAllSubsidiary();
    this.updateEndTime(); // Prevención global
  }

  loadData() {

    if (this.rol == 'Owner' || this.rol == 'Superadmin' || this.rol === 'Admin' || this.rol === 'Recepcionista' || this.rol === 'Operativo') {
      this.getClients();
      this.getDoctors();
    }
    else {
      this.getMyClients();
      this.getMyInfo();
      this.loadDoctor();
      this.getOrdersByDoctor();
      this.getAllAppointments();
    }

  }

  loadId() {
    this.permissionsService.getId().subscribe(
      (resp: any) => {
        this.id = resp;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  onDoctorChange(event: any) {
    let value = (event.target as HTMLSelectElement).value;
    this.doctor = JSON.parse(value);
    this.eventForm.personal = this.doctor.name + " " + this.doctor.lastname;
    this.getOrders(this.doctor.name, this.doctor.lastname);
  }

  loadDoctor() {
    this.permissionsService.getName().subscribe(
      (resp: any) => {
        this.name = resp;
      }
    );
    this.permissionsService.getLastname().subscribe(
      (resp: any) => {
        this.lastname = resp;
      }
    );
  }

  loadRol() {
    this.permissionsService.getRol().subscribe(
      (resp: any) => {
        this.rol = resp;
        this.loadData();
      },
      (error) => {
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

  /**
   * Obtiene los datos completos de un evento específico
   */
  getEventDetails(eventId: string): Promise<Event | null> {
    return new Promise((resolve, reject) => {
      console.log('🔍 Consultando detalles del evento con ID:', eventId);
      console.log('🌐 Usando endpoint: appointment/getdetailbyid con parámetro:', eventId);
      console.log('🔗 URL construida será:', `${Environment.url}appointment/getdetailbyid/${eventId}`);
      
      // Usar el endpoint específico appointment/getdetailbyid/{id}
      this.api.getDataById('appointment/getdetailbyid', eventId).subscribe(
        (resp: any) => {
          console.log('📋 Respuesta del API appointment/getdetailbyid:', resp);
          
          if (resp.status === 'success' && resp.data && resp.data.length > 0) {
            const eventData = resp.data[0];
            console.log('📊 Datos detallados del evento:', eventData);
            
            // Combinar datos originales con datos detallados
            const originalEvent = this.selectedEvent;
            const fullEvent: Event = {
              // Mantener datos originales básicos
              id: originalEvent?.id || eventData.appointment_id,
              id_order: originalEvent?.id_order || '',
              title: eventData.patient_name || originalEvent?.title || '',
              start: eventData.appointment_datetime || originalEvent?.start || '',
              end: originalEvent?.end || '',
              color: originalEvent?.color || this.generateRandomColor(),
              personal: eventData.staff_name || originalEvent?.personal || '',
              id_subsidiary: originalEvent?.id_subsidiary || '',
              service: originalEvent?.service || '',
              // Datos detallados del nuevo endpoint
              service_name: eventData.service_name,
              subsidiary_name: eventData.subsidiary_name,
              appointment_id: eventData.appointment_id,
              patient_name: eventData.patient_name,
              service_price: eventData.service_price,
              appointment_datetime: eventData.appointment_datetime,
              staff_name: eventData.staff_name
            };
            console.log('✅ Evento completo con detalles:', fullEvent);
            resolve(fullEvent);
          } else {
            console.warn('⚠️ No se encontraron detalles para el evento ID:', eventId);
            console.log('🔄 Intentando método alternativo...');
            this.getEventDetailsAlternative(eventId).then(resolve).catch(reject);
          }
        },
        (error) => {
          console.error('❌ Error en appointment/getdetailbyid:', error);
          console.log('🔄 Intentando método alternativo debido al error...');
          this.getEventDetailsAlternative(eventId).then(resolve).catch(reject);
        }
      );
    });
  }

  /**
   * Método alternativo para obtener detalles del evento
   */
  private getEventDetailsAlternative(eventId: string): Promise<Event | null> {
    return new Promise((resolve, reject) => {
      console.log('🔄 Usando método alternativo para ID:', eventId);
      
      const endpoint = this.selectedSubsidiary ? 
        `appointment/getbysubsidiary` : 
        'appointment/getall';
      
      const apiCall = this.selectedSubsidiary ? 
        this.api.getDataById(endpoint, this.selectedSubsidiary) : 
        this.api.getData(endpoint);
      
      apiCall.subscribe(
        (resp: any) => {
          console.log('📋 Respuesta del método alternativo:', resp);
          if (resp.data && resp.data.length > 0) {
            // Buscar el evento específico por ID
            const eventData = resp.data.find((event: any) => event.id === eventId);
            console.log('📊 Evento encontrado en método alternativo:', eventData);
            
            if (eventData) {
              const fullEvent: Event = {
                id: eventData.id,
                id_order: eventData.id_order || '',
                title: eventData.client,
                start: eventData.appointment,
                end: eventData.end_appointment,
                color: eventData.color || this.generateRandomColor(),
                personal: eventData.personal,
                id_subsidiary: eventData.id_subsidiary,
                service: eventData.service,
                service_name: eventData.service_name,
                subsidiary_name: eventData.subsidiary_name
              };
              console.log('✅ Evento completo desde método alternativo:', fullEvent);
              resolve(fullEvent);
            } else {
              console.warn('⚠️ No se encontró el evento con ID en método alternativo:', eventId);
              resolve(null);
            }
          } else {
            console.warn('⚠️ No se encontraron datos en método alternativo');
            resolve(null);
          }
        },
        (error) => {
          console.error('❌ Error en método alternativo:', error);
          reject(error);
        }
      );
    });
  }

  openEventDetails(event: Event, modal: any) {
    console.log('🎯 Abriendo detalles del evento:', event);
    
    // Mostrar loading y abrir modal inmediatamente
    this.loadingEventDetails = true;
    this.selectedEvent = event; // Mostrar datos básicos mientras se cargan los completos
    const modalRef = this.modalService.open(modal, { size: 'lg' });
    
    // Hacer una consulta específica para obtener los datos completos del evento
    this.getEventDetails(event.id).then((fullEvent) => {
      console.log('📦 Datos completos obtenidos:', fullEvent);
      this.selectedEvent = fullEvent || event; // Usar datos completos o evento original como fallback
      this.loadingEventDetails = false;
      this.cd.detectChanges(); // Forzar actualización de la vista
    }).catch((error) => {
      // En caso de error, usar el evento original
      console.error('💥 Error al cargar detalles completos:', error);
      this.selectedEvent = event;
      this.loadingEventDetails = false;
      this.cd.detectChanges();
    });
  }


  getAllAppointments() {
    this.api.getData('appointment/getall').subscribe(
      (resp: any) => {
        console.log('📋 Respuesta completa de getAllAppointments:', resp);
        if (resp.data && resp.data.length > 0) {
          console.log('📊 Primer evento de ejemplo:', resp.data[0]);
          console.log('🔎 Campos disponibles:', Object.keys(resp.data[0]));
        }
        
        this.events = resp.data.map((event: any) => ({
          id: event.id,
          id_order: event.id_order || '',
          title: event.client,
          start: event.appointment,
          end: event.end_appointment,
          personal: event.personal,
          id_subsidiary: event.id_subsidiary,
          service: event.service,
          service_name: event.service_name,           // ✅ nuevo
          subsidiary_name: event.subsidiary_name,     // ✅ nuevo
          color: event.color || this.generateRandomColor()
        }));

        console.log('✅ Eventos mapeados:', this.events);
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
    return this.events
      .filter(event => new Date(event.start).toDateString() === this.currentDate.toDateString())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  getEventsForDay(day: Date): Event[] {
    return this.events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === day.getFullYear() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getDate() === day.getDate() &&
        (!this.selectedSubsidiary || event.id_subsidiary === this.selectedSubsidiary)
      );
    });

    /* return this.events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === day.getFullYear() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getDate() === day.getDate()
      );
    }); */
  }



  /* getEventsForDay(day: Date): Event[] {
    return this.events.filter(event => new Date(event.start).toDateString() === day.toDateString());
  } */

  isPast(event: Event): boolean {
    return new Date(event.start).getTime() < new Date().getTime();
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
      id: '',
      id_order: '',
      title: '',
      start: isoDate,
      startTime: '12:00',
      endTime: '',
      color: this.generateRandomColor(), // 🟢 Color aleatorio siempre
      personal: '',
      id_subsidiary: '',
      service: ''
    };
    this.updateEndTime(); // ✅ Cálculo automático al abrir modal
    this.editing = false;
    this.modalService.open(this.eventModal); // 🟢 Ahora se abre sin importar si ya hay eventos en el día
  }

  saveEvent() {
    if (this.isSaving) return;
    this.isSaving = true;
    const startDate = new Date(`${this.eventForm.start}T${this.eventForm.startTime}`);
    const endDate = new Date(`${this.eventForm.start}T${this.eventForm.endTime}`);

    // Validar traslape
    const conflict = this.events.some(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(eventStart); // Suponemos duración similar, 30 mins o end_appointment si lo tienes
      eventEnd.setMinutes(eventEnd.getMinutes() + 15);

      // Verificamos si hay traslape y mismo doctor o sucursal
      return (
        event.personal === this.eventForm.personal &&
        startDate < eventEnd && endDate > eventStart
      );
    });

    if (conflict) {
      Swal.fire({
        icon: 'warning',
        title: 'Conflicto de horario',
        text: 'Ya existe una cita registrada en este horario para este doctor.',
      });
      return;
    }

    // Si no hay conflicto, procedemos a guardar
    this.eventForm.color = this.generateRandomColor();
    const eventData = {
      id_order: this.eventForm.id_order,
      client: this.eventForm.title,
      personal: this.eventForm.personal,
      id_subsidiary: this.eventForm.id_subsidiary,
      service: this.eventForm.service,
      appointment: `${this.eventForm.start} ${this.eventForm.startTime}:00`,
      end_appointment: `${this.eventForm.start} ${this.eventForm.endTime}:00`,
      color: this.eventForm.color
    };

    this.api.createData('appointment/setappointment', eventData).subscribe(
      (resp: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Cita agendada',
          text: resp.msg
        });
        
        // Pequeño delay para asegurar que la BD se actualice antes de recargar
        setTimeout(() => {
          if (this.selectedSubsidiary) {
            this.getAppointmentsBySubsidiary(this.selectedSubsidiary);
          } else {
            this.getAllAppointments(); // Recargar con datos completos
          }
        }, 300);
        
        this.modalService.dismissAll();
      },
      (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al agendar',
          text: error.error?.msg || error.msg || 'Error al crear la cita'
        });
        console.error('Error al guardar evento:', error);
      }
    );
    this.isSaving = false;
  }

  getMyInfo() {
    this.api.getDataById('user/getbyid', this.id).subscribe(
      (resp: any) => {
        this.doctors = resp.data
      },
      (error) => {
        console.log(error.error);
      }
    );
  }

  getOrdersByDoctor() {
    this.api.getDataById('order/getbydoctor', this.name + ' ' + this.lastname).subscribe(
      (resp: any) => {
        this.catalogOrders = resp.data;
      },
      (error) => {
        console.log(error.error);
      }
    );
  }
  getOrders(name: String, lastname: String) {
    this.api.getDataById('order/getbydoctor', name + ' ' + lastname).subscribe(
      (resp: any) => {
        this.catalogOrders = resp.data;
      },
      (error) => {
        console.log(error.error);
      }
    );
  }

  getDoctors() {
    this.api.getData('catalog/getdoctors').subscribe(
      (resp: any) => {
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
    this.api.getData('catalog/getclients').subscribe(
      (resp: any) => {
        this.clients = resp.data;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  deleteEvent(id: string, event: MouseEvent) {
    event.stopPropagation();

    Swal.fire({
      title: '¿Eliminar cita?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteData('appointment/delete', id).subscribe(
          (resp: any) => {
            Swal.fire({
              icon: 'success',
              title: 'Cita eliminada',
              text: resp.msg,
              confirmButtonColor: '#198754'
            }).then(() => {
              if (this.selectedSubsidiary) {
                this.getAppointmentsBySubsidiary(this.selectedSubsidiary); // 🔄 Cargar nuevamente por sucursal
              } else {
                this.getAllAppointments(); // Fallback
              }
            });
          },
          (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error.msg || 'No se pudo eliminar la cita.',
              confirmButtonColor: '#198754'
            });
          }
        );
      }
    });
  }


  // 🟢 Cargar todas las sucursales desde la API
  getAllSubsidiary() {
    this.api.getData('subsidiary/getall').subscribe(
      (resp: any) => {
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

  open(content: TemplateRef<any>) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title', size: 'xl' }).result.then(
      (result) => {
        this.closeResult.set(`Closed with: ${result}`);
      },
      (reason) => {
        this.closeResult.set(`Dismissed ${this.getDismissReason(reason)}`);
      },
    );
  }

  cashcut() {
    Swal.fire({
      title: "Cortar Caja",
      icon: 'info',
      text: '¿Desea cortar caja?',
      showDenyButton: true,
      confirmButtonText: "Sí",
      denyButtonText: "No"
    }).then((result) => {
      if (result.isConfirmed) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const currentDate = `${yyyy}-${mm}-${dd}`;

        // Generar opciones dinámicas para el select
        const options = this.subsidiaries.map(sub => `
        <option value="${sub.id}">${sub.name}</option>
      `).join('');

        Swal.fire({
          title: 'Datos del Corte',
          html: `
          <label for="subsidiary">Sucursal:</label>
          <select id="subsidiary" class="swal2-input">
            <option value="" disabled selected>Seleccione una sucursal</option>
            ${options}
          </select>
          <label for="start_time">Hora Inicio:</label>
          <input type="time" id="start_time" class="swal2-input" />
          <label for="end_time">Hora Fin:</label>
          <input type="time" id="end_time" class="swal2-input" />
        `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: 'Guardar Corte',
          cancelButtonText: 'Cancelar',
          preConfirm: () => {
            const subsidiary = (document.getElementById('subsidiary') as HTMLSelectElement).value;
            const start_time = (document.getElementById('start_time') as HTMLInputElement).value;
            const end_time = (document.getElementById('end_time') as HTMLInputElement).value;

            if (!subsidiary || !start_time || !end_time) {
              Swal.showValidationMessage('Todos los campos son obligatorios');
              return false;
            }

            const start_date = `${currentDate}T${start_time}:00`;
            const end_date = `${currentDate}T${end_time}:00`;

            if (start_date >= end_date) {
              Swal.showValidationMessage('La hora de fin debe ser mayor a la de inicio');
              return false;
            }

            return { subsidiary, start_date, end_date };
          }
        }).then((formResult) => {
          if (formResult.isConfirmed && formResult.value) {
            const cash_cut = {
              id_user: this.id,
              id_subsidiary: formResult.value.subsidiary,
              start_date: formResult.value.start_date,
              end_date: formResult.value.end_date,
              total: 0
            };

            this.api.createData('cashcut/create', cash_cut).subscribe(
              (resp: any) => {
                Swal.fire({
                  icon: 'success',
                  title: 'Exito',
                  text: resp.msg
                });
                this.idCashcut = resp.data;
                setTimeout(() => {
                  this.api.createData('cashcut/update-total', { id_cashcut: this.idCashcut }).subscribe(
                    (resp: any) => {
                      Swal.fire({
                        icon: 'success',
                        title: 'Éxito',
                        text: resp.msg
                      });
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
                }, 500);

                /* this.api.createData('cashcut/update-total', {id_cashcut: this.idCashcut}).subscribe(
                  (resp: any)=>{
                    console.log("entra");
                    console.log(resp);
                    Swal.fire({
                  icon: 'success',
                  title: 'Éxito',
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
                ); */
              }, (error) => {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: error.error
                });
              });
          }
        });
      } else if (result.isDenied) {
        Swal.fire("Corte Cancelado", "", "info");
      }
    });
  }





  private getDismissReason(reason: any): string {
    switch (reason) {
      case ModalDismissReasons.ESC:
        return 'by pressing ESC';
      case ModalDismissReasons.BACKDROP_CLICK:
        return 'by clicking on a backdrop';
      default:
        return `with: ${reason}`;
    }
  }



  onBarcodeInput(value: string) {
    this.barcodeBuffer = value;

    if (this.barcodeTimer) {
      clearTimeout(this.barcodeTimer);
    }

    this.barcodeTimer = setTimeout(() => {
      const code = this.barcodeBuffer.trim();
      if (code) {
        this.procesarCodigo(code);
      }
      this.barcodeBuffer = '';
    }, 100); // espera 100ms sin escritura antes de procesar
  }

  procesarCodigo(codigo: string) {
    this.getByBarcode(codigo);
  }

  getByBarcode(code: string) {
    this.api.getDataById('appointment/getbybarcode', code).subscribe(
      (resp: any) => {
        this.appointment = resp.data[0];

      },
      (error) => {
        console.error('Error en getByBarcode:', error);
      }
    );
  }

  checkAppointment(id: string) {
    Swal.fire({
      title: "Cobrar servicio",
      icon: 'info',
      html: `¿Desea cobrar el servicio?`,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#d33',
      showConfirmButton: true,
      showCancelButton: true
    }).then((resp) => {
      if (resp.isConfirmed) {
        // 🔽 Mostrar modal para seleccionar método de pago y monto
        Swal.fire({
          title: 'Registrar pago',
          html: `
          <select id="paymentMethod" class="swal2-select" style="width: 100%; margin-bottom: 1rem;">
            <option value="" disabled selected>Seleccione método</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Otro">Otro</option>
          </select>
          <input id="paymentAmount" type="number" step="0.01" class="swal2-input" placeholder="Cantidad pagada">
        `,
          showCancelButton: true,
          confirmButtonText: 'Registrar pago',
          cancelButtonText: 'Cancelar',
          preConfirm: () => {
            const method = (document.getElementById('paymentMethod') as HTMLSelectElement).value;
            const amount = parseFloat((document.getElementById('paymentAmount') as HTMLInputElement).value);
            if (!method || isNaN(amount) || amount <= 0) {
              Swal.showValidationMessage('Debe seleccionar un método y una cantidad válida');
              return false;
            }
            return { method, amount };
          }
        }).then((result) => {
          if (result.isConfirmed && result.value) {
            const payment = {
              id_appointment: id,
              method: result.value.method,
              amount: result.value.amount,
              status: 'Pagado'
            };

            // Primero registrar el pago
            this.api.createData('payment/create', [payment]).subscribe(
              (res: any) => {
                Swal.fire({
                  title: 'Pago registrado',
                  icon: 'success',
                  text: res.msg || 'El pago fue registrado correctamente.',
                  confirmButtonColor: '#198754'
                }).then(() => {
                  // Solo si el pago fue exitoso, cobrar el servicio
                  this.api.deleteData('appointment/delete', id).subscribe(
                    (data: any) => {
                      Swal.fire({
                        title: 'Servicio cobrado',
                        icon: 'success',
                        text: data.msg,
                        confirmButtonColor: '#198754'
                      }).then(() => {
                        this.getAppointmentsBySubsidiary(this.selectedSubsidiary);
                        /* this.getAllAppointments(); */ // Recargar citas
                      });
                    },
                    (error) => {
                      Swal.fire({
                        title: 'Error al cobrar',
                        icon: 'error',
                        text: error.error.msg || 'No se pudo cobrar el servicio.',
                        confirmButtonColor: '#d33'
                      });
                    }
                  );
                });
              },
              (err) => {
                console.log(err);
                Swal.fire({
                  title: 'Error al registrar el pago',
                  icon: 'error',
                  text: err.error.msg || 'Ocurrió un error al guardar el pago.',
                  confirmButtonColor: '#d33'
                });
              }
            );
          }
        });
      }
    });

    this.loadData();
  }



  onSubsidiaryChange() {
    if (this.selectedSubsidiary) {
      this.getAppointmentsBySubsidiary(this.selectedSubsidiary);
    } else {
      this.events = []; // Limpiar eventos si se deselecciona
    }
  }

  getAppointmentsBySubsidiary(id: string) {
    this.api.getDataById('appointment/getbysubsidiary', id).subscribe(
      (resp: any) => {
        console.log('📋 Respuesta de getAppointmentsBySubsidiary:', resp);
        if (resp.data && resp.data.length > 0) {
          console.log('📊 Primer evento por sucursal:', resp.data[0]);
          console.log('🔎 Campos disponibles:', Object.keys(resp.data[0]));
        }
        
        this.events = resp.data.map((event: any) => ({
          id: event.id,
          id_order: event.id_order || '',
          title: event.client,
          start: event.appointment,
          end: event.end_appointment,
          personal: event.personal,
          id_subsidiary: event.id_subsidiary,
          service: event.service,
          service_name: event.service_name,
          subsidiary_name: event.subsidiary_name,
          color: event.color || this.generateRandomColor()
        }));
        
        console.log('✅ Eventos por sucursal mapeados:', this.events);
      },
      (error) => {
        console.error('Error al cargar citas por sucursal:', error);
      }
    );
  }

}
