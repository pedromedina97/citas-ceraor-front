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
  id: any;
  userRole: string;
  userProfileImage: string = 'assets/profile.png'; // o null si no tiene imagen
  userEdit = {
    name: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    image: null,
    professional_id: null,
    /*  previewImage: '' */
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
    this.api.updateData('user/updateuser', this.id, this.userEdit).subscribe(
      (resp: any) => {
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
    // Aquí puedes llamar tu servicio para guardar los cambios.
  }



  constructor(private api: CeraorService, private permissionsService: PermissionsService, private cd: ChangeDetectorRef, private router: Router, private zone: NgZone) {
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
    this.user = localStorage.getItem('userName') || ''; // Asigna el valor en ngOnInit
    this.getUser();
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
        this.userEdit.name = resp.data[0].name;
        this.userEdit.lastname = resp.data[0].lastname;
        this.userEdit.email = resp.data[0].email;
        this.userEdit.address = resp.data[0].address;
        this.userEdit.phone = resp.data[0].phone;
        this.userEdit.professional_id = resp.data[0].professional_id;
        this.userEdit.image = resp.data[0].image;

        const imageFromAPI = resp.data[0].image;

        if (typeof imageFromAPI === 'string' && imageFromAPI.startsWith('data:image')) {
          this.previewImage = imageFromAPI;
        } else {
          this.previewImage = 'assets/profile.png'; // Imagen por defecto
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

