import { Routes } from '@angular/router';
import { TimeInputComponent } from './Components/timeinput/timeinput.component'
import { AuthComponent } from './auth/auth.component';


export const routes: Routes = [
    { path: '', component: AuthComponent},
    { path: 'dashboard', component: TimeInputComponent},
    { path: '**', redirectTo: '' }
];
