import { Component, ViewChild, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
interface Event {
  id: number;
  title: string;
  start: string;
  end: string;
  color: string;
}
@Component({
  selector: 'app-agenda',
  standalone: false,
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss'
})
export class AgendaComponent {
  @ViewChild('eventModal') eventModal!: TemplateRef<any>;
  currentDate = new Date();
  view: string = 'month';
  events: Event[] = [];
  eventForm: Event = { id: 0, title: '', start: '', end: '', color: '#007bff' };
  editing: boolean = false;

  constructor(private modalService: NgbModal) {}

  changeView(view: string) {
    this.view = view;
  }

  prev() {
    if (this.view === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    } else if (this.view === 'week' || this.view === 'day') {
      this.currentDate.setDate(this.currentDate.getDate() - 7);
    }
  }

  next() {
    if (this.view === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    } else if (this.view === 'week' || this.view === 'day') {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
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

  getEventsForDay(day: Date): Event[] {
    return this.events.filter(event => new Date(event.start).toDateString() === day.toDateString());
  }

  openModal(day: Date) {
    this.eventForm = { id: Date.now(), title: '', start: day.toISOString().slice(0, 16), end: day.toISOString().slice(0, 16), color: '#007bff' };
    this.editing = false;
    this.modalService.open(this.eventModal);
  }

  saveEvent() {
    if (this.editing) {
      let index = this.events.findIndex(e => e.id === this.eventForm.id);
      if (index !== -1) {
        this.events[index] = { ...this.eventForm };
      }
    } else {
      this.events.push({ ...this.eventForm });
    }
    this.modalService.dismissAll();
  }

  deleteEvent(id: number, event: MouseEvent) {
    event.stopPropagation(); // Detiene la propagación del evento para evitar que se active el modal al hacer clic en eliminar
    this.events = this.events.filter(e => e.id !== id);
  }
  
}
