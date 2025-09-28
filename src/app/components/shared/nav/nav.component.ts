import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, NgZone, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CeraorService } from '../../../services/ceraor.service';
import { PermissionsService } from '../../../services/permissions.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-nav',
  standalone: false,
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent implements OnInit {
  isDarkMode$: any;
  permissions: any;
  user: string;
  dropdownVisible: boolean = false;
  @Input() sidebarOpen: boolean = false;
  @Output() toggle = new EventEmitter<void>();
  id: any;
  userRole: string;
  userProfileImage: string = 'assets/profile.png';
  
  userEdit = {
    name: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    image: null,
    professional_id: null,
  };
  
  originalUserData = {
    name: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    image: null,
    professional_id: null,
  };

  previewImage: string = '';
  loadingImage: boolean = false;
  uploadProgress: number = 0;

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.loadingImage = true;
    this.uploadProgress = 0;

    const reader = new FileReader();

    reader.onprogress = (e: ProgressEvent<FileReader>) => {
      if (e.lengthComputable) {
        this.uploadProgress = Math.round((e.loaded / e.total) * 100);
      }
    };

    reader.onload = () => {
      this.previewImage = reader.result as string;
      this.userEdit.image = this.previewImage;
      this.uploadProgress = 100;

      setTimeout(() => {
        this.loadingImage = false;
      }, 300);
    };

    reader.onerror = () => {
      console.error('Error leyendo imagen');
      this.loadingImage = false;
    };

    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.previewImage = 'assets/profile.png';
    this.userEdit.image = null;
  }

  updateUser() {
    // Create an object to store only the modified fields
    const changedFields: any = {};

    // Compare each field and only include those that have changed
    Object.keys(this.userEdit).forEach(key => {
      if (this.userEdit[key] !== this.originalUserData[key]) {
        changedFields[key] = this.userEdit[key];
      }
    });

    // Only proceed with the update if there are changes
    if (Object.keys(changedFields).length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No se han detectado cambios para actualizar'
      });
      return;
    }

    this.api.updateData('user/updatedata', this.id, changedFields).subscribe(
      (resp: any) => {
        // Update originalUserData with the new values
        Object.assign(this.originalUserData, changedFields);
        
        Swal.fire({
          icon: 'success',
          title: 'Actualización',
          text: resp.msg
        });
      },
      (error) => {
        console.log(error);
        Swal.fire({
          icon: 'error',
          title: 'Error al Actualizar',
          text: error.error.msg
        });
      }
    );
  }

  constructor(
    private api: CeraorService,
    private permissionsService: PermissionsService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private zone: NgZone,
    private themeService: ThemeService
  ) {
    this.getInfo();
  }

  getInfo() {
    this.permissionsService.getId().subscribe(
      (resp) => {
        this.id = resp;
      },
      (error) => {
        console.log(error);
      }
    );
    this.permissionsService.getRol().subscribe(
      (resp) => {
        this.userRole = resp;
      }
    );
  }

  ngOnInit(): void {
    this.loadPermissions();
    this.user = localStorage.getItem('userName') || '';
    this.getUser();
    this.isDarkMode$ = this.themeService.darkMode$;
  }

  toggleSidebar() {
    this.toggle.emit();
  }

  toggleDropdown(): void {
    this.dropdownVisible = !this.dropdownVisible;
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
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
      showCancelButton: true,
      cancelButtonText: "Cancelar"
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

  getUser() {
    this.api.getDataById('user/getinstance', this.id).subscribe(
      (resp: any) => {
        console.log(resp);
        // Store original data
        this.originalUserData = {
          name: resp.data[0].name,
          lastname: resp.data[0].lastname,
          email: resp.data[0].email,
          address: resp.data[0].address,
          phone: resp.data[0].phone,
          professional_id: resp.data[0].professional_id,
          image: resp.data[0].image
        };

        // Set current edit data
        this.userEdit = { ...this.originalUserData };

        const imageFromAPI = resp.data[0].image;

        if (typeof imageFromAPI === 'string' && imageFromAPI.startsWith('data:image')) {
          this.previewImage = imageFromAPI;
        } else {
          this.previewImage = 'assets/profile.png';
        }
        if (typeof this.userEdit.image === 'string' && this.userEdit.image.startsWith('data:image')) {
          this.userProfileImage = this.userEdit.image;
        } else {
          this.userProfileImage = 'assets/profile.png';
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }
}