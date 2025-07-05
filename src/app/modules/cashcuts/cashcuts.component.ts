import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CeraorService } from '../../services/ceraor.service';
import { PermissionsService } from '../../services/permissions.service';
import * as bootstrap from 'bootstrap';
import { Environment } from '../../Env/env';

@Component({
  selector: 'app-cashcuts',
  standalone: false,
  templateUrl: './cashcuts.component.html',
  styleUrl: './cashcuts.component.scss'
})
export class CashcutsComponent implements OnInit {
  permissions: any;
  cashcuts: any[] = [];
  filtered: any[] = [];
  filterText: string = '';
  id: string;
  idUser: string;
  name: String;
  lastname: String;
  rol: string;
  page: number = 1;
  itemsPerPage: number = 5;
  rols: any;
  env = Environment;
  subsidiaries: any;
  isLoading: boolean = true;

  // Filtros adicionales
  selectedSubsidiary: string = '';
  startDate: string = '';
  endDate: string = '';



  constructor(private api: CeraorService, private permissionsService: PermissionsService, private cd: ChangeDetectorRef, private router: Router, private zone: NgZone) { }

  ngOnInit() {
    this.setPermissions();
    this.getData();
    this.getSubsidiaries();
  }



  getSubsidiaries() {
    this.api.getData('catalog/getall/subsidiaries').subscribe(
      (resp: any) => {
        this.subsidiaries = resp.data;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  downloadPdfCashcut(url: string, fileName: string) {
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

  downloadXlsCashcut(url: string, fileName: string) {
    Swal.fire({
      title: 'Descargando Excel...',
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
        a.download = `${fileName}.xlsx`; // Nombre dinámico
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadURL); // Limpia memoria
      },
      error => {
        Swal.close();
        console.error('Error al descargar el XLS:', error);
        Swal.fire('Error', 'No se pudo descargar el XLS.', 'error');
      }
    );
  }

  downloadRangoCashcuts() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 indexado

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    let opciones = '';
    for (let y = currentYear; y >= currentYear - 3; y--) {
      for (let m = 11; m >= 0; m--) {
        const value = `${y}-${m + 1}`;
        const text = `${meses[m]} ${y}`;
        const selected = (y === currentYear && m === currentMonth) ? 'selected' : '';
        opciones += `<option value="${value}" ${selected}>${text}</option>`;
      }
    }

    const sucursalOptions = this.subsidiaries.map(s =>
      `<option value="${s.id}">${s.name}</option>`).join('');

    Swal.fire({
      title: 'Selecciona el rango y sucursal',
      html: `
      <label for="inicio">Desde:</label>
      <select id="inicio" class="swal2-input">${opciones}</select><br><br>
      <label for="fin">Hasta:</label>
      <select id="fin" class="swal2-input">${opciones}</select><br><br>
      <label for="sucursal">Sucursal:</label>
      <select id="sucursal" class="swal2-input">${sucursalOptions}</select>
    `,
      preConfirm: () => {
        const inicio = (document.getElementById('inicio') as HTMLSelectElement).value;
        const fin = (document.getElementById('fin') as HTMLSelectElement).value;
        const sucursal = (document.getElementById('sucursal') as HTMLSelectElement).value;

        if (!inicio || !fin || !sucursal) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }

        const [iY, iM] = inicio.split('-').map(Number);
        const [fY, fM] = fin.split('-').map(Number);

        if (iY > fY || (iY === fY && iM > fM)) {
          Swal.showValidationMessage('La fecha inicial debe ser menor o igual a la final');
          return false;
        }

        return `${iY}-${iM}-${fY}-${fM}::${sucursal}`;

      },
      showCancelButton: true,
      confirmButtonText: 'Descargar',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        const rangoSucursal = res.value;
        const nombreArchivo = `cortes-${rangoSucursal.replace(/[^a-zA-Z0-9_-]/g, '')}.xlsx`;

        Swal.fire({
          title: 'Descargando Excel...',
          text: 'Por favor espera unos segundos.',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.api.http.get(`${this.env.url}cashcut/cashcut-export-range/${rangoSucursal}`, { responseType: 'blob' }).subscribe(
          blob => {
            const reader = new FileReader();
            reader.onload = () => {
              const text = reader.result as string;

              if (text.startsWith('{') && text.includes('"error"')) {
                Swal.close();
                const error = JSON.parse(text);
                Swal.fire('Error', error.error || 'No se pudo generar el archivo.', 'error');
              } else {
                Swal.close();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cortes-${rangoSucursal.replace(/[^a-zA-Z0-9_-]/g, '')}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            };

            reader.readAsText(blob); // para verificar si es JSON antes de tratarlo como Excel
          },
          err => {
            Swal.close();
            console.error(err);
            Swal.fire('Error', 'No se pudo generar el archivo.', 'error');
          }
        );

      }
    });
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
  this.api.getData('cashcut/getall').subscribe(
    (data: any) => {
      this.cashcuts = data.data;
      this.filtered = [...this.cashcuts];
      this.isLoading = false;
    },
    (error) => {
      console.log(error.error);
      this.isLoading = false;
    }
  );
}

  filter() {
    this.page = 1; // Reiniciar a la página 1
    const searchText = this.filterText.toLowerCase();
    const subsidiary = this.selectedSubsidiary;
    const start = this.startDate ? new Date(this.startDate) : null;
    const end = this.endDate ? new Date(this.endDate) : null;

    this.filtered = this.cashcuts.filter(cashcut => {
      const matchesText = cashcut.user_name.toLowerCase().includes(searchText) ||
        cashcut.subsidiary_name.toLowerCase().includes(searchText);

      const matchesSubsidiary = subsidiary ? cashcut.subsidiary_name === subsidiary : true;

      const startDate = new Date(cashcut.start_date);
      const endDate = new Date(cashcut.end_date);

      const matchesStartDate = start ? startDate >= start : true;
      const matchesEndDate = end ? endDate <= end : true;

      return matchesText && matchesSubsidiary && matchesStartDate && matchesEndDate;
    });
  }

  resetFilters() {
    this.filterText = '';
    this.selectedSubsidiary = '';
    this.startDate = '';
    this.endDate = '';
    this.page = 1;
    this.filtered = [...this.cashcuts];
  }

}
