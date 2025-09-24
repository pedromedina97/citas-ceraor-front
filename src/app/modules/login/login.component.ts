import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { CeraorService } from '../../services/ceraor.service';
import { PermissionsService } from '../../services/permissions.service';
import { ThemeService } from '../../services/theme.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  isDarkMode$: any;
  credentials = {
    email : '',
    password: ''
  };
  showPassword: boolean = false;

  constructor(
    private router: Router,
    private api: CeraorService,
    private permissionsService: PermissionsService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Inicializar el observable de modo oscuro
    this.isDarkMode$ = this.themeService.darkMode$;
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  login(form: NgForm){
    Swal.fire({
      title: 'Loading',
      icon: 'info',
      allowOutsideClick: false
    });

    Swal.showLoading();
    
    this.api.login(this.credentials).subscribe(
      (resp: any)=>{
        Swal.close();
        Swal.fire({
          title: '¡Bienvenido!',
          confirmButtonColor: "#002b24",
          icon: 'success'
        });
        this.api.saveToken(resp.token);
        this.permissionsService.setPermissions(resp.token);
        this.api.saveUserDataInLocalStorage(this.credentials.email);
        this.router.navigateByUrl('/home');
      /*  window.location.reload(); */
      },
      (error) => {
        Swal.close();
        Swal.fire({
          title: '¡Error!',
          text: error.error.msg,
          confirmButtonColor: "#002b24",
          icon: 'error'
        });
        console.log(error.error);
      }
    );
  }

}
