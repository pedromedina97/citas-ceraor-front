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
import { noAuthGuard } from "./guards/no-auth.guard";
import { CreateOrderComponent } from "./modules/orders/create-order/create-order.component";
import { CashcutsComponent } from "./modules/cashcuts/cashcuts.component";
import { PaymentsComponent } from "./modules/payments/payments.component";
import { PublicOrderComponent } from "./modules/public/public-order/public-order.component";

export const ROUTES: Routes = [
  { 
    path: 'agenda', 
    component: AgendaComponent, 
    canActivate: [authGuard], 
    data: { breadcrumb: 'Agenda' } 
  },
  { 
    path: 'services', 
    component: ServicesComponent, 
    canActivate: [authGuard], 
    data: { permissions: 'see_service', breadcrumb: 'Servicios' } 
  },
  { 
    path: 'subsidiaries', 
    component: SubsidiariesComponent, 
    canActivate: [authGuard], 
    data: { permissions: 'see_subsidiary', breadcrumb: 'Sucursales' } 
  },
  { 
    path: 'subsidiaries/:id', 
    component: LoadserviceComponent, 
    canActivate: [authGuard], 
    data: { permissions: 'see_subsidiary', breadcrumb: 'Detalle de sucursal' } 
  },
  { 
    path: 'users', 
    component: UsersComponent, 
    canActivate: [authGuard], 
    data: { permissions: 'see_user', breadcrumb: 'Usuarios' } 
  },
  { 
    path: 'rolspermissions', 
    component: RolsPermissionsComponent, 
    canActivate: [authGuard], 
    data: { permissions: 'see_rolpermission', breadcrumb: 'Roles y permisos' } 
  },
  { 
    path: 'rolspermissions/permissions', 
    component: PermissionsComponent, 
    canActivate: [authGuard], 
    data: { permissions: 'see_permission', breadcrumb: 'Permisos' } 
  },
  { 
    path: 'rolspermissions/rols', 
    component: RolsComponent, 
    canActivate: [authGuard], 
    data: { permissions: 'see_rolpermission', breadcrumb: 'Roles' } 
  },
  { 
    path: 'rolspermissions/rols/setpermissions/:id', 
    component: SetPermissionsComponent, 
    canActivate: [authGuard], 
    data: { permissions: 'see_rol', breadcrumb: 'Asignar permisos' } 
  },
  { 
    path: 'orders', 
    component: OrdersComponent, 
    canActivate: [authGuard], 
    data: { permissions: 'see_order', breadcrumb: 'Órdenes' } 
  },
  { 
    path: 'payments', 
    component: PaymentsComponent, 
    canActivate: [authGuard], 
    data: { permissions: 'see_payment', breadcrumb: 'Pagos' } 
  },
  { 
    path: 'cashcuts', 
    component: CashcutsComponent, 
    canActivate: [authGuard], 
    data: { permissions: 'see_cashcut', breadcrumb: 'Corte de Caja' } 
  },
  { 
    path: 'orders/create-order', 
    component: CreateOrderComponent, 
    canActivate: [authGuard], 
    data: { permissions: 'create_order', breadcrumb: 'Crear orden' } 
  },
  { 
    path: 'login', 
    component: LoginComponent, 
    canActivate: [noAuthGuard], 
    data: { breadcrumb: 'Login' } 
  },
  { 
    path: 'home', 
    component: HomeComponent, 
    canActivate: [authGuard], 
    data: { breadcrumb: 'Inicio' } 
  },
  { 
    path: 'unauthorized-access', 
    component: UnauthorizedAccessComponent, 
    data: { breadcrumb: 'Acceso no autorizado' } 
  },
  {
    path: 'public-order',
    component: PublicOrderComponent,
    data: { breadcrumb: 'Orden Pública' }
  },
  { 
    path: '**', 
    pathMatch: 'full', 
    redirectTo: 'login' 
  }
];

/* import { Route, Routes } from "@angular/router";
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
import { noAuthGuard } from "./guards/no-auth.guard";
import { CreateOrderComponent } from "./modules/orders/create-order/create-order.component";

export const ROUTES: Routes = [
    { path: 'agenda', component: AgendaComponent, canActivate: [authGuard]},
    { path: 'services', component: ServicesComponent, canActivate: [authGuard], data: {permissions: 'see_service'} },
    { path: 'subsidiaries', component: SubsidiariesComponent, canActivate: [authGuard], data: {permissions: 'see_subsidiary'}},
    { path: 'subsidiaries/:id', component: LoadserviceComponent, canActivate: [authGuard], data: {permissions: 'see_subsidiary'} },
    { path: 'users', component: UsersComponent, canActivate: [authGuard], data: {permissions: 'see_user'}},
    { path: 'rolspermissions', component: RolsPermissionsComponent, canActivate: [authGuard], data: {permissions: 'see_rolpermission'}},
    { path: 'rolspermissions/permissions',component: PermissionsComponent, canActivate: [authGuard], data: {permissions: 'see_permission'} },
    { path: 'rolspermissions/rols', component: RolsComponent, canActivate: [authGuard], data: {permissions: 'see_rolpermission'}},
    { path: 'rolspermissions/rols/setpermissions/:id', component: SetPermissionsComponent, canActivate: [authGuard], data: {permissions: 'see_rol'}},
    { path: 'orders', component: OrdersComponent, canActivate: [authGuard], data: {permissions: 'see_order'}},
    { path: 'orders/create-order', component: CreateOrderComponent, canActivate: [authGuard], data: {permissions: 'create_order'}},
    { path: 'login', component: LoginComponent, canActivate: [noAuthGuard] },
    { path: 'home', component: HomeComponent, canActivate: [authGuard]},
    { path: 'unauthorized-access', component: UnauthorizedAccessComponent },
    { path: '**', pathMatch: 'full', redirectTo: 'login'}
]; */