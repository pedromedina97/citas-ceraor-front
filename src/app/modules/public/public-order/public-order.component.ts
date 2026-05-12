import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CeraorService } from '../../../services/ceraor.service';

interface Service {
  id: string;
  name: string;
  price?: number;
  description: string;
  image?: string;
  selected?: boolean;
}

interface Category {
  id: string;
  name: string;
  inputs: string | null;
  services: Service[];
}

interface Packet {
  id: string;
  name: string;
  price: number;
  services: Service[];
  selected?: boolean;
}

interface Subsidiary {
  id: string;
  name: string;
}

@Component({
  selector: 'app-public-order',
  standalone: false,
  templateUrl: './public-order.component.html',
  styleUrl: './public-order.component.scss'
})
export class PublicOrderComponent implements OnInit {
  // Datos del paciente
  paciente = {
    nombre: '',
    paterno: '',
    materno: '',
    telefono: '',
    dia: '01',
    mes: 'Enero',
    anio: '2026',
    email: ''
  };

  // Datos del doctor
  doctor = {
    nombre: '',
    paterno: '',
    materno: '',
    telefono: '',
    email: ''
  };

  // Subsidiaries
  subsidiaries: Subsidiary[] = [];
  selectedSubsidiaryId: string = '';

  // Packets and categories from API
  packets: Packet[] = [];
  categories: Category[] = [];
  selectedServices: string[] = [];
  selectedPacketId: string = '';

  // Valores de inputs dinámicos por categoría
  // Estructura: { categoryId: { inputName: value } }
  categoryInputsValues: { [categoryId: string]: { [inputName: string]: any } } = {};
  
  // Cache de inputs parseados para evitar parsear en cada change detection
  categoryParsedInputs: { [categoryId: string]: any[] } = {};

  // Modal de orden creada
  showOrderModal: boolean = false;
  createdOrderData: any = null;

