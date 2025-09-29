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
  private eventsForSlots: Event[] = [];

  timeSlots: Array<{
    slot_start: string;
    slot_end: string;
    status: 'available' | 'occupied';
  }> = [];
  canSelectDateTime: boolean = false;

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

  searchDoctorText: string = '';
  filteredDoctors: any[] = [];
  searchOrderText: string = '';
  filteredOrders: any[] = [];
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
  searchClientText: string = '';
  filteredClients: any[] = [];
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

  isSunday(day: Date): boolean {
    return day.getDay() === 0;
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

    // Encontrar el slot seleccionado
    const selectedSlot = this.timeSlots.find(slot => {
      const slotTime = new Date(slot.slot_start).toTimeString().substring(0, 5);
      return slotTime === this.eventForm.startTime;
    });

    if (selectedSlot) {
      this.eventForm.endTime = new Date(selectedSlot.slot_end).toTimeString().substring(0, 5);
    }
  }

  // 🟢 Método para validar si todos los campos requeridos del formulario están llenos
  isFormValid(): boolean {
    const requiredFields = {
      'Cliente': this.eventForm.title?.trim() !== '',
      'Fecha': this.eventForm.start?.trim() !== '',
      'Horario': this.eventForm.startTime?.trim() !== '',
      'Sucursal': this.eventForm.id_subsidiary?.trim() !== '',
      'Servicio': this.eventForm.service?.trim() !== ''
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, isValid]) => !isValid)
      .map(([fieldName]) => fieldName);

    if (missingFields.length > 0) {
      console.log('Campos faltantes:', missingFields.join(', '));
      return false;
    }

    // Verificar que el horario seleccionado siga disponible
    const selectedSlot = this.timeSlots.find(slot => 
      new Date(slot.slot_start).toTimeString().substring(0, 5) === this.eventForm.startTime
    );

    if (!selectedSlot || selectedSlot.status !== 'available') {
      console.log('El horario seleccionado no está disponible');
      return false;
    }

    return true;
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

    // Verificar si es domingo (0 = domingo en getDay())
    if (day.getDay() === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Día no disponible',
        text: 'No se pueden agendar citas los días domingo.',
        confirmButtonColor: '#198754'
      });
      return;
    }

    // Si es sábado, mostrar mensaje informativo sobre horario limitado
    if (day.getDay() === 6) {
      Swal.fire({
        icon: 'info',
        title: 'Horario limitado',
        text: 'Los sábados solo se pueden agendar citas hasta las 2:45 PM.',
        confirmButtonColor: '#198754'
      });
    }


    // 🟢 Verificar si el clic ocurrió dentro de un evento
    if (event) {
      const targetElement = event.target as HTMLElement;
      if (targetElement.closest('.event')) return; // Si se hizo clic en un evento, no abrir el modal de creación
    }

    const isoDate = day.toISOString().slice(0, 10); // Formato YYYY-MM-DD

    // Limpiar el formulario y estados
    this.resetEventForm();
    this.eventsForSlots = [];
    
    // Establecer la fecha seleccionada
    this.eventForm.start = isoDate;

    // Si es doctor, establecemos el texto de búsqueda y filtramos las órdenes
    if (this.rol === 'Doctor') {
      this.searchDoctorText = `${this.name} ${this.lastname}`;
      this.getOrders(this.name, this.lastname);
    }
    // Si es recepcionista, cargamos todas las órdenes
    else if (this.rol === 'Recepcionista') {
      this.getAllOrders();
    }
    this.updateEndTime(); // ✅ Cálculo automático al abrir modal
    this.editing = false;
    this.modalService.open(this.eventModal, { 
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    }); // Modal más grande y previene cierre accidental
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
    
    // Encontrar el slot seleccionado para usar sus tiempos exactos
    const selectedSlot = this.timeSlots.find(slot => 
      new Date(slot.slot_start).toTimeString().substring(0, 5) === this.eventForm.startTime
    );

    if (!selectedSlot) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El horario seleccionado ya no está disponible.'
      });
      return;
    }

    // Validar que el cliente no sea null o vacío
    if (!this.eventForm.title || this.eventForm.title.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre del cliente es obligatorio'
      });
      return;
    }

    const eventData = {
      id_order: this.eventForm.id_order || '',
      client: this.eventForm.title.trim(),
      personal: this.eventForm.personal || '',
      id_subsidiary: this.eventForm.id_subsidiary,
      service: this.eventForm.service,
      appointment: selectedSlot.slot_start,
      end_appointment: selectedSlot.slot_end,
      color: this.eventForm.color
    };

    console.log('Datos a enviar:', eventData);
    
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
        
        this.resetEventForm();
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
  getAllOrders() {
    this.api.getData('order/getall').subscribe(
      (resp: any) => {
        this.catalogOrders = resp.data;
        this.filteredOrders = resp.data;
      },
      (error) => {
        console.log(error.error);
      }
    );
  }

  // Método para filtrar órdenes
  filterOrders() {
    if (!this.searchOrderText) {
      this.filteredOrders = this.catalogOrders;
      return;
    }

    const searchText = this.searchOrderText.toLowerCase();
    this.filteredOrders = this.catalogOrders.filter((order: any) => {
      return (
        order.patient?.toLowerCase().includes(searchText) ||
        order.doctor?.toLowerCase().includes(searchText) ||
        order.created_at?.toLowerCase().includes(searchText) ||
        order.service_name?.toLowerCase().includes(searchText)
      );
    });
  }

  // Método para seleccionar una orden
  selectOrder(order: any) {
    this.eventForm.id_order = order.id;
    this.searchOrderText = `${order.patient} - ${order.created_at}`;
    
    // Si la orden tiene una sucursal asignada, la seleccionamos y cargamos sus servicios
    if (order.id_subsidiary) {
      this.eventForm.id_subsidiary = order.id_subsidiary;
      this.getServices(order.id_subsidiary);
    }

    // Limpiar la lista de órdenes filtradas para ocultar el dropdown
    this.filteredOrders = [];
  }

  getOrders(name: String, lastname: String) {
    // Si es recepcionista, obtener todas las órdenes
    if (this.rol === 'Recepcionista') {
      this.getAllOrders();
      return;
    }
    
    // Si no es recepcionista, obtener solo las órdenes del doctor
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
        this.filteredDoctors = [];
      },
      (error) => {
        console.log(error);
      }
    );
  }

  // Método para filtrar doctores
  filterDoctors() {
    if (!this.searchDoctorText) {
      this.filteredDoctors = [];
      return;
    }

    const searchText = this.searchDoctorText.toLowerCase();
    this.filteredDoctors = this.doctors.filter(doctor => 
      (doctor.name + ' ' + doctor.lastname).toLowerCase().includes(searchText)
    );
  }

  // Método para seleccionar un doctor
  selectDoctor(doctor: any) {
    this.eventForm.personal = doctor.name + ' ' + doctor.lastname;
    this.searchDoctorText = doctor.name + ' ' + doctor.lastname;
    this.filteredDoctors = [];
    // Solo filtramos las órdenes por doctor si no es recepcionista
    if (this.rol !== 'Recepcionista') {
      this.getOrders(doctor.name, doctor.lastname);
    }
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
        this.filteredClients = [];
      },
      (error) => {
        console.log(error);
      }
    );
  }

  // Método para filtrar clientes
  filterClients() {
    if (!this.searchClientText) {
      this.filteredClients = [];
      return;
    }

    const searchText = this.searchClientText.toLowerCase();
    this.filteredClients = this.clients.filter(client => 
      (client.name + ' ' + client.lastname).toLowerCase().includes(searchText) ||
      client.email?.toLowerCase().includes(searchText)
    );
  }

  // Método para seleccionar un cliente
  selectClient(client: any) {
    this.eventForm.title = client.name + ' ' + client.lastname;
    this.searchClientText = client.name + ' ' + client.lastname;
    this.filteredClients = [];
  }

  // Método para formatear el nombre del cliente
  formatClientName() {
    if (this.eventForm.title) {
      this.eventForm.title = this.eventForm.title
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .trim();
    }
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

  /* getServices(id: string) {
    this.services = []; // Limpiar servicios anteriores
    this.api.getDataById('service/getbysubsidiary', id).subscribe(
      (resp: any) => {
        this.services = resp.data;
        this.canSelectDateTime = true;
        this.calculateAvailableTimeSlots();
      },
      (error) => {
        console.error('Error al cargar servicios:', error);
      }
    );
  } */
  getServices(id: string) {
    this.services = []; // Limpiar servicios anteriores
    
    // Si no hay fecha seleccionada en el formulario, usar la fecha actual
    if (!this.eventForm.start) {
      this.eventForm.start = new Date().toISOString().slice(0, 10);
    }
  
    // 1) Cargar servicios de la sucursal
    this.api.getDataById('service/getbysubsidiary', id).subscribe(
      (resp: any) => {
        this.services = resp.data;
        
        // 2) Cargar horarios disponibles
        this.getAvailableTimeSlots();
        this.canSelectDateTime = true;
      },
      (error) => {
        console.error('Error al cargar servicios:', error);
      }
    );
  }
    

    private async fetchDayEventsForSubsidiary(dateISO: string, subsidiaryId: string): Promise<void> {
      return new Promise((resolve, reject) => {
        this.api.getDataById('appointment/getbysubsidiary', subsidiaryId).subscribe(
          (resp: any) => {
            const all = (resp?.data || []) as any[];
    
            // Mapea al tipo Event y filtra por el día exacto
            const mapped: Event[] = all.map(ev => ({
              id: ev.id,
              id_order: ev.id_order || '',
              title: ev.client,
              start: ev.appointment,
              end: ev.end_appointment,
              personal: ev.personal,
              id_subsidiary: ev.id_subsidiary,
              service: ev.service,
              service_name: ev.service_name,
              subsidiary_name: ev.subsidiary_name,
              color: ev.color || this.generateRandomColor()
            }));
    
            const selectedDate = new Date(dateISO);
            this.eventsForSlots = mapped.filter(e => {
              const d = new Date(e.start);
              return d.getFullYear() === selectedDate.getFullYear()
                  && d.getMonth() === selectedDate.getMonth()
                  && d.getDate() === selectedDate.getDate();
            });
    
            resolve();
          },
          (error) => {
            console.error('Error al cargar citas del día por sucursal:', error);
            this.eventsForSlots = [];
            resolve(); // resolvemos vacío para no romper el flujo
          }
        );
      });
    }
    
    

  onServiceSelected() {
    if (this.eventForm.id_subsidiary && this.eventForm.service) {
      this.canSelectDateTime = true;
      if (this.eventForm.start) {
        this.calculateAvailableTimeSlots();
      }
    }
    console.log('Can select date time:', this.canSelectDateTime);
  }

  calculateAvailableTimeSlots() {
    if (this.eventForm.id_subsidiary && this.eventForm.start) {
      this.getAvailableTimeSlots();
    }
  }

  getAvailableTimeSlots() {
   this.api.getData(`appointment/getavaliables/${this.eventForm.id_subsidiary}/${this.eventForm.start}`).subscribe(
    (resp: any) => {
      this.timeSlots = resp.data;
      console.log('Horarios disponibles:', this.timeSlots);
    },
    (error) => {
      console.error('Error al cargar horarios disponibles:', error);
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

  resetEventForm() {
    // Limpiar el formulario principal
    this.eventForm = {
      id: '',
      id_order: '',
      title: '',
      start: new Date().toISOString().slice(0, 10), // Mantener la fecha actual
      startTime: '',
      endTime: '',
      color: this.generateRandomColor(),
      personal: this.rol === 'Doctor' ? `${this.name} ${this.lastname}` : '', // Mantener si es doctor
      id_subsidiary: '',
      service: ''
    };

    // Limpiar campos de búsqueda
    this.searchClientText = '';
    this.searchDoctorText = '';
    this.searchOrderText = '';

    // Limpiar resultados de búsqueda
    this.filteredClients = [];
    this.filteredDoctors = [];
    this.filteredOrders = [];

    // Limpiar horarios
    this.timeSlots = [];
    this.canSelectDateTime = false;

    // Resetear modo de entrada de cliente
    this.isManualClient = false;
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
