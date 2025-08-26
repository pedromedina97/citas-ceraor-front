import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CeraorService } from '../../services/ceraor.service';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';
import { PermissionsService } from '../../services/permissions.service';
import * as bootstrap from 'bootstrap';
import { Environment } from '../../Env/env';

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  permissions: any;
  orders: any[] = [];
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

  // Filtros de búsqueda
  filters = {
    folio: '',
    codeTicket: '',
    patient: '',
    email: '',
    doctor: '',
    status: '',
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
    this.getRols();
  }

  setPetitions() {
    if (this.rol == 'Owner' || this.rol == 'Superadmin' || this.rol == 'Admin' || this.rol == 'Operativo') {
      this.getData();
    } else if (this.rol == 'Doctor') {
      let complete = this.name + " " + this.lastname;
      this.getOrdersByDoctor(complete);
    }
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
    this.api.getData('order/getall').subscribe(
      (data: any) => {
        this.orders = data.data;
        this.sortOrdersByDate(); // Ordenar por fecha antes de aplicar filtros
        this.applyFilters(); // Aplicar filtros después de cargar datos
      },
      (error) => {
        console.log(error.error);
      }
    );
  }

  filter() {
    const searchText = this.filterText.toLowerCase();
    this.filtered = this.orders.filter(order =>
      order.patient.toLowerCase().includes(searchText) ||
      order.appointment_code.toLowerCase().includes(searchText)
    );
  }

  /*  getInstance(user: any, id: string) {
     this.dataInstance = user;
     this.id = id;
   } */

  getOrdersByDoctor(name: String) {
    this.api.getDataById('order/getbydoctor', name).subscribe(
      (resp: any) => {
        this.orders = resp.data;
        this.sortOrdersByDate(); // Ordenar por fecha antes de aplicar filtros
        this.applyFilters(); // Aplicar filtros después de cargar datos
      },
      (error) => {
        console.log(error);
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

    this.api.updateData('user/updateuser', this.id, form.value).subscribe(
      (data: any) => {
        Swal.fire({
          title: 'Usuario Actualizado',
          icon: 'success',
          text: data.message,
          confirmButtonColor: '#198754'
        });


        // Cerrar modal
        this.closeModal('#editModal');

        // Actualizar la lista de usuarios
        this.setPetitions();
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

  downloadPdf(url: string, fileName: string) {
    Swal.fire({
      title: 'Descargando PDF...',
      text: 'Por favor espera unos segundos.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.api.http.get(url, { responseType: 'blob' }).subscribe(
      blob => {
        Swal.close();

        const downloadURL = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadURL;
        a.download = `${fileName}.pdf`; // Nombre dinámico
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadURL); // Limpia memoria
      },
      error => {
        Swal.close();
        console.error('Error al descargar el PDF:', error);
        Swal.fire('Error', 'No se pudo descargar el PDF.', 'error');
      }
    );
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
    }).then((resp) => {
      if (resp.isConfirmed) {
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


  getRols() {
    this.api.getData('rol/getall').subscribe(
      (resp: any) => {
        this.rols = resp.data;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  // Métodos de Ordenamiento y Filtrado

  /**
   * Ordena las órdenes por fecha de creación (más recientes primero)
   */
  sortOrdersByDate() {
    if (this.orders && Array.isArray(this.orders)) {
      this.orders.sort((a, b) => {
        // Convertir las fechas a objetos Date para comparar
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        
        // Ordenar de más reciente a más antiguo (orden descendente)
        return dateB.getTime() - dateA.getTime();
      });
    }
  }

  /**
   * Aplica todos los filtros a la lista de órdenes
   */
  applyFilters() {
    this.filtered = this.orders.filter(order => {
      // Filtro por folio
      const folioMatch = !this.filters.folio || 
        (order.appointment_code && order.appointment_code.toLowerCase().includes(this.filters.folio.toLowerCase())) ||
        (!order.appointment_code && 'sin folio'.includes(this.filters.folio.toLowerCase()));

      // Filtro por código de entrega
      const codeTicketMatch = !this.filters.codeTicket || 
        (order.code_ticket && order.code_ticket.toLowerCase().includes(this.filters.codeTicket.toLowerCase())) ||
        (!order.code_ticket && 'sin código'.includes(this.filters.codeTicket.toLowerCase()));

      // Filtro por paciente
      const patientMatch = !this.filters.patient || 
        (order.patient && order.patient.toLowerCase().includes(this.filters.patient.toLowerCase()));

      // Filtro por email
      const emailMatch = !this.filters.email || 
        (order.email && order.email.toLowerCase().includes(this.filters.email.toLowerCase()));

      // Filtro por doctor
      const doctorMatch = !this.filters.doctor || 
        (order.doctor && order.doctor.toLowerCase().includes(this.filters.doctor.toLowerCase()));

      // Filtro por status
      const statusMatch = !this.filters.status || 
        (order.status && order.status === this.filters.status);

      // Filtro por rango de fechas
      let dateMatch = true;
      if (this.filters.dateFrom || this.filters.dateTo) {
        const orderDate = new Date(order.created_at);
        
        if (this.filters.dateFrom) {
          const fromDate = new Date(this.filters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (orderDate < fromDate) dateMatch = false;
        }
        
        if (this.filters.dateTo) {
          const toDate = new Date(this.filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (orderDate > toDate) dateMatch = false;
        }
      }

      return folioMatch && codeTicketMatch && patientMatch && emailMatch && doctorMatch && statusMatch && dateMatch;
    });

    // Resetear paginación cuando se filtran los datos
    this.page = 1;
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters() {
    this.filters = {
      folio: '',
      codeTicket: '',
      patient: '',
      email: '',
      doctor: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    };
    this.applyFilters();
  }

  /**
   * Obtiene los valores únicos de status para el select
   */
  getUniqueStatuses(): string[] {
    const statuses = [...new Set(this.orders.map(order => order.status).filter(status => status))];
    return statuses.sort();
  }

  // Status and Method Management Methods

  /**
   * Obtiene la clase CSS para el status
   */
  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'solicitado': 'bg-warning text-dark',
      'en_proceso': 'bg-info text-white',
      'entregado': 'bg-success text-white'
    };
    return statusClasses[status] || 'bg-secondary text-white';
  }

  /**
   * Obtiene el texto legible para el status
   */
  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'solicitado': 'Solicitado',
      'en_proceso': 'En Proceso',
      'entregado': 'Entregado'
    };
    return statusTexts[status] || 'Sin Status';
  }

  /**
   * Obtiene la clase CSS para el método
   */
  getMethodClass(method: string): string {
    const methodClasses: { [key: string]: string } = {
      'fisico': 'bg-primary text-white',
      'digital': 'bg-dark text-white',
      'ambos': 'bg-purple text-white',
      'por_definir': 'bg-warning text-dark'
    };
    return methodClasses[method] || 'bg-secondary text-white';
  }

  /**
   * Obtiene el texto legible para el método
   */
  getMethodText(method: string): string {
    const methodTexts: { [key: string]: string } = {
      'fisico': 'Físico',
      'digital': 'Digital',
      'ambos': 'Ambos',
      'por_definir': 'Por Definir'
    };
    return methodTexts[method] || 'Sin Método';
  }

  /**
   * Genera la etiqueta para una orden entregada
   */
  generateTicket(order: any) {
    if (order.status !== 'entregado') {
      Swal.fire({
        title: 'Error',
        text: 'Solo se pueden generar etiquetas para órdenes entregadas',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Mostrar loading
    Swal.fire({
      title: 'Generando etiqueta...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Usar el método downloadPdfBlob del servicio API para manejar la descarga del PDF
    this.api.downloadPdfBlob(`order/generateticket/${order.id}`).subscribe(
      (blob: Blob) => {
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear enlace de descarga
        const link = document.createElement('a');
        link.href = url;
        link.download = `etiqueta_${order.id}.pdf`;
        
        // Simular click para descargar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL del blob
        window.URL.revokeObjectURL(url);
        
        Swal.close();
        Swal.fire({
          title: 'Etiqueta generada',
          text: 'La descarga de la etiqueta ha comenzado',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      },
      (error) => {
        Swal.close();
        console.error('Error al generar etiqueta:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al generar la etiqueta',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    );
  }

  /**
   * Abre el modal para ver el detalle completo de la orden
   */
  openDetailModal(order: any) {
    this.api.getData(`order/getdetailsbyid/${order.id}`).subscribe(
      (response: any) => {
        if (response.status === 'success' && response.data && response.data.length > 0) {
          this.selectedOrderDetail = response.data[0];
          // Abrir el modal usando Bootstrap
          const modal = new (window as any).bootstrap.Modal(document.getElementById('detailModal'));
          modal.show();
        } else {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar el detalle de la orden',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      },
      (error) => {
        console.error('Error al cargar detalle:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al conectar con el servidor',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    );
  }

  /**
   * Abre el modal para cambiar el status de una orden
   */
  openStatusModal(order: any) {
    this.selectedOrder = order;
    this.statusFormData = {
      status: order.status || 'solicitado',
      methodFisico: order.method === 'fisico',
      methodDigital: order.method === 'digital',
      methodAmbos: order.method === 'ambos'
    };

    // Nota: Si method es 'por_definir', todos los checkboxes quedan en false
    // hasta que el usuario seleccione uno cuando el status sea 'entregado'

    // Abrir modal usando Bootstrap
    const modalElement = document.getElementById('statusModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  /**
   * Se ejecuta cuando cambia el status
   */
  onStatusChange() {
    // Si el status no es 'entregado', limpiar los métodos
    if (this.statusFormData.status !== 'entregado') {
      this.statusFormData.methodFisico = false;
      this.statusFormData.methodDigital = false;
      this.statusFormData.methodAmbos = false;
    }
  }

  /**
   * Maneja los cambios en los checkboxes de método de entrega
   */
  onMethodChange(selectedMethod: string) {
    if (selectedMethod === 'ambos') {
      // Si se selecciona "Ambos", desmarcar las otras opciones
      this.statusFormData.methodFisico = false;
      this.statusFormData.methodDigital = false;
    } else {
      // Si se selecciona "Físico" o "Digital", desmarcar "Ambos"
      this.statusFormData.methodAmbos = false;
    }

    // VALIDACIÓN: Si se selecciona cualquier método, cambiar status automáticamente a "entregado"
    if (this.statusFormData.methodFisico || this.statusFormData.methodDigital || this.statusFormData.methodAmbos) {
      this.statusFormData.status = 'entregado';
    }
  }

  /**
   * Obtiene el método seleccionado basado en los checkboxes
   */
  getSelectedMethod(): string {
    if (this.statusFormData.methodAmbos) {
      return 'ambos';
    } else if (this.statusFormData.methodFisico) {
      return 'fisico';
    } else if (this.statusFormData.methodDigital) {
      return 'digital';
    }
    return '';
  }

  /**
   * Valida si el formulario es válido
   */
  isValidForm(): boolean {
    // El status es requerido
    if (!this.statusFormData.status) {
      return false;
    }

    // Si el status es 'entregado', debe tener al menos un método seleccionado
    if (this.statusFormData.status === 'entregado') {
      return this.statusFormData.methodFisico || this.statusFormData.methodDigital || this.statusFormData.methodAmbos;
    }

    return true;
  }

  /**
   * Actualiza el status y método de la orden
   */
  updateOrderStatus() {
    console.log("entra");
    if (!this.isValidForm() || !this.selectedOrder) {
      return;
    }

    // Preparar datos para actualizar status
    const statusData = {
      status: this.statusFormData.status
    };
    console.log(statusData);
    // Primero actualizar el status
    this.api.updateData('order/updatestatus', this.selectedOrder.id, statusData).subscribe(
      (response: any) => {
        // Actualizar el status en la lista local
        console.log(response);
        const orderIndex = this.orders.findIndex(o => o.id === this.selectedOrder.id);
        if (orderIndex !== -1) {
          this.orders[orderIndex].status = statusData.status;
        }
        
        // Mantener el ordenamiento después de la actualización
        this.sortOrdersByDate();
        
        // Si el status es 'entregado', actualizar también el método
        if (this.statusFormData.status === 'entregado') {
          const selectedMethod = this.getSelectedMethod();
          if (selectedMethod) {
            this.updateOrderMethod(selectedMethod);
          } else {
            this.showSuccessAndClose();
          }
        } else {
        
          this.clearOrderMethod();
        }
      },
      (error) => {
        console.log(error.error);
        Swal.fire({
          title: 'Error',
          icon: 'error',
          text: error.error?.msg || 'No se pudo actualizar el status de la orden.',
          confirmButtonColor: '#198754'
        });
      }
    );
  }

  /**
   * Actualiza el método de entrega de la orden
   */
  private updateOrderMethod(method: string) {
    const methodData = {
      method: method
    };

    this.api.updateData('order/updatemethod', this.selectedOrder.id, methodData).subscribe(
      (response: any) => {
        // Actualizar el método en la lista local
        const orderIndex = this.orders.findIndex(o => o.id === this.selectedOrder.id);
        if (orderIndex !== -1) {
          this.orders[orderIndex].method = method;
        }
        
        // Mantener el ordenamiento después de la actualización
        this.sortOrdersByDate();
        this.filtered = [...this.orders]; // Actualizar lista filtrada

        this.showSuccessAndClose();
      },
      (error) => {
        Swal.fire({
          title: 'Error en Método',
          icon: 'error',
          text: error.error?.msg || 'No se pudo actualizar el método de entrega.',
          confirmButtonColor: '#198754'
        });
      }
    );
  }

  /**
   * Limpia el método de entrega cuando el status no es 'entregado'
   */
  private clearOrderMethod() {
    // Actualizar localmente - el método vuelve a "por_definir"
    const orderIndex = this.orders.findIndex(o => o.id === this.selectedOrder.id);
    if (orderIndex !== -1) {
      this.orders[orderIndex].method = 'por_definir';
    }
    
    // Mantener el ordenamiento después de la actualización
    this.sortOrdersByDate();
    this.filtered = [...this.orders]; // Actualizar lista filtrada

    this.showSuccessAndClose();
  }

  /**
   * Muestra mensaje de éxito y cierra el modal
   */
  private showSuccessAndClose() {
    Swal.fire({
      title: 'Actualización Exitosa',
      icon: 'success',
      text: 'El status de la orden ha sido actualizado correctamente.',
      confirmButtonColor: '#198754'
    });

    // Cerrar modal
    this.closeModal('#statusModal');
  }

  /**
   * Envía la información de la orden por WhatsApp
   */
  sendWhatsApp(order: any) {
    if (!order.phone) {
      Swal.fire({
        title: 'Error',
        text: 'Esta orden no tiene número de teléfono registrado',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Limpiar el número de teléfono (solo números)
    const cleanPhone = this.cleanPhoneNumber(order.phone);
    
    if (!cleanPhone) {
      Swal.fire({
        title: 'Error',
        text: 'El número de teléfono no es válido',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Mostrar opciones de envío
    this.showWhatsAppOptions(order, cleanPhone);
  }

  /**
   * Muestra las opciones de envío por WhatsApp
   */
  private showWhatsAppOptions(order: any, phone: string) {
    Swal.fire({
      title: '📱 Enviar por WhatsApp',
      html: `
        <div class="text-start">
          <p><strong>📞 Número:</strong> +${phone}</p>
          <p><strong>👤 Paciente:</strong> ${order.patient}</p>
          <p><strong>📋 Folio:</strong> ${order.appointment_code || 'Sin folio'}</p>
          <hr>
          <p class="mb-3"><strong>Seleccione qué desea enviar:</strong></p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: '#25D366',
      denyButtonColor: '#ff6b6b',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '📄 Solo Información',
      denyButtonText: '📎 Información + PDF',
      cancelButtonText: '❌ Cancelar',
      width: '500px'
    }).then((result) => {
      if (result.isConfirmed) {
        // Solo enviar mensaje
        this.sendWhatsAppMessage(order, phone, false);
      } else if (result.isDenied) {
        // Enviar mensaje + PDF
        this.sendWhatsAppWithFile(order, phone);
      }
    });
  }

  /**
   * Envía solo el mensaje por WhatsApp
   */
  private sendWhatsAppMessage(order: any, phone: string, withFile: boolean = false) {
    const message = this.generateWhatsAppMessage(order, withFile);
    this.showWhatsAppPreview(order, message, phone, withFile);
  }

  /**
   * Prepara el envío con archivo PDF
   */
  private sendWhatsAppWithFile(order: any, phone: string) {
    // Mostrar loading mientras se prepara el archivo
    Swal.fire({
      title: 'Preparando archivo...',
      text: 'Generando enlace del PDF',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Generar URL del PDF
    const pdfUrl = this.getPdfUrl(order);
    
    setTimeout(() => {
      Swal.close();
      const message = this.generateWhatsAppMessage(order, true, pdfUrl);
      this.showWhatsAppPreview(order, message, phone, true, pdfUrl);
    }, 1000);
  }

  /**
   * Obtiene la URL del PDF según el tipo de orden
   */
  private getPdfUrl(order: any): string {
    if (order.appointment_code !== null) {
      return `${this.env.url}file/getfile/download/${order.appointment_code}.pdf`;
    } else {
      return `${this.env.url}file/getfile/downloadbyid/${order.id}.pdf`;
    }
  }

  /**
   * Genera el mensaje de WhatsApp con la información de la orden
   */
  private generateWhatsAppMessage(order: any, withFile: boolean = false, pdfUrl?: string): string {
    const folio = order.appointment_code || 'Sin folio';
    const codigoEntrega = order.code_ticket || 'Sin código';
    const status = this.getStatusText(order.status);
    const metodo = this.getMethodText(order.method || 'por_definir');
    const fechaCreacion = new Date(order.created_at).toLocaleDateString('es-MX');

    let message = `🦷 *CERAOR - Información de su Orden*

👤 *Paciente:* ${order.patient}
📋 *Folio:* ${folio}
🏷️ *Código de Entrega:* ${codigoEntrega}
📊 *Estado:* ${status}
📦 *Método de Entrega:* ${metodo}
🩺 *Doctor:* ${order.doctor}
📅 *Fecha de Creación:* ${fechaCreacion}`;

    if (withFile && pdfUrl) {
      message += `

📎 *Archivo PDF:* ${pdfUrl}

_Descargue el archivo haciendo clic en el enlace._`;
    }

    message += `

¡Gracias por confiar en nuestros servicios!

_Este es un mensaje automático del sistema CERAOR._`;

    return message;
  }

  /**
   * Limpia el número de teléfono para WhatsApp
   */
  private cleanPhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Remover todos los caracteres que no sean números
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Si el número empieza con 52 (código de México), mantenerlo
    // Si empieza con 1, removerlo y agregar 52
    // Si no tiene código de país, agregar 52
    if (cleanPhone.startsWith('52') && cleanPhone.length >= 12) {
      return cleanPhone;
    } else if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
      return '52' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 10) {
      return '52' + cleanPhone;
    }
    
    return cleanPhone;
  }

  /**
   * Muestra un preview del mensaje antes de enviar por WhatsApp
   */
  private showWhatsAppPreview(order: any, message: string, phone: string, withFile: boolean = false, pdfUrl?: string) {
    let fileInfo = '';
    if (withFile && pdfUrl) {
      fileInfo = `
        <div class="alert alert-info mt-2">
          <p class="mb-1"><strong>📎 Archivo incluido:</strong></p>
          <p class="mb-0 small">Se enviará el enlace del PDF de la orden</p>
        </div>
      `;
    }

    Swal.fire({
      title: withFile ? '📱📎 Enviar WhatsApp + PDF' : '📱 Enviar WhatsApp',
      html: `
        <div class="text-start">
          <p><strong>📞 Número:</strong> +${phone}</p>
          <p><strong>👤 Paciente:</strong> ${order.patient}</p>
          ${fileInfo}
          <hr>
          <p><strong>📝 Mensaje a enviar:</strong></p>
          <div class="bg-light p-3 rounded" style="white-space: pre-line; font-family: monospace; font-size: 12px; max-height: 300px; overflow-y: auto;">
${message}
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#25D366',
      cancelButtonColor: '#d33',
      confirmButtonText: withFile ? '📤📎 Enviar con PDF' : '📤 Enviar WhatsApp',
      cancelButtonText: '❌ Cancelar',
      width: '650px'
    }).then((result) => {
      if (result.isConfirmed) {
        this.openWhatsApp(phone, message);
      }
    });
  }

  /**
   * Abre WhatsApp con el mensaje predefinido
   */
  private openWhatsApp(phone: string, message: string) {
    // Codificar el mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Crear URL de WhatsApp
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    // Abrir WhatsApp en una nueva ventana/pestaña
    window.open(whatsappUrl, '_blank');
    
    // Mostrar confirmación
    Swal.fire({
      title: '✅ WhatsApp Abierto',
      text: 'Se ha abierto WhatsApp con el mensaje pre-escrito. Solo necesita hacer clic en enviar.',
      icon: 'success',
      confirmButtonText: 'Entendido',
      timer: 3000,
      timerProgressBar: true
    });
  }
}