  // Arrays para los selects
  dias: string[] = [];
  meses: string[] = ['Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  anios: string[] = [];

  // Exponer Object.keys para usar en el template
  Object = Object;

  constructor(
    private ceraorService: CeraorService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.generateDias();
    this.generateAnios();
    this.loadSubsidiaries();
  }

  generateDias(): void {
    for (let i = 2; i <= 31; i++) {
      this.dias.push(i.toString().padStart(2, '0'));
    }
  }

  generateAnios(): void {
    const currentYear = 2026;
    for (let i = currentYear - 1; i >= currentYear - 100; i--) {
      this.anios.push(i.toString());
    }
  }

  loadSubsidiaries(): void {
    console.log('Loading subsidiaries...');
    this.ceraorService.getData('catalog/getsubsidiaries/').subscribe({
      next: (response: any) => {
        console.log('Subsidiaries response:', response);
        console.log('Response type:', typeof response);
        if (response.status === 'success' && response.data) {
          this.subsidiaries = response.data;
          console.log('Subsidiaries loaded:', this.subsidiaries);
          // Seleccionar la primera sucursal por defecto si existe
          if (this.subsidiaries.length > 0) {
            this.selectedSubsidiaryId = this.subsidiaries[0].id;
            this.loadFormData();
          }
        }
      },
      error: (error) => {
        console.error('Error loading subsidiaries:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Response body:', error.error);
        console.error('Response text:', error.error ? JSON.stringify(error.error) : 'N/A');
      }
    });
  }

  onSubsidiaryChange(): void {
    if (this.selectedSubsidiaryId) {
      this.loadFormData();
    }
  }

  loadFormData(): void {
    if (!this.selectedSubsidiaryId) {
      return;
    }

    this.ceraorService.getData(`order/getformorder/${this.selectedSubsidiaryId}`).subscribe({
      next: (response: any) => {
        console.log(response);
        if (response.status === 'success' && response.data) {
          this.packets = response.data.packets || [];
          this.categories = (response.data.categories || []).filter((cat: Category) => cat.services.length > 0);
          
          // Inicializar inputs dinámicos para cada categoría
          this.categories.forEach(category => {
            this.initializeCategoryInputs(category);
          });
          
          // Limpiar selecciones anteriores
          this.selectedServices = [];
          this.selectedPacketId = '';
        }
      },
      error: (error) => {
        console.error('Error loading form data:', error);
      }
    });
  }

  onPacketChange(packetId: string): void {
    this.selectedPacketId = packetId;
    // Opcional: Podrías auto-seleccionar los servicios del paquete
  }

  onServiceChange(serviceId: string, isChecked: boolean): void {
    if (isChecked) {
      if (!this.selectedServices.includes(serviceId)) {
        this.selectedServices.push(serviceId);
      }
    } else {
      const index = this.selectedServices.indexOf(serviceId);
      if (index > -1) {
        this.selectedServices.splice(index, 1);
      }
    }
  }

  isServiceSelected(serviceId: string): boolean {
    return this.selectedServices.includes(serviceId);
  }

  isPacketSelected(packetId: string): boolean {
    return this.selectedPacketId === packetId;
  }

  getImageUrl(base64Image: string): SafeUrl {
    if (!base64Image) {
      return '';
    }
    
    // Si la imagen ya tiene el prefijo data:image, usarla directamente
    if (base64Image.startsWith('data:image')) {
      return this.sanitizer.bypassSecurityTrustUrl(base64Image);
    }
    
    // Si no, intentar detectar el formato y agregar el prefijo apropiado
    // Por defecto, usar jpeg que es más común
    let imageUrl = '';
    
    // Detectar formato basado en los primeros caracteres de base64
    if (base64Image.startsWith('/9j/')) {
      // JPEG
      imageUrl = `data:image/jpeg;base64,${base64Image}`;
    } else if (base64Image.startsWith('iVBORw0KGgo')) {
      // PNG
      imageUrl = `data:image/png;base64,${base64Image}`;
    } else if (base64Image.startsWith('R0lGOD')) {
      // GIF
      imageUrl = `data:image/gif;base64,${base64Image}`;
    } else if (base64Image.startsWith('UklGR')) {
      // WebP
      imageUrl = `data:image/webp;base64,${base64Image}`;
    } else {
      // Default to jpeg
      imageUrl = `data:image/jpeg;base64,${base64Image}`;
    }
    
    return this.sanitizer.bypassSecurityTrustUrl(imageUrl);
  }

  /**
   * Parsea los inputs de una categoría (JSON string a array)
   */
  parseInputs(inputsString: string | null): any[] {
    if (!inputsString || inputsString === 'null' || inputsString.trim() === '') {
      return [];
    }

    try {
      let trimmed = inputsString.trim();
      
      // Si el string empieza con comillas, puede estar doblemente stringificado
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        try {
          trimmed = JSON.parse(trimmed);
        } catch (e) {
          // Si falla, continuar con el string original
        }
      }
      
      // Verificar si es un JSON válido
      if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
        return [];
      }
      
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing category inputs:', error);
      return [];
    }
  }

  /**
   * Inicializa los valores por defecto de los inputs de una categoría
   */
  initializeCategoryInputs(category: Category): void {
    const inputs = this.parseInputs(category.inputs);
    
    // Cachear los inputs parseados para evitar parsear en cada change detection
    this.categoryParsedInputs[category.id] = inputs;
    
    if (inputs.length === 0) {
      return;
    }

    if (!this.categoryInputsValues[category.id]) {
      this.categoryInputsValues[category.id] = {};
    }

    inputs.forEach((input: any) => {
      if (!this.categoryInputsValues[category.id][input.name]) {
        // Inicializar con el valor por defecto según el tipo
        if (input.input === 'text') {
          this.categoryInputsValues[category.id][input.name] = input.value || '';
        } else if (input.input === 'checkbox') {
          this.categoryInputsValues[category.id][input.name] = input.value || false;
        } else if (input.input === 'radiobutton') {
          this.categoryInputsValues[category.id][input.name] = input.value || '';
        }
      }
    });
  }

  /**
   * Obtiene el valor de un input específico de una categoría
   */
  getCategoryInputValue(categoryId: string, inputName: string): any {
    return this.categoryInputsValues[categoryId]?.[inputName] || '';
  }

  /**
   * Establece el valor de un input específico de una categoría
   */
  setCategoryInputValue(categoryId: string, inputName: string, value: any): void {
    if (!this.categoryInputsValues[categoryId]) {
      this.categoryInputsValues[categoryId] = {};
    }
    this.categoryInputsValues[categoryId][inputName] = value;
    
    // Debug log
    console.log(`📝 Input actualizado: [${inputName}] = ${JSON.stringify(value)}`);
    console.log('Valores actuales de la categoría:', this.categoryInputsValues[categoryId]);
  }

  /**
   * Verifica si una categoría tiene inputs personalizados
   */
  hasCustomInputs(category: Category): boolean {
    // Usar el cache en lugar de parsear cada vez
    return (this.categoryParsedInputs[category.id] || []).length > 0;
  }

  /**
   * Obtiene los inputs parseados de una categoría desde el cache
   */
  getParsedInputs(category: Category): any[] {
    return this.categoryParsedInputs[category.id] || [];
  }

  /**
   * TrackBy function para categorías
   */
  trackByCategory(index: number, category: Category): string {
    return category.id;
  }

  /**
   * TrackBy function para servicios
   */
  trackByService(index: number, service: any): string {
    return service.id;
  }

  /**
   * TrackBy function para inputs
   */
  trackByInput(index: number, input: any): string {
    return input.name;
  }

  /**
   * TrackBy function para opciones de radiobutton
   */
  trackByOption(index: number, option: string): string {
    return option;
  }

  /**
   * Obtiene todos los datos del formulario para envío (función de utilidad)
   * Útil para cuando implementes el envío del formulario
   */
  getFormData(): any {
    return {
      paciente: this.paciente,
      doctor: this.doctor,
      subsidiary: this.selectedSubsidiaryId,
      packet: this.selectedPacketId,
      services: this.selectedServices,
      categoryInputs: this.categoryInputsValues
    };
  }

  /**
   * Convierte la fecha de nacimiento al formato YYYY-MM-DD
   */
  private formatBirthdate(): string {
    const monthMap: { [key: string]: string } = {
      'Enero': '01', 'Febrero': '02', 'Marzo': '03', 'Abril': '04',
      'Mayo': '05', 'Junio': '06', 'Julio': '07', 'Agosto': '08',
      'Septiembre': '09', 'Octubre': '10', 'Noviembre': '11', 'Diciembre': '12'
    };
    
    const year = this.paciente.anio;
    const month = monthMap[this.paciente.mes] || '01';
    const day = this.paciente.dia;
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Genera el body en el formato esperado por el endpoint POST order/create
   */
  getOrderBody(): any {
    // Construir el nombre completo del paciente
    const patientName = `${this.paciente.nombre} ${this.paciente.paterno} ${this.paciente.materno}`.trim();
    
    // Construir el nombre completo del doctor con formato "Dr. nombre"
    const doctorFullName = `${this.doctor.nombre} ${this.doctor.paterno} ${this.doctor.materno}`.trim();
    const doctorName = doctorFullName ? `Dr. ${doctorFullName}` : '';
    
    // Construir el objeto content con servicios, paquetes y campos dinámicos
    const contentData = {
      servicios: this.selectedServices,
      paquetes: this.selectedPacketId ? [this.selectedPacketId] : [],
      camposDinamicos: this.categoryInputsValues,
      notas: ""
    };
    
    // Formato final del body - mantener el orden de los campos de la BD
    return {
      patient: patientName || "",
      birthdate: this.formatBirthdate(),
      phone: this.paciente.telefono || "",
      doctor: doctorName || "",
      address: "",
      professional_id: "",
      email: this.paciente.email || "",
      status: "pending",
      method: "cash",
      content: JSON.stringify(contentData),
    };
  }

  /**
   * Debug: Muestra todos los datos capturados en consola
   */
  logFormData(): void {
    console.log('📋 DATOS DEL FORMULARIO:');
    console.log('========================');
    console.log('Paciente:', this.paciente);
    console.log('Doctor:', this.doctor);
    console.log('Sucursal:', this.selectedSubsidiaryId);
    console.log('Paquete seleccionado:', this.selectedPacketId);
    console.log('Servicios seleccionados:', this.selectedServices);
    console.log('Inputs personalizados por categoría:', this.categoryInputsValues);
    console.log('========================');
    console.log('📤 BODY PARA ENDPOINT:');
    console.log(this.getOrderBody());
  }

  /**
   * Valida que los campos requeridos estén completos
   */
  validateForm(): boolean {
    if (!this.paciente.nombre || !this.paciente.paterno) {
      alert('Por favor, completa el nombre del paciente');
      return false;
    }
    
    if (!this.paciente.telefono) {
      alert('Por favor, ingresa el teléfono del paciente');
      return false;
    }
    
    if (!this.paciente.email) {
      alert('Por favor, ingresa el email del paciente');
      return false;
    }
    
    if (!this.selectedSubsidiaryId) {
      alert('Por favor, selecciona una sucursal');
      return false;
    }
    
    return true;
  }

  /**
   * Envía el formulario al endpoint POST order/create
   */
  submitOrder(): void {
    // Validar formulario antes de enviar
    if (!this.validateForm()) {
      return;
    }
    
    const orderBody = this.getOrderBody();
    
    console.log('📤 ENVIANDO ORDEN AL SERVIDOR');
    console.log('================================');
    console.log('Endpoint: order/create');
    console.log('Body completo:', orderBody);
    console.log('');
    console.log('Desglose de campos:');
    console.log('- patient:', orderBody.patient);
    console.log('- birthdate:', orderBody.birthdate);
    console.log('- phone:', orderBody.phone);
    console.log('- doctor:', orderBody.doctor);
    console.log('- email:', orderBody.email);
    console.log('- content:', orderBody.content);
    console.log('================================');
    
    this.ceraorService.createData('order/create', [orderBody]).subscribe({
      next: (response: any) => {
        console.log('✅ ORDEN CREADA EXITOSAMENTE');
        console.log('Respuesta completa del servidor:', response);
        console.log('Tipo de response.data:', typeof response.data);
        console.log('response.data:', response.data);
        
        // Intentar obtener el ID de diferentes estructuras posibles
        let orderId = null;
        
        if (response.status === 'success' && response.data) {
          // Si data es un objeto con id
          if (response.data.id) {
            orderId = response.data.id;
          }
          // Si data es un array
          else if (Array.isArray(response.data) && response.data.length > 0 && response.data[0].id) {
            orderId = response.data[0].id;
          }
          // Si el id está directamente en response
          else if (response.id) {
            orderId = response.id;
          }
        }
        
        console.log('ID de orden extraído:', orderId);
        
        if (orderId) {
          // Obtener los datos completos de la orden
          this.getOrderById(orderId);
        } else {
          console.warn('⚠️ No se pudo obtener el ID de la orden de la respuesta');
          console.log('Estructura de response:', JSON.stringify(response, null, 2));
          alert('Orden creada exitosamente, pero no se pudo obtener el detalle.');
        }
      },
      error: (error) => {
        console.error('❌ ERROR AL CREAR LA ORDEN');
        console.error('Error completo:', error);
        console.error('Status:', error.status);
        console.error('Mensaje:', error.message);
        console.error('Body enviado:', orderBody);
        alert('Error al crear la orden. Revisa la consola para más detalles.');
      }
    });
  }

  /**
   * Obtiene los datos completos de una orden por ID
   */
  getOrderById(orderId: string): void {
    console.log('📥 Obteniendo datos de la orden:', orderId);
    console.log('Endpoint completo:', `order/getbyid/${orderId}`);
    
    this.ceraorService.getData(`order/getbyid/${orderId}`).subscribe({
      next: (response: any) => {
        console.log('✅ Datos de la orden obtenidos');
        console.log('Respuesta completa:', response);
        console.log('response.status:', response.status);
        console.log('response.data:', response.data);
        console.log('Es array?', Array.isArray(response.data));
        console.log('Longitud:', response.data?.length);
        
        if (response.status === 'success' && response.data && response.data.length > 0) {
          this.createdOrderData = response.data[0];
          console.log('💾 Datos de orden guardados:', this.createdOrderData);
          console.log('🔓 Mostrando modal...');
          this.showOrderModal = true;
          console.log('showOrderModal =', this.showOrderModal);
        } else {
          console.warn('⚠️ La respuesta no tiene el formato esperado');
          alert('Orden creada, pero no se pudo obtener los detalles.');
        }
      },
      error: (error) => {
        console.error('❌ Error al obtener la orden:', error);
        console.error('Status:', error.status);
        console.error('Mensaje:', error.message);
        alert('Orden creada, pero hubo un error al obtener los detalles.');
      }
    });
  }

  /**
   * Cierra el modal de orden creada
   */
  closeOrderModal(): void {
    this.showOrderModal = false;
    this.createdOrderData = null;
  }

  /**
   * Parsea el contenido JSON de la orden
   */
  getParsedContent(order: any): any {
    try {
      return JSON.parse(order.content);
    } catch (error) {
      console.error('Error parseando content:', error);
      return {};
    }
  }

  /**
   * MÉTODO DE PRUEBA: Abre el modal con datos de ejemplo
   */
  testModal(): void {
    console.log('🧪 Probando modal...');
    this.createdOrderData = {
      id: "test-id-12345",
      folio_order: "TEST-001",
      patient: "Juan Pérez González",
      birthdate: "1990-01-15",
      phone: "5551234567",
      doctor: "Dr. María López",
      address: "Calle Principal #123",
      professional_id: "12345678",
      email: "test@email.com",
      status: "pending",
      method: "cash",
      content: '{"servicios":["serv-1","serv-2"],"paquetes":["paq-1"],"camposDinamicos":{},"notas":"Prueba"}',
      code_ticket: "T-001",
      active: "1",
      created_at: "2026-04-08",
      updated_at: "2026-04-08"
    };
    this.showOrderModal = true;
    console.log('Modal abierto:', this.showOrderModal);
  }
}
