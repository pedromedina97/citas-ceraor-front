import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CeraorService } from '../../services/ceraor.service';
import CounterUp from 'counterup2';
import Swal from 'sweetalert2';

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  PieController,
  ArcElement,
  BarController,
  BarElement
} from 'chart.js';
import { PermissionsService } from '../../services/permissions.service';

// Registro manual (obligatorio desde Chart.js v3+)
Chart.register(
  PieController,
  ArcElement,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  @ViewChild('pieCanvas') pieCanvas!: ElementRef;
  @ViewChild('barCanvas') barCanvas!: ElementRef;
  @ViewChild('weeklyCanvas') weeklyCanvas!: ElementRef;
  weeklyChart!: Chart;
  barChart!: Chart;
  chart!: Chart;
  pieChart!: Chart;
  cashcuts: any;
  data: any;
  doctorData: any;
  topServices: any[] = [];
  gainsWeek: any;
  rol: String;
  permissions: any;
  idUser: string = '';
  userName: string = '';
  userLastname: string = '';

  months: { value: string; label: string }[] = [];
  selectedMonth = new Date().toISOString().slice(0, 7);


  ngAfterViewInit(): void {
    this.getRol();
    const elements = document.querySelectorAll('.counter');
    elements.forEach(el => {
      CounterUp(el, {
        duration: 1000, // tiempo en ms
        delay: 16,      // delay entre números
      });
    });
    // Asegurar que los permisos estén cargados antes de inicializar gráficas
    this.permission.getPermissions().subscribe(
      permissions => {
        this.permissions = permissions;
        if (this.hasPermissions('see_admingraphic')) {
          this.getTopServices();
          this.getGainsWeek();
        }
      }
    );
  }

  ngOnInit(): void {
    this.months = this.generateMonths(1); // Por ejemplo, últimos 12–18 meses
    this.loadUserInfo();
    
    // Cargar permisos y luego inicializar gráficas si se tienen permisos
    this.permission.getPermissions().subscribe(
      permissions => {
        this.permissions = permissions;
        if (this.hasPermissions('see_admingraphic')) {
          this.getGainsByMonth(this.selectedMonth);
          this.getPercent();
        }
      }
    );
  }

  constructor(private api: CeraorService, private permission: PermissionsService) { }

  ngOnDestroy(): void {
    // Destruir todas las gráficas al salir del componente
    const charts = [this.chart, this.pieChart, this.barChart, this.weeklyChart];
    charts.forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
  }

  generateMonths(yearsBack = 1): { value: string; label: string }[] {
  const monthsList: { value: string; label: string }[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = enero)
  
  // Desde año actual hacia atrás
  for (let y = currentYear; y >= currentYear - yearsBack; y--) {
    const lastMonth = y === currentYear ? currentMonth : 11; // Solo hasta el mes actual en el año actual
    for (let m = lastMonth; m >= 0; m--) {
      const monthValue = `${y}-${String(m + 1).padStart(2, '0')}`;
      const monthLabel = new Date(y, m).toLocaleString('es-MX', {
        month: 'long',
        year: 'numeric'
      });
      monthsList.push({
        value: monthValue,
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)
      });
    }
  }

  return monthsList;
}


  getTopServices() {
    this.api.getData('cashcut/cashcut-top-services').subscribe((resp: any) => {
      this.topServices = resp.data;

      const data = this.topServices;
      const labels = data.map((item: any) => item.servicio);
      const totals = data.map((item: any) => item.total);

      // Asegúrate de destruir el gráfico anterior si existe
      if (this.barChart) {
        this.barChart.destroy();
      }

      const ctx = this.barCanvas.nativeElement.getContext('2d');
      this.barChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Servicios más solicitados',
            data: totals,
            backgroundColor: 'rgba(54, 162, 235, 0.6)'
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          scales: {
            x: { beginAtZero: true }
          }
        }
      });
    });
  }

  getGainsWeek() {
    if (!this.weeklyCanvas) {
      console.warn('Canvas para gráfica semanal no encontrado');
      return;
    }

    this.api.getData('cashcut/gains-week').subscribe({
      next: (resp: any) => {
        try {
          if (!resp.data || !Array.isArray(resp.data) || resp.data.length === 0) {
            console.warn('No hay datos de ingresos semanales disponibles');
            return;
          }

          this.gainsWeek = resp.data;

          // Formatear fechas y totales
          const labels = this.gainsWeek.map((item: any) => {
            const fecha = new Date(item.fecha);
            return fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
          });

          const totals = this.gainsWeek.map((item: any) => {
            const total = parseFloat(item.total_dia);
            return isNaN(total) ? 0 : total;
          });

          const ctx = this.weeklyCanvas.nativeElement.getContext('2d');

          // Destruir gráfica existente si hay una
          if (this.weeklyChart) {
            this.weeklyChart.destroy();
          }

          // Crear nueva gráfica
          this.weeklyChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [{
                label: 'Ingresos semanales ($)',
                data: totals,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.3,
                borderWidth: 2,
                pointRadius: 3
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Ingresos ($)'
                  },
                  ticks: {
                    callback: function(value) {
                      return '$ ' + value.toLocaleString('es-MX');
                    }
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Fecha'
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      let label = context.dataset.label || '';
                      if (label) {
                        label += ': ';
                      }
                      label += '$ ' + context.parsed.y.toLocaleString('es-MX');
                      return label;
                    }
                  }
                }
              }
            }
          });
        } catch (error) {
          console.error('Error al crear la gráfica de ingresos semanales:', error);
        }
      },
      error: (error) => {
        console.error('Error al obtener ingresos semanales:', error);
        // Mostrar mensaje de error al usuario
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los datos de ingresos semanales',
          confirmButtonColor: '#198754'
        });
      }
    });
  }


  getRol(){
    this.permission.getRol().subscribe(
      (resp)=>{
        this.rol = resp;
      },
      (error)=>{
        console.log(error);
      }
    );
  }

  getGainsByMonth(month: string) {
    const url = `cashcut/cashcut-gains/${month}`;
    this.api.getData(url).subscribe(
      (resp: any) => {
        const data = resp.data;
        const ordenados = [...data].sort((a, b) => a.fecha.localeCompare(b.fecha));
        const labels = ordenados.map((item: any) => item.fecha);
        const ingresos = ordenados.map((item: any) => parseFloat(item.total_ingresos));

        const ctx = this.chartCanvas.nativeElement.getContext('2d');
        if (this.chart) this.chart.destroy();

        this.chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Ingresos diarios ($)',
              data: ingresos,
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 3
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Ingresos ($)'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Fecha'
                }
              }
            }
          }
        });
      },
      (error) => {
        console.error('Error al obtener ingresos mensuales', error);
      }
    );
  }

  onMonthChange(event: any) {
    this.selectedMonth = event.target.value;
    if (this.hasPermissions('see_admingraphic')) {
      this.getGainsByMonth(this.selectedMonth);
    }
  }



  getData() {
    if (this.rol === 'Doctor') {
      this.getDoctorData();
    } else {
      this.api.getData('cashcut/data-home').subscribe(
        (resp: any) => {
          this.data = resp.data[0];
    // Ejecutar CounterUp después de que los datos se hayan renderizado
          setTimeout(() => {
            const elements = document.querySelectorAll('.counter');
            elements.forEach(el => {
              CounterUp(el, {
                duration: 1000,
                delay: 16,
              });
            });
          }, 100); // pequeño delay para asegurar que el DOM ya tiene el valor interpolado
        },
        (error) => {
          console.log(error);
        }
      );
    }
  }


  getPercent() {
    this.api.getData('cashcut/cashcut-percent').subscribe(
      (resp: any) => {
        const data = resp.data;

        const labels = data.map((item: any) => item.sucursal);
        const porcentajes = data.map((item: any) => parseFloat(item.porcentaje));

        const ctx = this.pieCanvas.nativeElement.getContext('2d');

        this.pieChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              data: porcentajes,
              backgroundColor: [
                '#36a2eb', '#36A2EB', '#FFCE56', '#4BC0C0',
                '#9966FF', '#FF9F40', '#66BB6A', '#D4E157'
              ]
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom'
              },
              tooltip: {
                callbacks: {
                  label: (tooltipItem: any) => {
                    const label = tooltipItem.label || '';
                    const value = tooltipItem.raw || 0;
                    return `${label}: ${value.toFixed(2)}%`;
                  }
                }
              }
            }
          }
        });
      },
      (error) => {
        console.error(error);
      }
    );
  }

  hasPermissions(permission: string): boolean {
    return this.permissions && this.permissions.includes(permission);
  }

  canShow(option: string): boolean {
    return this.hasPermissions(option);
  }

  loadUserInfo() {
    this.permission.getId().subscribe(
      (id) => {
        this.idUser = id;
        this.checkAndLoadData();
      }
    );
    this.permission.getRol().subscribe(
      (rol) => {
        this.rol = rol;
        this.checkAndLoadData();
      }
    );
    this.permission.getName().subscribe(
      (name) => {
        this.userName = name;
        this.checkAndLoadData();
      }
    );
    this.permission.getLastname().subscribe(
      (lastname) => {
        this.userLastname = lastname;
        this.checkAndLoadData();
      }
    );
  }

  private dataLoaded = false;

  private checkAndLoadData() {
    // Solo cargar datos cuando tengamos toda la información necesaria y no se hayan cargado antes
    if (this.idUser && this.rol && this.userName && this.userLastname && !this.dataLoaded) {
      this.dataLoaded = true;
      this.getData();
    }
  }

  isDoctorRole(): boolean {
    return this.rol === 'Doctor';
  }

  isAdminRole(): boolean {
    return this.rol === 'Owner' || this.rol === 'Superadmin';
  }

  canSeeAdminGraphic(): boolean {
    return this.rol === 'Admin';
  }

  getDoctorData() {
    // Obtener pacientes del doctor
    this.api.getDataById('user/getmyusers', this.idUser).subscribe(
      (resp: any) => {
        const totalPatients = resp.data ? resp.data.length : 0;
        
        // Obtener órdenes del doctor
        const doctorFullName = this.userName + ' ' + this.userLastname;
        this.api.getDataById('order/getbydoctor', doctorFullName).subscribe(
          (ordersResp: any) => {
            const totalOrders = ordersResp.data ? ordersResp.data.length : 0;
            
            // Obtener citas del doctor (asumiendo que existe un endpoint similar)
            this.getDoctorAppointments(doctorFullName, totalPatients, totalOrders);
          },
          (error) => {
            console.log('Error obteniendo órdenes del doctor:', error);
            // Si falla, al menos mostrar pacientes y órdenes como 0
            this.setDoctorData(totalPatients, 0, 0);
          }
        );
      },
      (error) => {
        console.log('Error obteniendo pacientes del doctor:', error);
        this.setDoctorData(0, 0, 0);
      }
    );
  }

  getDoctorAppointments(doctorFullName: string, totalPatients: number, totalOrders: number) {
    // Por ahora, vamos a simular el número de citas o usar un endpoint si existe
    // En una implementación real, necesitarías un endpoint específico para citas del doctor
    this.api.getData('appointment/getall').subscribe(
      (resp: any) => {
        let totalAppointments = 0;
        if (resp.data) {
          // Filtrar citas por doctor
          totalAppointments = resp.data.filter((appointment: any) => 
            appointment.doctor === doctorFullName
          ).length;
        }
        this.setDoctorData(totalPatients, totalAppointments, totalOrders);
      },
      (error) => {
        console.log('Error obteniendo citas del doctor:', error);
        // Si no hay endpoint de citas, usar 0
        this.setDoctorData(totalPatients, 0, totalOrders);
      }
    );
  }

  setDoctorData(totalPatients: number, totalAppointments: number, totalOrders: number) {
    this.doctorData = {
      total_pacientes: totalPatients,
      total_citas: totalAppointments,
      total_ordenes: totalOrders
    };

    // Ejecutar CounterUp después de que los datos se hayan renderizado
    setTimeout(() => {
      const elements = document.querySelectorAll('.counter');
      elements.forEach(el => {
        CounterUp(el, {
          duration: 1000,
          delay: 16,
        });
      });
    }, 100);
  }

}

