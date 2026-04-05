import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  permissions: any;
  subsidiaries: any[] = [];
  subsidiary: string;
  filtered: any[] = [];
  filterText: string = '';
  services: any[] = [];
  categories: any[] = [];
  id: string = '';
  dataInstance = {
    name: '',
    id_subsidiary: '',
    description: ''
  }
  remainingId: string;
  
  // Tab control
  activeTab: string = 'services'; // 'services' | 'packages' | 'managePackages'
  
  // Drag and drop properties
  selectedSubsidiary: any = null;
  allServices: any[] = [];
  subsidiaryServices: Map<string, any[]> = new Map(); // Servicios originales del backend
  pendingServices: Map<string, any[]> = new Map(); // Servicios temporales (locales)
  draggedService: any = null;
  isDragOver: boolean = false;
  hasUnsavedChanges: boolean = false;

  // Packages properties
  allPackages: any[] = [];
  subsidiaryPackages: Map<string, any[]> = new Map(); // Paquetes originales del backend
  pendingPackages: Map<string, any[]> = new Map(); // Paquetes temporales (locales)
  draggedPackage: any = null;
  isDragOverPackage: boolean = false;
  hasUnsavedPackageChanges: boolean = false;

  // Package services management (servicios dentro de un paquete)
  selectedPackage: any = null;
  viewingPackage: any = null; // Para mostrar servicios sin editar en managePackages
  packageServices: Map<string, any[]> = new Map(); // Servicios originales de cada paquete
  pendingPackageServices: Map<string, any[]> = new Map(); // Servicios temporales del paquete
  draggedPackageService: any = null;
  isDragOverPackageService: boolean = false;
  hasUnsavedPackageServiceChanges: boolean = false;

  userId = localStorage.getItem('userId');

  // Formularios de creación
  newService = {
    name: '',
    id_category: '',
    description: '',
    image: ''
  };

  imagePreview: string | null = null;

  newSubsidiary = {
    id_user: this.userId,
    name: '',
    address: ''
  };

  newPackage = {
    name: ''
  };

  newCategory = {
    name: ''
  };

  packageDataInstance = {
    name: '',
    description: ''
  };

  packageId: string = '';

  constructor(
    private api: CeraorService, 
    private permissionsService: PermissionsService, 
    private cd: ChangeDetectorRef, 
    private router: Router, 
    private zone: NgZone
  ){}

  ngOnInit(): void {
    this.getSubsidiaries();
    this.getAllServices();
    this.getAllPackages();
    this.getAllCategories();
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
        // Load services and packages for each subsidiary
        this.subsidiaries.forEach(sub => {
          this.loadSubsidiaryServices(sub.id);
          this.loadSubsidiaryPackages(sub.id);
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

  getAllPackages() {
    // Obtener todos los paquetes existentes
    this.api.getData('packet/getall').subscribe(
      (resp: any) => {
        this.allPackages = resp.data || [];
        // Precargar servicios para cada paquete
        this.allPackages.forEach(pkg => {
          this.loadPackageServices(pkg.id);
        });
      },
      (error) => {
        console.log('Error loading all packages:', error);
      }
    );
  }

  getAllCategories() {
    // Obtener todas las categorías existentes
    this.api.getData('category/getall').subscribe(
      (resp: any) => {
        this.categories = resp.data || [];
      },
      (error) => {
        console.log('Error loading categories:', error);
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

  loadSubsidiaryPackages(subsidiaryId: string) {
    // Obtener paquetes asignados a una sucursal específica
    this.api.getData(`subsidiary/getpackets/${subsidiaryId}`).subscribe(
      (resp: any) => {
        const packages = resp.data || [];
        // Asegurar que cada paquete tenga un campo subsidiaryPrice
        const packagesWithPrice = packages.map((p: any) => ({
          ...p,
          subsidiaryPrice: p.subsidiaryPrice || p.price || 0
        }));
        this.subsidiaryPackages.set(subsidiaryId, packagesWithPrice);
        // Inicializar pendingPackages con los paquetes actuales
        this.pendingPackages.set(subsidiaryId, [...packagesWithPrice]);
        this.hasUnsavedPackageChanges = false;
      },
      (error) => {
        console.log('Error loading packages for subsidiary:', error);
      }
    );
  }

  selectSubsidiary(subsidiary: any) {
    this.selectedSubsidiary = subsidiary;
    this.hasUnsavedChanges = false; // Reset cambios al cambiar de sucursal
    this.hasUnsavedPackageChanges = false;
    this.loadSubsidiaryServices(subsidiary.id);
    this.loadSubsidiaryPackages(subsidiary.id);
  }

  getSubsidiaryServicesCount(subsidiaryId: string): number {
    return this.subsidiaryServices.get(subsidiaryId)?.length || 0;
  }

  getSubsidiaryPackagesCount(subsidiaryId: string): number {
    return this.subsidiaryPackages.get(subsidiaryId)?.length || 0;
  }

  getPackageServicesCount(packageId: string): number {
    return this.packageServices.get(packageId)?.length || 0;
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

  getAssignedPackages(): any[] {
    if (!this.selectedSubsidiary) return [];
    // Retornar paquetes pendientes (estado local)
    return this.pendingPackages.get(this.selectedSubsidiary.id) || [];
  }

  getAvailablePackages(): any[] {
    if (!this.selectedSubsidiary) return [];
    const assigned = this.getAssignedPackages();
    const assignedIds = assigned.map(p => p.id);
    return this.allPackages.filter(p => !assignedIds.includes(p.id));
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
   * Crea una nueva categoría
   */
  createCategory(form: NgForm) {
    if (!form.valid) {
      Swal.fire({
        title: 'Error',
        icon: 'warning',
        text: 'Por favor completa todos los campos requeridos',
        confirmButtonColor: '#198754'
      });
      return;
    }

    this.closeModal('createCategoryModal');

    Swal.fire({
      title: 'Creando categoría',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let data = [this.newCategory];
    this.api.createData('category/create', data).subscribe(
      (data: any) => {
        Swal.fire({
          title: 'Creado',
          icon: 'success',
          text: data.message || 'Categoría creada correctamente',
          confirmButtonColor: '#198754',
          didClose: () => {
            this.cleanupBackdrops();
          }
        });

        this.resetCategoryForm(form);
      },
      (error) => {
        console.log(error);
        Swal.fire({
          title: 'Error',
          icon: 'error',
          text: error.error?.message || 'No se pudo crear la categoría',
          confirmButtonColor: '#198754'
        });
      }
    );
  }

  /**
   * Resetea el formulario de categoría
   */
  resetCategoryForm(form: NgForm) {
    form.resetForm();
    this.newCategory = {
      name: ''
    };
  }

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

    // Crear el objeto con el formato correcto del body
    let data = {
      name: this.newService.name,
      id_category: this.newService.id_category,
      image: this.newService.image,
      description: this.newService.description,
      
    };
    
    // Log para verificar qué se está enviando
    console.log('=== BODY COMPLETO A ENVIAR ===');
    console.log('Objeto completo:', data);
    console.log('name:', data.name);
    console.log('id_category:', data.id_category);
    console.log('description:', data.description);
    console.log('image (primeros 100):', data.image?.substring(0, 100) || 'VACÍO');
    console.log('image length:', data.image?.length || 0);
    console.log('==============================');
    
    this.api.createData('service/create', [data]).subscribe(
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

        // Recargar todos los servicios y categorías
        this.getAllServices();
        this.getAllCategories();
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
      id_category: '',
      description: '',
      image: ''
    };
    this.imagePreview = null;
    
    // Resetear el input de archivo
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Maneja la carga de imagen y la convierte a base64
   */
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          title: 'Error',
          icon: 'warning',
          text: 'Por favor selecciona un archivo de imagen válido',
          confirmButtonColor: '#198754'
        });
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: 'Error',
          icon: 'warning',
          text: 'La imagen no debe superar los 5MB',
          confirmButtonColor: '#198754'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64Full = reader.result as string;
        
        // Log para debugging (puedes comentarlo en producción)
        console.log('Imagen capturada - Tamaño:', file.size, 'bytes');
        console.log('Base64 completo (primeros 100 chars):', base64Full.substring(0, 100));
        
        // Guardar la imagen completa con el prefijo data:image
        this.newService.image = base64Full;
        this.imagePreview = base64Full;
        
        console.log('Imagen guardada en newService.image');
      };
      
      reader.onerror = (error) => {
        console.error('Error al leer la imagen:', error);
        Swal.fire({
          title: 'Error',
          icon: 'error',
          text: 'No se pudo procesar la imagen',
          confirmButtonColor: '#198754'
        });
      };
      
      reader.readAsDataURL(file);
    }
  }

  /**
   * Elimina la imagen seleccionada
   */
  removeImage() {
    this.newService.image = '';
    this.imagePreview = null;
    
    // Resetear el input de archivo
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Sanitiza la imagen para que Angular pueda mostrarla correctamente
   */
  getSafeImageUrl(image: string): string {
    if (!image) return '';
    
    // Si la imagen ya es una URL completa, retornarla tal cual
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    
    // Si ya tiene el prefijo data:image, retornarla tal cual
    if (image.startsWith('data:image')) {
      return image;
    }
    
    // Si es base64 puro (sin prefijo), agregarlo
    // Detectar el tipo de imagen desde el base64 o usar jpeg por defecto
    const imageType = this.detectImageType(image) || 'jpeg';
    return `data:image/${imageType};base64,${image}`;
  }

  /**
   * Detecta el tipo de imagen desde el base64
   */
  private detectImageType(base64: string): string | null {
    // Primeros caracteres del base64 para detectar tipo
    if (base64.startsWith('/9j/')) return 'jpeg';
    if (base64.startsWith('iVBORw0KGgo')) return 'png';
    if (base64.startsWith('R0lGOD')) return 'gif';
    if (base64.startsWith('UklGR')) return 'webp';
    return null;
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
   * Actualiza el precio de un paquete asignado
   */
  updatePackagePrice(pkg: any, newPrice: any) {
    if (!this.selectedSubsidiary) return;
    
    const current = this.pendingPackages.get(this.selectedSubsidiary.id) || [];
    const packageIndex = current.findIndex(p => p.id === pkg.id);
    
    if (packageIndex !== -1) {
      current[packageIndex].subsidiaryPrice = parseFloat(newPrice) || 0;
      this.pendingPackages.set(this.selectedSubsidiary.id, current);
      this.hasUnsavedPackageChanges = true;
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

  // ============================================
  // MÉTODOS PARA PAQUETES (DRAG & DROP)
  // ============================================

  onDragStartPackage(event: DragEvent, pkg: any) {
    this.draggedPackage = pkg;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/html', event.target as any);
    (event.target as HTMLElement).classList.add('dragging');
  }

  onDragEndPackage(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('dragging');
    this.isDragOverPackage = false;
  }

  onDragOverPackage(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.isDragOverPackage = true;
  }

  onDragLeavePackage(event: DragEvent) {
    this.isDragOverPackage = false;
  }

  onDropPackage(event: DragEvent) {
    event.preventDefault();
    this.isDragOverPackage = false;

    if (this.draggedPackage && this.selectedSubsidiary) {
      const assignedPackages = this.getAssignedPackages();
      const isAlreadyAssigned = assignedPackages.some(p => p.id === this.draggedPackage.id);

      if (isAlreadyAssigned) {
        // Remove from subsidiary (drag from assigned to available)
        this.removePackageLocally(this.draggedPackage);
      } else {
        // Add to subsidiary (drag from available to assigned)
        this.addPackageLocally(this.draggedPackage);
      }
    }

    this.draggedPackage = null;
  }

  /**
   * Agrega un paquete localmente sin guardar en el backend
   */
  addPackageLocally(pkg: any) {
    if (!this.selectedSubsidiary) return;

    const current = this.pendingPackages.get(this.selectedSubsidiary.id) || [];
    
    // Verificar que no esté ya en la lista
    if (!current.some(p => p.id === pkg.id)) {
      // Agregar el paquete con un precio por defecto
      const packageWithPrice = {
        ...pkg,
        subsidiaryPrice: pkg.price || 0
      };
      current.push(packageWithPrice);
      this.pendingPackages.set(this.selectedSubsidiary.id, current);
      this.hasUnsavedPackageChanges = true;
    }
  }

  /**
   * Remueve un paquete localmente sin guardar en el backend
   */
  removePackageLocally(pkg: any) {
    if (!this.selectedSubsidiary) return;

    const current = this.pendingPackages.get(this.selectedSubsidiary.id) || [];
    const updated = current.filter(p => p.id !== pkg.id);
    this.pendingPackages.set(this.selectedSubsidiary.id, updated);
    this.hasUnsavedPackageChanges = true;
  }

  /**
   * Guarda todos los cambios pendientes de paquetes en el backend
   */
  savePackageChanges() {
    if (!this.selectedSubsidiary) return;

    const pendingPackagesList = this.pendingPackages.get(this.selectedSubsidiary.id) || [];
    // Formatear paquetes con el body: { packets: [{ id_packet, price }] }
    const packetsData = pendingPackagesList.map(p => ({
      id_packet: p.id,
      price: parseFloat(p.subsidiaryPrice) || 0
    }));

    Swal.fire({
      title: 'Guardando cambios',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Usar PUT con el endpoint correcto: subsidiary/setpackets/{id_subsidiary}
    // Body: { packets: [{ id_packet, price }] }
    this.api.updateData(`subsidiary/setpackets`, this.selectedSubsidiary.id, { packets: packetsData }).subscribe(
      (data: any) => {
        // Actualizar los paquetes originales con los pendientes
        this.subsidiaryPackages.set(this.selectedSubsidiary.id, [...pendingPackagesList]);
        this.hasUnsavedPackageChanges = false;
        
        Swal.fire({
          title: '¡Guardado!',
          icon: 'success',
          text: `Paquetes de ${this.selectedSubsidiary.name} actualizados correctamente`,
          confirmButtonColor: '#198754',
          timer: 2000,
          showConfirmButton: false,
          didClose: () => {
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

  /**
   * Crea un nuevo paquete
   */
  createPackage(form: NgForm) {
    if (!form.valid) {
      Swal.fire({
        title: 'Error',
        icon: 'warning',
        text: 'Por favor completa todos los campos requeridos',
        confirmButtonColor: '#198754'
      });
      return;
    }

    this.closeModal('createPackageModal');

    Swal.fire({
      title: 'Creando paquete',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let data = [this.newPackage];
    this.api.createData('packet/create', data).subscribe(
      (data: any) => {
        Swal.fire({
          title: 'Creado',
          icon: 'success',
          text: data.message,
          confirmButtonColor: '#198754',
          didClose: () => {
            this.cleanupBackdrops();
          }
        });

        // Recargar todos los paquetes
        this.getAllPackages();
        this.resetPackageForm(form);
      },
      (error) => {
        console.log(error);
        Swal.fire({
          title: 'Error',
          icon: 'error',
          text: error.error?.message || 'No se pudo crear el paquete',
          confirmButtonColor: '#198754'
        });
      }
    );
  }

  /**
   * Resetea el formulario de paquete
   */
  resetPackageForm(form: NgForm) {
    form.resetForm();
    this.newPackage = {
      name: ''
    };
  }

  /**
   * Obtiene la instancia de un paquete para editar
   */
  getPackageInstance(data: any, id: string) {
    this.packageDataInstance = data;
    this.packageId = id;
  }

  /**
   * Selecciona un paquete para gestionar sus servicios
   */
  selectPackageForServices(pkg: any, editMode: boolean = false) {
    if (this.activeTab === 'managePackages' && !editMode) {
      // En la pestaña managePackages, solo ver servicios sin editar
      this.viewingPackage = pkg;
      this.loadPackageServices(pkg.id);
    } else {
      // En otras pestañas o cuando editMode es true, entrar en modo edición
      this.selectedPackage = pkg;
      this.viewingPackage = null;
      this.hasUnsavedPackageServiceChanges = false;
      this.loadPackageServices(pkg.id);
    }
  }

  /**
   * Carga los servicios asignados a un paquete específico
   */
  loadPackageServices(packageId: string) {
    this.api.getData(`services/getbypacketid/${packageId}`).subscribe(
      (resp: any) => {
        const services = resp.data || [];
        this.packageServices.set(packageId, services);
        this.pendingPackageServices.set(packageId, [...services]);
        this.hasUnsavedPackageServiceChanges = false;
      },
      (error) => {
        console.log('Error loading package services:', error);
      }
    );
  }

  /**
   * Obtiene servicios asignados al paquete seleccionado
   */
  getPackageAssignedServices(): any[] {
    const pkg = this.selectedPackage || this.viewingPackage;
    if (!pkg) return [];
    return this.pendingPackageServices.get(pkg.id) || [];
  }

  /**
   * Obtiene servicios disponibles (no asignados al paquete)
   */
  getPackageAvailableServices(): any[] {
    if (!this.selectedPackage) return [];
    const assigned = this.getPackageAssignedServices();
    const assignedIds = assigned.map(s => s.id);
    return this.allServices.filter(s => !assignedIds.includes(s.id));
  }

  // ============================================
  // DRAG & DROP PARA SERVICIOS DEL PAQUETE
  // ============================================

  onDragStartPackageService(event: DragEvent, service: any) {
    this.draggedPackageService = service;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/html', event.target as any);
    (event.target as HTMLElement).classList.add('dragging');
  }

  onDragEndPackageService(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('dragging');
    this.isDragOverPackageService = false;
  }

  onDragOverPackageService(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.isDragOverPackageService = true;
  }

  onDragLeavePackageService(event: DragEvent) {
    this.isDragOverPackageService = false;
  }

  onDropPackageService(event: DragEvent) {
    event.preventDefault();
    this.isDragOverPackageService = false;

    if (this.draggedPackageService && this.selectedPackage) {
      const assignedServices = this.getPackageAssignedServices();
      const isAlreadyAssigned = assignedServices.some(s => s.id === this.draggedPackageService.id);

      if (isAlreadyAssigned) {
        // Remove from package
        this.removePackageServiceLocally(this.draggedPackageService);
      } else {
        // Add to package
        this.addPackageServiceLocally(this.draggedPackageService);
      }
    }

    this.draggedPackageService = null;
  }

  /**
   * Agrega un servicio al paquete localmente
   */
  addPackageServiceLocally(service: any) {
    if (!this.selectedPackage) return;

    const current = this.pendingPackageServices.get(this.selectedPackage.id) || [];
    
    if (!current.some(s => s.id === service.id)) {
      current.push(service);
      this.pendingPackageServices.set(this.selectedPackage.id, current);
      this.hasUnsavedPackageServiceChanges = true;
    }
  }

  /**
   * Remueve un servicio del paquete localmente
   */
  removePackageServiceLocally(service: any) {
    if (!this.selectedPackage) return;

    const current = this.pendingPackageServices.get(this.selectedPackage.id) || [];
    const updated = current.filter(s => s.id !== service.id);
    this.pendingPackageServices.set(this.selectedPackage.id, updated);
    this.hasUnsavedPackageServiceChanges = true;
  }

  /**
   * Guarda los cambios de servicios del paquete en el backend
   */
  savePackageServiceChanges() {
    if (!this.selectedPackage) return;

    const pendingServicesList = this.pendingPackageServices.get(this.selectedPackage.id) || [];
    // Formatear servicios solo con id_service (sin price)
    const servicesData = pendingServicesList.map(s => ({
      id_service: s.id
    }));

    Swal.fire({
      title: 'Guardando cambios',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Usar PUT con el body correcto: { services: [{ id_service }] }
    this.api.updateData(`packet/setservices`, this.selectedPackage.id, { services: servicesData }).subscribe(
      (data: any) => {
        this.packageServices.set(this.selectedPackage.id, [...pendingServicesList]);
        this.hasUnsavedPackageServiceChanges = false;
        
        Swal.fire({
          title: '¡Guardado!',
          icon: 'success',
          text: `Servicios del paquete actualizados correctamente`,
          confirmButtonColor: '#198754',
          timer: 2000,
          showConfirmButton: false,
          didClose: () => {
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

  /**
   * Vuelve a la vista de paquetes
   */
  backToPackagesList() {
    this.selectedPackage = null;
    this.hasUnsavedPackageServiceChanges = false;
    // Recargar todos los paquetes para actualizar la lista
    this.getAllPackages();
  }

  /**
   * Edita un paquete existente
   */
  editPackageInstance(form: any) {
    this.closeModal('editPackageModal');

    this.api.updateData('packet/update', this.packageId, this.packageDataInstance).subscribe(
      (data: any) => {
        Swal.fire({
          title: 'Actualizado',
          icon: 'success',
          text: data.message,
          confirmButtonColor: '#198754',
          timer: 2000,
          showConfirmButton: false,
          didClose: () => {
            this.cleanupBackdrops();
          }
        });
        
        // Reload packages for the selected subsidiary
        if (this.selectedSubsidiary) {
          this.loadSubsidiaryPackages(this.selectedSubsidiary.id);
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
}
