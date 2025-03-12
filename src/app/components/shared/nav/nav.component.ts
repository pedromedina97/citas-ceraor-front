import { AfterViewInit, ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CeraorService } from '../../../services/ceraor.service';
import { PermissionsService } from '../../../services/permissions.service';

@Component({
  selector: 'app-nav',
  standalone: false,
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent implements AfterViewInit{

  permissions: any;
  user: string;

  constructor(private api: CeraorService, private permissionsService: PermissionsService, private cd: ChangeDetectorRef, private router: Router, private zone: NgZone){}
  
  ngAfterViewInit(): void {
    this.loadPermissions();
    let username = localStorage.getItem('userName');
    this.user = username
  }

  logout(){
    Swal.fire({
      title: "Cerrar Sesión",
      icon: 'info',
      text: `¿Desea salir?`,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#d33',
      showConfirmButton: true,
      showCancelButton: true
    }).then((resp)=>{
      if(resp.isConfirmed){
        Swal.fire({
          title: 'Hasta Pronto',
          icon: 'success',
          confirmButtonColor: '#198754'
        });
        this.api.logout();
        this.router.navigateByUrl('/login');
      }
    });
    
  }

  loadPermissions(){
    this.permissionsService.getPermissions().subscribe(
      value=>{
        this.zone.run(
          ()=>{
            this.permissions = value;
            this.cd.detectChanges();
          }
        );
      }
    );
  }

  updatePermissions(token: string){
    this.permissionsService.setPermissions(token);
  }

  hasPermissions(permission: string): boolean {
    return this.permissions && this.permissions.includes(permission);
  }

  canShow(option: string): boolean{
    return this.hasPermissions(option);
  }

}

