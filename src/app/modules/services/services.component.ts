import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CeraorService } from '../../services/ceraor.service';
import { NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { PermissionsService } from '../../services/permissions.service';

@Component({
  selector: 'app-services',
  standalone: false,
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent implements OnInit, AfterViewInit {
  permissions: any;
  subsidiaries: any[] = [];
  subsidiary: string;
  filtered: any[] = [];
  filterText: string = '';
  services: any[] = [];
  id: string = '';
  dataInstance = {
    name: '',
    id_subsidiary: '',
    description: ''
  }
  remainingId: string;
  
  // Drag and drop properties
  selectedSubsidiary: any = null;
  allServices: any[] = [];
  subsidiaryServices: Map<string, any[]> = new Map(); // Servicios originales del backend
  pendingServices: Map<string, any[]> = new Map(); // Servicios temporales (locales)
  draggedService: any = null;
  isDragOver: boolean = false;
  hasUnsavedChanges: boolean = false;

  userId = localStorage.getItem('userId');

  // Formularios de creación
  newService = {
    name: '',
    description: ''
  };

  newSubsidiary = {
    id_user: this.userId,
    name: '',
    address: ''
  };

  constructor(private api: CeraorService, private permissionsService: PermissionsService, private cd: ChangeDetectorRef, private router: Router, private zone: NgZone){}

  ngOnInit(): void {
    this.getSubsidiaries();
    this.getAllServices();
  }

  ngAfterViewInit(): void {
    this.loadPermissions();
  }

  filter() {
    const searchText = this.filterText.toLowerCase();
    this.filtered = this.services.filter(service =>
      service.name.toLowerCase().includes(searchText)
    );
  }

  getSubsidiaries() {
    this.api.getData('subsidiary/getall').subscribe(
      (resp: any) => {
        this.subsidiaries = resp.data;
        // Load services for each subsidiary
        this.subsidiaries.forEach(sub => {
          this.loadSubsidiaryServices(sub.id);
        });
      },
      (error) => {
        console.log(error);
      }
    );
  }

  getAllServices() {
    // Obtener todos los servicios existentes
    this.api.getData('subsidiary/getallservices').subscribe(
      (resp: any) => {
        this.allServices = resp.data || [];
      },
      (error) => {
        console.log('Error loading all services:', error);
      }
    );
  }

  loadSubsidiaryServices(subsidiaryId: string) {
    // Obtener servicios asignados a una sucursal específica
    this.api.getData(`subsidiary/getservices/${subsidiaryId}`).subscribe(
      (resp: any) => {
        const services = resp.data || [];
        // Asegurar que cada servicio tenga un campo subsidiaryPrice
        const servicesWithPrice = services.map((s: any) => ({
          ...s,
          subsidiaryPrice: s.subsidiaryPrice || s.price || 0
        }));
        this.subsidiaryServices.set(subsidiaryId, servicesWithPrice);
        // Inicializar pendingServices con los servicios actuales
        this.pendingServices.set(subsidiaryId, [...servicesWithPrice]);
        this.hasUnsavedChanges = false;
      },
      (error) => {
        console.log('Error loading services for subsidiary:', error);
      }
    );
  }

  selectSubsidiary(subsidiary: any) {
    this.selectedSubsidiary = subsidiary;
    this.hasUnsavedChanges = false; // Reset cambios al cambiar de sucursal
    this.loadSubsidiaryServices(subsidiary.id);
  }

  getSubsidiaryServicesCount(subsidiaryId: string): number {
    return this.subsidiaryServices.get(subsidiaryId)?.length || 0;
  }

  getAssignedServices(): any[] {
    if (!this.selectedSubsidiary) return [];
    // Retornar servicios pendientes (estado local)
    return this.pendingServices.get(this.selectedSubsidiary.id) || [];
  }

  getAvailableServices(): any[] {
    if (!this.selectedSubsidiary) return [];
    const assigned = this.getAssignedServices();
    const assignedIds = assigned.map(s => s.id);
    return this.allServices.filter(s => !assignedIds.includes(s.id));
  }

  // Drag and Drop Methods
  onDragStart(event: DragEvent, service: any) {
    this.draggedService = service;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/html', event.target as any);
    (event.target as HTMLElement).classList.add('dragging');
  }

  onDragEnd(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('dragging');
    this.isDragOver = false;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    if (this.draggedService && this.selectedSubsidiary) {
      const assignedServices = this.getAssignedServices();
      const isAlreadyAssigned = assignedServices.some(s => s.id === this.draggedService.id);

      if (isAlreadyAssigned) {
        // Remove from subsidiary (drag from assigned to available)
        this.removeServiceLocally(this.draggedService);
      } else {
        // Add to subsidiary (drag from available to assigned)
        this.addServiceLocally(this.draggedService);
      }
    }

    this.draggedService = null;
  }

  /**
   * Agrega un servicio localmente sin guardar en el backend
   */
  addServiceLocally(service: any) {
    if (!this.selectedSubsidiary) return;

    const current = this.pendingServices.get(this.selectedSubsidiary.id) || [];
    
    // Verificar que no esté ya en la lista
    if (!current.some(s => s.id === service.id)) {
      // Agregar el servicio con un precio por defecto
      const serviceWithPrice = {
        ...service,
        subsidiaryPrice: service.price || 0
      };
      current.push(serviceWithPrice);
      this.pendingServices.set(this.selectedSubsidiary.id, current);
      this.hasUnsavedChanges = true;
    }
  }

  /**
   * Remueve un servicio localmente sin guardar en el backend
   */
  removeServiceLocally(service: any) {
    if (!this.selectedSubsidiary) return;

    const current = this.pendingServices.get(this.selectedSubsidiary.id) || [];
    const updated = current.filter(s => s.id !== service.id);
    this.pendingServices.set(this.selectedSubsidiary.id, updated);
    this.hasUnsavedChanges = true;
  }

  /**
   * Guarda todos los cambios pendientes en el backend
   */
  saveChanges() {
    if (!this.selectedSubsidiary) return;

    const pendingServicesList = this.pendingServices.get(this.selectedSubsidiary.id) || [];
    // Formatear servicios con el nuevo body: { id_service, price }
    const servicesData = pendingServicesList.map(s => ({
      id_service: s.id,
      price: parseFloat(s.subsidiaryPrice) || 0
    }));

    Swal.fire({
      title: 'Guardando cambios',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Usar PUT con el body correcto: { services: [{ id_service, price }] }
    this.api.updateData(`subsidiary/setservices`, this.selectedSubsidiary.id, { services: servicesData }).subscribe(
      (data: any) => {
        // Actualizar los servicios originales con los pendientes
        this.subsidiaryServices.set(this.selectedSubsidiary.id, [...pendingServicesList]);
        this.hasUnsavedChanges = false;
        
        Swal.fire({
          title: '¡Guardado!',
          icon: 'success',
          text: `Servicios de ${this.selectedSubsidiary.name} actualizados correctamente`,
          confirmButtonColor: '#198754',
          timer: 2000,
          showConfirmButton: false,
          didClose: () => {
            // Limpiar cualquier backdrop residual
            this.cleanupBackdrops();
          }
        });
      },
      (error) => {
        console.log(error);
        Swal.fire({
          title: 'Error',
          icon: 'error',
          text: error.error?.msg || 'No se pudieron guardar los cambios',
          confirmButtonColor: '#198754'
        });
      }
    );
  }

  addServiceToSubsidiary(service: any) {
    // Método legacy - ahora usar addServiceLocally
    this.addServiceLocally(service);
  }

  removeServiceFromSubsidiary(service: any) {
    // Método legacy - ahora usar removeServiceLocally
    this.removeServiceLocally(service);
  }

  search(form: NgForm) {
    let id = form.value.id_subsidiary;
    Swal.showLoading();
    this.api.getData(`subsidiary/getservices/${id}`).subscribe(
      (resp: any) => {
        Swal.close();
        this.services = resp.data;
        this.remainingId = id;
        this.filtered = [...this.services];
      },
      (error) => {
        console.log(error);
        Swal.close();
      }
    );
  }

  getInstance(data: any, id: string) {
    this.dataInstance = data;
    this.id = id;
  }

  getServices() {
    Swal.showLoading();
    this.api.getData(`subsidiary/getservices/${this.remainingId}`).subscribe(
      (resp: any) => {
        Swal.close();
        this.services = resp.data;
        this.filtered = [...this.services];
      },
      (error) => {
        console.log(error);
        Swal.close();
      }
    );
  }

  editInstance(form: any) {
    // Cerrar modal ANTES de mostrar el SweetAlert
    this.closeModal('editModal');

    this.api.updateData('service/update', this.id, this.dataInstance).subscribe(
      (data: any) => {
        Swal.fire({
          title: 'Actualizado',
          icon: 'success',
          text: data.message,
          confirmButtonColor: '#198754',
          timer: 2000,
          showConfirmButton: false,
          didClose: () => {
            // Limpiar cualquier backdrop residual
            this.cleanupBackdrops();
          }
        });
        
        // Reload services for the selected subsidiary
        if (this.selectedSubsidiary) {
          this.loadSubsidiaryServices(this.selectedSubsidiary.id);
        }
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

  delete(id: string, name: string) {
    Swal.fire({
      title: "Borrar",
      icon: 'info',
      text: `¿Desea borrar "${name}"?`,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#d33',
      showConfirmButton: true,
      showCancelButton: true
    }).then((resp) => {
      if (resp.isConfirmed) {
        this.api.deleteData('service/delete', id).subscribe(
          (data: any) => {
            Swal.fire({
              title: 'Borrado',
              icon: 'success',
              text: data.msg,
              confirmButtonColor: '#198754'
            });
            this.filtered = [];
          },
          (error) => {
            Swal.fire({
              title: 'Error',
              icon: 'error',
              text: error.error.msg,
              confirmButtonColor: '#198754'
            });
          }
        );
      }
    });

  }
  resetForm(form: NgForm) {
    form.resetForm();
    this.dataInstance = {
      name: '',
      id_subsidiary: '',
      description: ''
    }
  }

  loadPermissions(){
    this.permissionsService.getPermissions().subscribe(
      value=>{
        this.zone.run(
          ()=>{
            this.permissions = value;
            this.cd.detectChanges();
          }
        );
      }
    );
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

  // ============================================
  // MÉTODOS PARA CREAR SERVICIOS Y SUCURSALES
  // ============================================

  /**
   * Crea un nuevo servicio
   */
  createService(form: NgForm) {
    if (!form.valid) {
      Swal.fire({
        title: 'Error',
        icon: 'warning',
        text: 'Por favor completa todos los campos requeridos',
        confirmButtonColor: '#198754'
      });
      return;
    }

    // Cerrar modal ANTES de mostrar el SweetAlert de carga
    this.closeModal('createServiceModal');

    Swal.fire({
      title: 'Creando servicio',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let data = [this.newService];
    this.api.createData('service/create', data).subscribe(
      (data: any) => {
        Swal.fire({
          title: 'Creado',
          icon: 'success',
          text: data.message,
          confirmButtonColor: '#198754',
          didClose: () => {
            // Limpiar cualquier backdrop residual
            this.cleanupBackdrops();
          }
        });

        // Recargar todos los servicios
        this.getAllServices();
        this.resetServiceForm(form);
      },
      (error) => {
        console.log(error);
        Swal.fire({
          title: 'Error',
          icon: 'error',
          text: error.error?.message || 'No se pudo crear el servicio',
          confirmButtonColor: '#198754'
        });
      }
    );
  }

  /**
   * Crea una nueva sucursal
   */
  createSubsidiary(form: NgForm) {
    if (!form.valid) {
      Swal.fire({
        title: 'Error',
        icon: 'warning',
        text: 'Por favor completa todos los campos requeridos',
        confirmButtonColor: '#198754'
      });
      return;
    }

    // Cerrar modal ANTES de mostrar el SweetAlert de carga
    this.closeModal('createSubsidiaryModal');

    Swal.fire({
      title: 'Creando sucursal',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let data = [this.newSubsidiary];
    this.api.createData('subsidiary/create', data).subscribe(
      (data: any) => {
        Swal.fire({
          title: 'Creado',
          icon: 'success',
          text: data.message,
          confirmButtonColor: '#198754',
          didClose: () => {
            // Limpiar cualquier backdrop residual
            this.cleanupBackdrops();
          }
        });

        // Recargar sucursales
        this.getSubsidiaries();
        this.resetSubsidiaryForm(form);
      },
      (error) => {
        console.log(error);
        Swal.fire({
          title: 'Error',
          icon: 'error',
          text: error.error?.message || 'No se pudo crear la sucursal',
          confirmButtonColor: '#198754'
        });
      }
    );
  }

  /**
   * Resetea el formulario de servicio
   */
  resetServiceForm(form: NgForm) {
    form.resetForm();
    this.newService = {
      name: '',
      description: ''
    };
  }

  /**
   * Resetea el formulario de sucursal
   */
  resetSubsidiaryForm(form: NgForm) {
    form.resetForm();
    this.newSubsidiary = {
      id_user: this.userId,
      name: '',
      address: ''
    };
  }

  /**
   * Cierra un modal mediante su ID
   */
  closeModal(modalId: string) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const backdrop = document.querySelector('.modal-backdrop');
      modalElement.classList.remove('show');
      if (backdrop) {
        backdrop.remove();
      }
      modalElement.style.display = 'none';
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
    }
  }

  /**
   * Actualiza el precio de un servicio asignado
   */
  updateServicePrice(service: any, newPrice: any) {
    if (!this.selectedSubsidiary) return;
    
    const current = this.pendingServices.get(this.selectedSubsidiary.id) || [];
    const serviceIndex = current.findIndex(s => s.id === service.id);
    
    if (serviceIndex !== -1) {
      current[serviceIndex].subsidiaryPrice = parseFloat(newPrice) || 0;
      this.pendingServices.set(this.selectedSubsidiary.id, current);
      this.hasUnsavedChanges = true;
    }
  }

  /**
   * Limpia todos los backdrops residuales de modales y SweetAlert
   */
  cleanupBackdrops() {
    // Eliminar todos los backdrops de modales
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Eliminar backdrop de SweetAlert si existe
    const swalBackdrop = document.querySelector('.swal2-backdrop-show');
    if (swalBackdrop) {
      swalBackdrop.remove();
    }
    
    // Asegurar que el body esté limpio
    document.body.classList.remove('modal-open', 'swal2-shown', 'swal2-height-auto');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }
}
