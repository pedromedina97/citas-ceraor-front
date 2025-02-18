import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements HttpInterceptor{
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtén el token del localStorage o donde lo tengas guardado
    const token = localStorage.getItem('token'); 

    if (token) {
      // Clona la solicitud y agrega el header de Authentication
      const authReq = req.clone({
        setHeaders: {
          Authorization: `${token}` // Agrega el token al header
        }
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}
