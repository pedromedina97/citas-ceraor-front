import { Injectable, NgZone } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private permissionsSubject = new BehaviorSubject<string>(localStorage.getItem('permissions') || '');
  private rolSubject = new BehaviorSubject<string>(localStorage.getItem('rol') || '');
  private idSubject = new BehaviorSubject<string>(localStorage.getItem('userId') || '');
  private nameSubject = new BehaviorSubject<string>(localStorage.getItem('name') || '');
  private lastnameSubject = new BehaviorSubject<string>(localStorage.getItem('lastname') || '');
  private data: any;

  constructor(private zone: NgZone) {}

  setPermissions(permissions: any) {
    this.data = this.getDecodedAccessToken(permissions);
    localStorage.setItem('userId', this.data.id);
    localStorage.setItem('rol', this.data.permissions.role_name);
    localStorage.setItem('name', this.data.name);
    localStorage.setItem('lastname', this.data.lastname);
    const permissionsArray = this.data.permissions.permissions.split(',').map((perm: string) => perm.trim());
    localStorage.setItem('permissions', permissionsArray);
    this.permissionsSubject.next(permissionsArray);
    this.rolSubject.next(this.data.permissions.role_name);
    this.idSubject.next(this.data.id);
    this.nameSubject.next(this.data.name);
    this.lastnameSubject.next(this.data.lastname);
  }

  getPermissions() {
    return this.permissionsSubject.asObservable();
  }

  getRol(){
    return this.rolSubject.asObservable();
  }
  
  getId(){
    return this.idSubject.asObservable();
  }

  getName(){
    return this.nameSubject.asObservable();
  }

  getLastname(){
    return this.lastnameSubject.asObservable();
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
