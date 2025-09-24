import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly DARK_MODE_KEY = 'darkMode';
  private darkMode = new BehaviorSubject<boolean>(false);
  darkMode$ = this.darkMode.asObservable();

  constructor() {
    // Recuperar preferencia guardada al iniciar
    const savedPreference = localStorage.getItem(this.DARK_MODE_KEY);
    if (savedPreference !== null) {
      this.darkMode.next(JSON.parse(savedPreference));
    }
  }

  toggleDarkMode(): void {
    const newValue = !this.darkMode.value;
    this.darkMode.next(newValue);
    localStorage.setItem(this.DARK_MODE_KEY, JSON.stringify(newValue));
    this.updateBodyClass(newValue);
  }

  private updateBodyClass(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}
