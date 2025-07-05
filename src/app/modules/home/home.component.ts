import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CeraorService } from '../../services/ceraor.service';
import CounterUp from 'counterup2';
import { OnDestroy } from '@angular/core';

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
  topServices: any[] = [];
  gainsWeek: any;
  rol: String;


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
    this.getTopServices();
    this.getGainsWeek();
  }

  ngOnInit(): void {
    
    this.months = this.generateMonths(1); // Por ejemplo, últimos 12–18 meses
    this.getData();
    this.getGainsByMonth(this.selectedMonth);
    this.getPercent();
  }

  constructor(private api: CeraorService, private permission: PermissionsService) { }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
    if (this.pieChart) this.pieChart.destroy();
    if (this.barChart) this.barChart.destroy();
    if (this.weeklyChart) this.weeklyChart.destroy();
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
    this.api.getData('cashcut/gains-week').subscribe((resp: any) => {
      this.gainsWeek = resp.data; // Guardas la respuesta por si la necesitas en otro lugar

      const labels = this.gainsWeek.map((item: any) => item.fecha);
      const totals = this.gainsWeek.map((item: any) => parseFloat(item.total_dia));

      const ctx = this.weeklyCanvas.nativeElement.getContext('2d');

      if (this.weeklyChart) {
        this.weeklyChart.destroy();
      }

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
        console.error('Error al obtener ingresos semanales', error);
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
    this.getGainsByMonth(this.selectedMonth);
  }



  getData() {
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


}

