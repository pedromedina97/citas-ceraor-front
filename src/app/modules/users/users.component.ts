import { Component, OnInit, ChangeDetectorRef, NgZone} from '@angular/core';
import { Router } from '@angular/router';
import { CeraorService } from '../../services/ceraor.service';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';
import { PermissionsService } from '../../services/permissions.service';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit{
  permissions: any;
  users: any[] = [];
  filtered: any[] = [];
  nameFilter: string = '';
  emailFilter: string = '';
  rolFilter: string = '';
  dateFromFilter: string = '';
  dateToFilter: string = '';
  isLoading: boolean = true;
  dataInstance = {
    parentId: '',
    name: '',
    lastname: '',
    email: '',
    password: '',
    birthday: '',
    phone: '',
    related: '',
    address: '',
    id_rol: null
  }
  id: string;
  idUser: string;
  user: string = localStorage.getItem('userName');
  rol: string;
  rols: any;
  page: number = 1;
  itemsPerPage: number = 5;
  showPassword: boolean = false;
  private exclude: any;

  constructor(private api: CeraorService, private permissionsService: PermissionsService, private cd: ChangeDetectorRef, private router: Router, private zone: NgZone) {}

  ngOnInit() {
    this.setPermissions();
   
    this.setPetitions();
    this.getRols();
  }

  setPetitions(){
    if(this.rol == 'Owner' || this.rol == 'Superadmin' || this.rol == 'Admin' || this.rol == 'Operativo'){
      this.getData();
    } else if(this.rol == 'Doctor' || this.rol == 'Recepcionista'){
      this.getClients();
    }
  }

  setPermissions(){
    this.permissionsService.getId().subscribe(
      (value)=>{
        this.idUser = value;
        this.cd.detectChanges();
      }
    );
    this.permissionsService.getRol().subscribe(value => {
      this.rol = value;
      this.cd.detectChanges(); 
    });
  
    this.permissionsService.getPermissions().subscribe(value => {
      this.permissions = value;
      this.cd.detectChanges(); 
    });
  }
  

  updatePermissions(token: string){
    this.permissionsService.setPermissions(token);
  }

  hasPermissions(permission: string): boolean {
    return this.permissions && this.permissions.includes(permission);
  }

  canShow(option: string): boolean{
    return this.hasPermissions(option);
  }

  getData() {
    this.isLoading = true;
    this.api.getData('user/getall').subscribe(
      (data: any) => {
        console.log(data);
        this.users = data.data;
        this.filtered = [...this.users]; // Inicializa con todos los usuarios
        this.isLoading = false;
      },
      (error) => {
        console.log(error.error);
        Swal.fire({
          title: 'Error',
          text: 'Error al cargar los usuarios',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        this.isLoading = false;
      }
    );
  }


  filter() {
    this.filtered = this.users.filter(user => {
      // Filtro por nombre
      const nameMatch = !this.nameFilter || 
        (user.name + ' ' + user.lastname).toLowerCase().includes(this.nameFilter.toLowerCase());

      // Filtro por email
      const emailMatch = !this.emailFilter || 
        user.email.toLowerCase().includes(this.emailFilter.toLowerCase());

      // Filtro por rol
      const rolMatch = !this.rolFilter || 
        user.id_rol === this.rolFilter;

      // Filtro por fecha
      let dateMatch = true;
      if (this.dateFromFilter || this.dateToFilter) {
        const userDate = new Date(user.created_at);
        
        if (this.dateFromFilter) {
          const fromDate = new Date(this.dateFromFilter);
          dateMatch = dateMatch && userDate >= fromDate;
        }
        
        if (this.dateToFilter) {
          const toDate = new Date(this.dateToFilter);
          toDate.setHours(23, 59, 59); // Incluir todo el día final
          dateMatch = dateMatch && userDate <= toDate;
        }
      }

      return nameMatch && emailMatch && rolMatch && dateMatch;
    });
  }

  hasAnyFilter(): boolean {
    return !!(this.nameFilter || this.emailFilter || this.rolFilter || this.dateFromFilter || this.dateToFilter);
  }

  clearFilters(): void {
    this.nameFilter = '';
    this.emailFilter = '';
    this.rolFilter = '';
    this.dateFromFilter = '';
    this.dateToFilter = '';
    this.filter();
  }

  getInstance(user: any, id: string) {
    this.dataInstance = user;
    this.id = id;
    
    // Si el usuario tiene fecha de nacimiento, generar la contraseña
    if (this.dataInstance.birthday) {
      const generatedPassword = this.generatePasswordFromBirthday();
      if (generatedPassword) {
        this.dataInstance.password = generatedPassword;
        this.cd.detectChanges();
      }
    }
  }


  /**
   * Verifica si hay al menos un dato de contacto (email o teléfono)
   */
  hasContactInfo(): boolean {
    return !!(
      (this.dataInstance.email && this.dataInstance.email.trim()) ||
      (this.dataInstance.phone && this.dataInstance.phone.trim())
    );
  }

  /**
   * Genera una contraseña basada en la fecha de nacimiento en formato ddmmaa
   * más las primeras dos letras del nombre y apellido
   */
  private generatePasswordFromBirthday(): string {
    if (!this.dataInstance.birthday) {
      console.log('No hay fecha de nacimiento');
      return ''; // Retorna vacío si no hay fecha de nacimiento
    }

    // Formatear la fecha en ddmmaa
    // Usar split para obtener los componentes de la fecha directamente del string YYYY-MM-DD
    const [year, month, day] = this.dataInstance.birthday.split('-');
    const datePassword = `${day}${month}${year.slice(-2)}`;

    // Usar solo la fecha como contraseña
    console.log('Contraseña generada de fecha:', datePassword);
    return datePassword;
  }

  /**
   * Se ejecuta cuando cambia la fecha de nacimiento
   * Genera y establece automáticamente la contraseña
   */
  onBirthdayChange() {
    console.log('Fecha seleccionada:', this.dataInstance.birthday);
    // Generar la contraseña inmediatamente cuando se selecciona la fecha
    const generatedPassword = this.generatePasswordFromBirthday();
    console.log('Contraseña generada:', generatedPassword);
    if (generatedPassword) {
      this.dataInstance.password = generatedPassword;
      // Forzar la detección de cambios
      this.cd.detectChanges();
    }
  }

  create(form: NgForm) {
    if (form.invalid) {
      Swal.fire({
        title: 'Formulario inválido',
        icon: 'error',
        text: 'Por favor, complete todos los campos correctamente antes de enviar.',
        confirmButtonColor: '#198754'
      });
      return;
    }

    if (!this.hasContactInfo()) {
      Swal.fire({
        title: 'Datos de contacto requeridos',
        icon: 'warning',
        text: 'Debe proporcionar al menos un dato de contacto (email o teléfono).',
        confirmButtonColor: '#198754'
      });
      return;
    }
  
    this.dataInstance.parentId = this.idUser;
    this.dataInstance.related = this.user;
  
    this.api.createData('user/register', this.dataInstance).subscribe(
      (data: any) => {
        console.log(data);
        Swal.fire({
          title: 'Usuario Creado',
          icon: 'success',
          text: data.msg,
          confirmButtonColor: '#198754'
        });
  
        // Restablecer formulario
        form.resetForm();
        this.resetForm();
        this.setPetitions();
        // Cerrar modal
        this.closeModal('#createModal');
  
        // Actualizar la lista de usuarios
        this.setPermissions();
      },
      (error) => {
        console.log(error);
        Swal.fire({
          title: 'Error',
          icon: 'error',
          text: error.error.message,
          confirmButtonColor: '#198754'
        });
      }
    );
  }
  
  editInstance(form: NgForm) {
    if (form.invalid) {
      Swal.fire({
        title: 'Formulario inválido',
        icon: 'error',
        text: 'Por favor, complete todos los campos correctamente antes de enviar.',
        confirmButtonColor: '#198754'
      });
      return;
    }

    if (!this.hasContactInfo()) {
      Swal.fire({
        title: 'Datos de contacto requeridos',
        icon: 'warning',
        text: 'Debe proporcionar al menos un dato de contacto (email o teléfono).',
        confirmButtonColor: '#198754'
      });
      return;
    }
  
    this.api.updateData('user/updateuser', this.id, form.value).subscribe(
      (data: any) => {
        Swal.fire({
          title: 'Usuario Actualizado',
          icon: 'success',
          text: data.message,
          confirmButtonColor: '#198754'
        });
  
        // Restablecer formulario
        form.resetForm();
        this.resetForm();
  
        // Cerrar modal
        this.closeModal('#editModal');
  
        // Actualizar la lista de usuarios
      this.setPetitions();
      },
      (error) => {
        console.log(error);
        Swal.fire({
          title: 'Error',
          icon: 'error',
          text: error.error.message,
          confirmButtonColor: '#198754'
        });
      }
    );
  }
  closeModal(modalId: string) {
    const modalElement = document.querySelector(modalId) as HTMLElement;
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      modalInstance.hide();
  
      // Esperar un pequeño tiempo y eliminar el backdrop manualmente
      setTimeout(() => {
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        document.body.classList.remove('modal-open'); // Evita que la página quede bloqueada
      }, 300);
    }
  }
  
  

  delete(id: string, name: string) {
    Swal.fire({
      title: "Borrar Usuario",
      icon: 'info',
      text: `¿Desea borrar "${name}"?`,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#d33',
      showConfirmButton: true,
      showCancelButton: true
    }).then((resp)=>{
      if(resp.isConfirmed){
        this.api.deleteData('user/deleteuser', id).subscribe(
          (data: any) => {
            Swal.fire({
              title: 'Usuario Borrado',
              icon: 'success',
              text: data.message,
              confirmButtonColor: '#198754'
            });
            this.getData();
          },
          (error) => {
            Swal.fire({
              title: 'Error',
              icon: 'error',
              text: error.error.message,
              confirmButtonColor: '#198754'
            });
          }
        );
      } 
    });
  }

  /**
   * Restablece la contraseña de un usuario
   */
  resetPassword(userId: string, userName: string) {
    Swal.fire({
      title: 'Restablecer Contraseña',
      text: `¿Está seguro de restablecer la contraseña de "${userName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, restablecer',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar loading
        Swal.fire({
          title: 'Restableciendo contraseña...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Llamar al endpoint
        this.api.updateData(`user/resetpassword`, userId, {}).subscribe(
          (response: any) => {
            console.log(response);
            Swal.fire({
              title: 'Contraseña Restablecida',
              text: 'La contraseña se restableció a la fecha de nacimiento del usuario en formato DDMMYY.',
              icon: 'success',
              confirmButtonColor: '#198754'
            });
          },
          (error) => {
            console.log(error);
            Swal.fire({
              title: 'Error',
              text: error.error?.message || 'Error al restablecer la contraseña',
              icon: 'error',
              confirmButtonColor: '#198754'
            });
          }
        );
      }
    });
  }

  resetForm() {
    this.dataInstance = {
      parentId: '',
      name: '',
      lastname: '',
      email: '',
      password: '',
      birthday: '',
      phone: '',
      related: '',
      address: '',
      id_rol: null
    };
    this.showPassword = false; // Ocultar la contraseña al resetear
  }

  getRols(){
    this.api.getData('rol/getall').subscribe(
      (resp: any)=>{ 
        if (this.rol === 'Superadmin' || this.rol === 'Owner') {    
          this.exclude = ['Owner'];
          this.rols = resp.data.filter((rol: any) => !this.exclude.includes(rol.name));
        }
        if (this.rol === 'Admin') {    
          this.exclude = ['Owner', 'Superadmin', 'Admin'];
          this.rols = resp.data.filter((rol: any) => !this.exclude.includes(rol.name));
        }
        if (this.rol === 'Operativo') {    
          this.exclude = ['Owner', 'Superadmin', 'Admin', 'Operativo'];
          this.rols = resp.data.filter((rol: any) => !this.exclude.includes(rol.name));
        }
        if (this.rol === 'Doctor' || this.rol === 'Cliente') {    
          this.exclude = ['Owner', 'Superadmin', 'Admin', 'Operativo', 'Doctor', 'Recepcionista'];
          this.rols = resp.data.filter((rol: any) => !this.exclude.includes(rol.name));
        }
      },
      (error)=>{
        console.log(error);
      }
    );
  }

  capitalizeFirstLetter(field: 'name' | 'lastname'): void {
    if (this.dataInstance[field]) {
      // Dividir el texto en palabras
      const words = this.dataInstance[field].toLowerCase().split(' ');
      // Capitalizar la primera letra de cada palabra
      const capitalizedWords = words.map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      );
      // Unir las palabras y asignar de vuelta
      this.dataInstance[field] = capitalizedWords.join(' ');

      // Si tenemos fecha de nacimiento y ambos campos (nombre y apellido), generar contraseña
      if (this.dataInstance.birthday && this.dataInstance.name && this.dataInstance.lastname) {
        const generatedPassword = this.generatePasswordFromBirthday();
        if (generatedPassword) {
          this.dataInstance.password = generatedPassword;
        }
      }
    }
  }

  getClients(){
    this.isLoading = true;
    this.api.getDataById('user/getmyusers', this.idUser).subscribe(
      (resp: any) =>{
        this.users = resp.data;
        this.filtered = [...this.users];
        this.isLoading = false;
      },
      (error)=>{
        console.log(error);
        Swal.fire({
          icon: 'warning',
          title: 'Sin usuarios',
          text: error.error.msg
        });
        this.isLoading = false;
      }
    );
  }


}
