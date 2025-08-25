import { Routes } from '@angular/router';
import { Inicio } from './inicio/inicio';
import { Venta } from './venta/venta';
import { Productos } from './productos/productos';
import { Usuarios } from './usuarios/usuarios';

export const routes: Routes = [
  { path: '', redirectTo: '/inicio', pathMatch: 'full' },
  { path: 'inicio', component: Inicio },
  { path: 'venta', component: Venta },
  { path: 'productos', component: Productos },
  { path: 'usuarios', component: Usuarios }
];
