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

  // Arrays para los selects
  dias: string[] = [];
  meses: string[] = ['Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  anios: string[] = [];

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
}
