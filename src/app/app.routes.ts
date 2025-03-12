import { Route, Routes } from "@angular/router";
import { AgendaComponent } from "./modules/agenda/agenda.component";
import { HomeComponent } from "./modules/home/home.component";
import { LoginComponent } from "./modules/login/login.component";
import { ServicesComponent } from "./modules/services/services.component";
import { UsersComponent } from "./modules/users/users.component";
import { SubsidiariesComponent } from "./modules/subsidiaries/subsidiaries.component";
import { authGuard } from "./guards/auth.guard";
import { LoadserviceComponent } from "./modules/subsidiaries/loadservice/loadservice.component";
import { RolsPermissionsComponent } from "./modules/rols-permissions/rols-permissions.component";
import { PermissionsComponent } from "./modules/rols-permissions/permissions/permissions.component";
import { RolsComponent } from "./modules/rols-permissions/rols/rols.component";
import { SetPermissionsComponent } from "./modules/rols-permissions/set-permissions/set-permissions.component";
import { OrdersComponent } from "./modules/orders/orders.component";
import { UnauthorizedAccessComponent } from "./modules/unauthorized-access/unauthorized-access.component";

export const ROUTES: Routes = [
    { path: 'agenda', component: AgendaComponent, canActivate: [authGuard]},
    { path: 'services', component: ServicesComponent, canActivate: [authGuard], data: {permissions: 'get_service'} },
    { path: 'subsidiaries', component: SubsidiariesComponent, canActivate: [authGuard], data: {permissions: 'get_subsidiary'}},
    { path: 'subsidiaries/:id', component: LoadserviceComponent, canActivate: [authGuard], data: {permissions: 'getall_subsidiary'} },
    { path: 'users', component: UsersComponent, canActivate: [authGuard], data: {permissions: 'get_user'}},
    { path: 'rolspermissions', component: RolsPermissionsComponent, canActivate: [authGuard], data: {permissions: 'getall_rolpermission'}},
    { path: 'rolspermissions/permissions',component: PermissionsComponent, canActivate: [authGuard], data: {permissions: 'getall_rolpermission'} },
    { path: 'rolspermissions/rols', component: RolsComponent, canActivate: [authGuard], data: {permissions: 'getall_rolpermission'}},
    { path: 'rolspermissions/rols/setpermissions/:id', component: SetPermissionsComponent, canActivate: [authGuard], data: {permissions: 'getall_rolpermission'}},
    { path: 'orders', component: OrdersComponent, canActivate: [authGuard], data: {permissions: 'get_order'}},
    { path: 'login', component: LoginComponent },
    { path: 'home', component: HomeComponent, canActivate: [authGuard]},
    { path: 'unauthorized-access', component: UnauthorizedAccessComponent },
    { path: '**', pathMatch: 'full', redirectTo: 'login'}
];