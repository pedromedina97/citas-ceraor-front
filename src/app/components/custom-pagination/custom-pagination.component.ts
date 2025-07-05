import { Component, EventEmitter, Output } from '@angular/core';
import { PaginationInstance } from 'ngx-pagination';

@Component({
  selector: 'app-custom-pagination',
  standalone: false,
  templateUrl: './custom-pagination.component.html',
  styleUrl: './custom-pagination.component.scss'
})
export class CustomPaginationComponent {
  @Output() pageChange: EventEmitter<number> = new EventEmitter();
}
