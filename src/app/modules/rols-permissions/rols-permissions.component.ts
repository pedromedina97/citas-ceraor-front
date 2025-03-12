import { AfterViewInit, ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CeraorService } from '../../services/ceraor.service';
import { PermissionsService } from '../../services/permissions.service';
@Component({
  selector: 'app-rols-permissions',
  standalone: false,
  templateUrl: './rols-permissions.component.html',
  styleUrl: './rols-permissions.component.scss'
})
export class RolsPermissionsComponent implements AfterViewInit {
  permissions: any;
  constructor(private api: CeraorService, private permissionsService: PermissionsService, private cd: ChangeDetectorRef, private router: Router, private zone: NgZone){}

  ngAfterViewInit(): void {
    this.loadPermissions();
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
