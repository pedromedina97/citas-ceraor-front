import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, NgZone, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CeraorService } from '../../../services/ceraor.service';
import { PermissionsService } from '../../../services/permissions.service';

@Component({
  selector: 'app-nav',
  standalone: false,
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent implements OnInit {

  permissions: any;
  user: string;
  dropdownVisible: boolean = false;
  @Input() sidebarOpen: boolean = false;
  @Output() toggle = new EventEmitter<void>();

  constructor(private api: CeraorService, private permissionsService: PermissionsService, private cd: ChangeDetectorRef, private router: Router, private zone: NgZone) { }


  ngOnInit(): void {
    this.loadPermissions();
    this.user = localStorage.getItem('userName') || ''; // Asigna el valor en ngOnInit
  }

  toggleSidebar() {
    this.toggle.emit();
  }

  toggleDropdown(): void {
    this.dropdownVisible = !this.dropdownVisible;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.dropdownVisible = false;
    }
  }



  logout() {
    Swal.fire({
      title: "Cerrar Sesión",
      icon: 'info',
      text: `¿Desea salir?`,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#d33',
      showConfirmButton: true,
      showCancelButton: true
    }).then((resp) => {
      if (resp.isConfirmed) {
        Swal.fire({
          title: 'Hasta Pronto',
          icon: 'success',
          confirmButtonColor: '#198754'
        });
        this.api.logout();
        this.router.navigateByUrl('/login');
      }
    });

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

