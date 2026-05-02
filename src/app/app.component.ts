import { Component, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  isLoginPage: boolean = false;
  sidebarOpen: boolean = false;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isLoginPage = event.urlAfterRedirects === '/login' || event.urlAfterRedirects === '/public-order';
      }

    });
  }

  @HostListener('window:resize', [])
  onResize(): void {
    if (window.innerWidth > 1024 && this.sidebarOpen) {
      this.sidebarOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInsideSidebar = (event.target as HTMLElement).closest('.sidebar');
    const clickedToggleButton = (event.target as HTMLElement).closest('.toggle-btn');

    if (!clickedInsideSidebar && !clickedToggleButton && window.innerWidth <= 1024) {
      this.sidebarOpen = false;
    }
  }


  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {

      }
    });
  }
}
