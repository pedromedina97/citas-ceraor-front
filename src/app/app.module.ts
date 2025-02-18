import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { NavComponent } from './components/shared/nav/nav.component';
import { UsersComponent } from './modules/users/users.component';
import { SubsidiariesComponent } from './modules/subsidiaries/subsidiaries.component';
import { HomeComponent } from './modules/home/home.component';
import { AgendaComponent } from './modules/agenda/agenda.component';
import { ServicesComponent } from './modules/services/services.component';
import { ROUTES } from './app.routes';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './modules/login/login.component';
import { LoadserviceComponent } from './modules/subsidiaries/loadservice/loadservice.component';
import { UnauthorizedAccessComponent } from './modules/unauthorized-access/unauthorized-access.component';


@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    UsersComponent,
    LoginComponent,
    SubsidiariesComponent,
    AgendaComponent,
    ServicesComponent,
    HomeComponent,
    LoginComponent,
    LoadserviceComponent,
    UnauthorizedAccessComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(ROUTES, {useHash: true})
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: AuthService, multi: true},
    provideClientHydration()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
