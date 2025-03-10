import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CeraorService } from '../../services/ceraor.service';
interface Event {
  id: number;
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
export class AgendaComponent implements OnInit{
  @ViewChild('eventModal') eventModal!: TemplateRef<any>;
  currentDate: Date = new Date();
  view: string = 'month';
  events: Event[] = [];
  subsidiaries: any;
  
  eventForm: EventForm = {
    id: 0,
    title: '',
    start: '',
    startTime: '',
    endTime: '',
    color: '#007bff',
    personal: '',
    id_subsidiary: '',
    service: ''
};

  
  editing: boolean = false;

  constructor(private modalService: NgbModal, private api: CeraorService) {}

  ngOnInit(): void {
    this.getAllAppointments(); // Cargar eventos desde la API al iniciar
    this.getAllSubsidiary();  // Cargar sucursales
  }

  // 🟢 Método para obtener todos los eventos desde la API
  getAllAppointments() {
    this.api.getData('appointment/getall').subscribe(
      (resp: any) => {
        console.log('Eventos cargados:', resp.data);
        this.events = resp.data.map((event: any) => ({
          id: event.id,
          title: event.client, // Puedes modificarlo si el evento tiene otro campo de título
          start: event.appointment,
          color: '#007bff', // Se puede cambiar si la API lo proporciona
          personal: event.personal,
          id_subsidiary: event.id_subsidiary,
          service: event.service
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
    let daysInMonth = new Date(year, month + 1, 0).getDate();

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

  getDayEvents(): Event[] {
    return this.events.filter(event => new Date(event.start).toDateString() === this.currentDate.toDateString());
  }

  getEventsForDay(day: Date): Event[] {
    return this.events.filter(event => new Date(event.start).toDateString() === day.toDateString());
  }

  openModal(day: Date) {
    this.eventForm = {
      id: Date.now(),
      title: '',
      start: day.toISOString().slice(0, 10), // Solo la fecha
      startTime: '12:00',
      endTime: '13:00',
      color: '#007bff',
      personal: '',
      id_subsidiary: '',
      service: ''
    };
    this.editing = false;
    this.modalService.open(this.eventModal);
  }

  saveEvent() {
    const startDate = new Date(`${this.eventForm.start}T${this.eventForm.startTime}`);
    const endDate = new Date(`${this.eventForm.start}T${this.eventForm.endTime}`);

    const eventData = {
        client: this.eventForm.title,
        personal: this.eventForm.personal,
        id_subsidiary: this.eventForm.id_subsidiary,
        service: this.eventForm.service,
        appointment: startDate.toISOString(),
        end_appointment: endDate.toISOString()
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

}
