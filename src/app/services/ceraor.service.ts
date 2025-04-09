import { Injectable } from '@angular/core';
import { Environment } from '../Env/env';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class CeraorService {
  userToken: string;
  permissions: any;

  constructor(private http: HttpClient) { }

  saveUserDataInLocalStorage(userName: string) {
    localStorage.setItem('userName', userName);
    /* localStorage.setItem('userId', userId); */
  }

  getData(endpoint: string) {
    const url = `${Environment.url}${endpoint}`;
    console.log(url);
    return this.http.get(url);
  }

  getDataById(endpoint: string, id: any) {
    const url = Environment.url + `${endpoint}/` + id;
    console.log(url); 
    return this.http.get(url);
  }

  getDataByParam(endpoint: string, param: string, id: string) {
    const url = Environment.url + `${endpoint}/${param}/` + id;
    return this.http.get(url);
  }

  deleteData(endpoint: string, id: string) {
    const url = Environment.url + `${endpoint}/${id}`;
    console.log(url);
    return this.http.delete(url);
  }

  updateData(endpoint: string, id: string, data: object) {
    const url = Environment.url + `${endpoint}/${id}`;
    console.log(url);
    return this.http.put(url, data);
  }

  createData(endpoint: string, data: object) {
    const url = Environment.url + `${endpoint}`;
    console.log(url);
    return this.http.post(url, data);
  }

  patchData(endpoint: string, id: string, body: any){
    const url = Environment.url + `${endpoint}` +"/"+ `${id}`;
    return this.http.patch(url, body);
  }

  getRelatedData(related: string, id?: any, endpoint?: string) {
    let url = "";
    if (id) {
      url = `${Environment.url}${related}/${id}/${endpoint}`;
    }
    else {
      url = `${Environment.url}${related}/${endpoint}`;
    }
   /*  console.log(url); */
    return this.http.get(url);
  }

  getRelatedDataById(related: string, relatedId: string, endpoint?: string, id?: string) {
    const url = `${Environment.url}${related}/${relatedId}/${endpoint}/${id}`;
    /* console.log(url); */
    return this.http.get(url);
  }

  postRelatedData(related: string, id: string, endpoint?: string, data?: any) {
    const url = `${Environment.url}${related}/${id}/${endpoint}`;
    /* console.log(url); */
    return this.http.post(url, data);
  }

  deleteRelatedData(related: string, idRelated: string, endpoint?: string, id?: string) {
    const url = `${Environment.url}${related}/${idRelated}/${endpoint}/${id}`;
    return this.http.delete(url)
  }

  putRelatedData(related: string, idRelated: string, endpoint: string, id: string, data: any) {
    const url = `${Environment.url}${related}/${idRelated}/${endpoint}/${id}`;
    return this.http.put(url, data)
  }

  login(credentials: any) {
    return this.http.post(`${Environment.url}user/login`, credentials);
  }

  saveToken(idToken: string) {
    this.userToken = idToken;
    localStorage.setItem('token', idToken);
    let hoy = new Date();
    hoy.setTime(hoy.getTime() + 86400 * 1000);
    localStorage.setItem('expira', hoy.getTime().toString());
  }



  readToken() {
    if (localStorage.getItem('token')) {
      this.userToken = localStorage.getItem('token');
    } else {
      this.userToken = '';
    }

    return this.userToken;
  }



  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('expira');
    localStorage.removeItem('permissions');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
  }

  estadoAutenticado() {
    /*  if (this.userToken.length <= 2) {
       return false;
     } */
    console.log("entra");
    const expira = Number(localStorage.getItem('expira'));
    const expiraDate = new Date();
    expiraDate.setTime(expira);
    return expiraDate > new Date();
  }
}

