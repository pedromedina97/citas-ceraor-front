import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CeraorService } from '../../services/ceraor.service';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';
import { PermissionsService } from '../../services/permissions.service';
import * as bootstrap from 'bootstrap';
import { Environment } from '../../Env/env';

@Component({
  selector: 'app-payments',
  standalone: false,
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})

export class PaymentsComponent implements OnInit {
  permissions: any;
  payments: any[] = [];
  filtered: any[] = [];
  filterText: string = '';
  id: string;
  idUser: string;
  name: String;
  lastname: String;
  rol: string;
  rols: any;
  env = Environment;
  page: number = 1;
  itemsPerPage: number = 5;
  isLoading: boolean = true;

  // Filtros de búsqueda
  filters = {
    patient: '',
    service: '',
    subsidiary: '',
    dateFrom: '',
    dateTo: ''
  };

  // Status and method management
  selectedOrder: any = null;
  statusFormData = {
    status: '',
    methodFisico: false,
    methodDigital: false,
    methodAmbos: false
  };

  // Propiedades para el modal de detalle
  selectedOrderDetail: any = null;

  constructor(private api: CeraorService, private permissionsService: PermissionsService, private cd: ChangeDetectorRef, private router: Router, private zone: NgZone) { }

  ngOnInit() {
    this.setPermissions();

    this.setPetitions();
   /*  this.getRols(); */
  }

  generateTicketPayment(payment: any) {
    // Mostrar loading
    Swal.fire({
      title: 'Generando Recibo de Pago...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Usar el método downloadPdfBlob del servicio API para manejar la descarga del PDF
    this.api.downloadPdfBlob(`payment/generatePaymentTicket/${payment.id_pago}`).subscribe(
      (blob: Blob) => {
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear enlace de descarga
        const link = document.createElement('a');
        link.href = url;
        link.download = `etiqueta_${payment.id_pago}.pdf`;
        
        // Simular click para descargar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL del blob
        window.URL.revokeObjectURL(url);
        
        Swal.close();
        Swal.fire({
          title: 'Recibo de Pago generado',
          text: 'La descarga del Recibo de Pago ha comenzado',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      },
      (error) => {
        Swal.close();
        console.error('Error al generar Recibo de Pago:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al generar el Recibo de Pago',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    );
  }

  setPetitions() {
    if (this.rol == 'Owner' || this.rol == 'Superadmin' || this.rol == 'Admin' || this.rol == 'Recepcionista') {
      this.getData();
    } /* else if (this.rol == 'Doctor') {
      let complete = this.name + " " + this.lastname;
      this.getPaymentsByDoctor(complete);
    } */
  }

  setPermissions() {
    this.permissionsService.getId().subscribe(
      (value) => {
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

    this.permissionsService.getName().subscribe(value => {
      this.name = value;
      this.cd.detectChanges();
    });

    this.permissionsService.getLastname().subscribe(value => {
      this.lastname = value;
      this.cd.detectChanges();
    });
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

  getData() {
    this.isLoading = true;
    this.api.getData('payment/getall').subscribe(
      (data: any) => {
        this.payments = data.data;
        console.log(this.payments);
        this.sortPaymentsByDate(); // Ordenar por fecha antes de aplicar filtros
        this.applyFilters(); // Aplicar filtros después de cargar datos
        this.isLoading = false;
      },
      (error) => {
        console.log(error.error);
        Swal.fire({
          title: 'Error',
          text: 'Error al cargar los pagos',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        this.isLoading = false;
      }
    );
  }

  filter() {
    const searchText = this.filterText.toLowerCase();
    this.filtered = this.payments.filter(payment =>
      payment.nombre_paciente.toLowerCase().includes(searchText) ||
      payment.nombre_servicio.toLowerCase().includes(searchText) ||
      payment.sucursal.toLowerCase().includes(searchText)
    );
  }

  /*  getInstance(user: any, id: string) {
     this.dataInstance = user;
     this.id = id;
   } */


/*   getRols() {
    this.api.getData('rol/getall').subscribe(
      (resp: any) => {
        this.rols = resp.data;
      },
      (error) => {
        console.log(error);
      }
    );
  } */

  // Métodos de Ordenamiento y Filtrado

  /**
   * Ordena las órdenes por fecha de creación (más recientes primero)
   */
  sortPaymentsByDate() {
    if (this.payments && Array.isArray(this.payments)) {
      this.payments.sort((a, b) => {
        // Convertir las fechas a objetos Date para comparar
        const dateA = new Date(a.fecha_hora_pago);
        const dateB = new Date(b.fecha_hora_pago);
        
        // Ordenar de más reciente a más antiguo (orden descendente)
        return dateB.getTime() - dateA.getTime();
      });
    }
  }

  /**
   * Aplica todos los filtros a la lista de pagos
   */
  applyFilters() {
    this.filtered = this.payments.filter(payment => {
      // Filtro por paciente
      const patientMatch = !this.filters.patient || 
        (payment.nombre_paciente && payment.nombre_paciente.toLowerCase().includes(this.filters.patient.toLowerCase()));

      // Filtro por servicio
      const serviceMatch = !this.filters.service || 
        (payment.nombre_servicio && payment.nombre_servicio.toLowerCase().includes(this.filters.service.toLowerCase()));

      // Filtro por sucursal
      const subsidiaryMatch = !this.filters.subsidiary || 
        (payment.sucursal && payment.sucursal.toLowerCase().includes(this.filters.subsidiary.toLowerCase()));

      // Filtro por rango de fechas
      let dateMatch = true;
      if (this.filters.dateFrom || this.filters.dateTo) {
        const paymentDate = new Date(payment.fecha_hora_pago);
        
        if (this.filters.dateFrom) {
          const fromDate = new Date(this.filters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (paymentDate < fromDate) dateMatch = false;
        }
        
        if (this.filters.dateTo) {
          const toDate = new Date(this.filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (paymentDate > toDate) dateMatch = false;
        }
      }

      return patientMatch && serviceMatch && subsidiaryMatch && dateMatch;
    });

    // Resetear paginación cuando se filtran los datos
    this.page = 1;
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters() {
    this.filters = {
      patient: '',
      service: '',
      subsidiary: '',
      dateFrom: '',
      dateTo: ''
    };
    this.applyFilters();
  }


  getUniqueSubsidiaries(): string[] {
    const subsidiaries = [...new Set(this.payments.map(payment => payment.sucursal).filter(subsidiary => subsidiary))];
    return subsidiaries.sort();
  }

  /**
   * Obtiene los valores únicos de servicios para el select
   */
  getUniqueServices(): string[] {
    const services = [...new Set(this.payments.map(payment => payment.nombre_servicio).filter(service => service))];
    return services.sort();
  }

  /**
   * Muestra mensaje de éxito y cierra el modal
   */
  private showSuccessAndClose() {
    Swal.fire({
      title: 'Actualización Exitosa',
      icon: 'success',
      text: 'El pago ha sido actualizado correctamente.',
      confirmButtonColor: '#198754'
    });
  }

}
