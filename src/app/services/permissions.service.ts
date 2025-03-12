import { Injectable, NgZone } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private permissionsSubject = new BehaviorSubject<string>(localStorage.getItem('permissions') || '');

  private data: any;

  constructor(private zone: NgZone) {}

  setPermissions(permissions: any) {
    this.data = this.getDecodedAccessToken(permissions);
    console.log(this.data);
    localStorage.setItem('userId', this.data.id);
    const permissionsArray = this.data.permissions.permissions.split(',').map((perm: string) => perm.trim());
    localStorage.setItem('permissions', permissionsArray);
    this.permissionsSubject.next(permissionsArray);
  }

  getPermissions() {
    return this.permissionsSubject.asObservable();
  }

  getPermissionsValue(): string[] {
    const permissions = localStorage.getItem('permissions'); // Obtener permisos desde localStorage
  return permissions ? permissions.split(',') : [];
  }
  
  

  private getDecodedAccessToken(token: string) {
    try {
      return jwtDecode(token);
    } catch (Error) {
      return null;
    }
  }
}
