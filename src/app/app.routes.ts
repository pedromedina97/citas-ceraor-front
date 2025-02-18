import { Route, Routes } from "@angular/router";
import { AgendaComponent } from "./modules/agenda/agenda.component";
import { HomeComponent } from "./modules/home/home.component";
import { LoginComponent } from "./modules/login/login.component";
import { ServicesComponent } from "./modules/services/services.component";
import { UsersComponent } from "./modules/users/users.component";
import { SubsidiariesComponent } from "./modules/subsidiaries/subsidiaries.component";
import { authGuard } from "./guards/auth.guard";
import { LoadserviceComponent } from "./modules/subsidiaries/loadservice/loadservice.component";
export const ROUTES: Routes = [
    { path: 'agenda', component: AgendaComponent, canActivate: [authGuard], data: {permissions: 'get_agenda'} },
    { path: 'services', component: ServicesComponent, canActivate: [authGuard], data: {permissions: 'get_service'} },
    { path: 'subsidiaries', component: SubsidiariesComponent, canActivate: [authGuard], data: {permissions: 'get_subsidiary'}},
    { path: 'subsidiaries/:id', component: LoadserviceComponent, canActivate: [authGuard], data: {permissions: 'getall_subsidiary'} },
    { path: 'users', component: UsersComponent, canActivate: [authGuard], data: {permissions: 'get_user'}},
    { path: 'login', component: LoginComponent },
    { path: 'home', component: HomeComponent, canActivate: [authGuard]},
    { path: '**', pathMatch: 'full', redirectTo: 'login'}
];