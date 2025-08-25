import { Component, OnInit } from '@angular/core';

interface Cliente {
  id_cliente: number;
  nombre: string;
  correo: string;
  telefono: string;
}

interface ApiResponse {
  success: boolean;
  error?: string;
}

@Component({
  selector: 'app-usuarios',
  imports: [],
  standalone: true,
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css']
})
export class Usuarios implements OnInit {
  private editandoId: number | null = null;
  private readonly API_URL = 'http://localhost/PROYECTO/PROYECTO_FINAL/PROYECTO_FINAL/php/clientes.php';
  
  clientes: Cliente[] = [];

  ngOnInit(): void {
    this.cargarClientes();
  }

  async cargarClientes(): Promise<void> {
    try {
      const respuesta = await fetch(this.API_URL);
      this.clientes = await respuesta.json();
      this.actualizarTabla();
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      this.mostrarError('Error al cargar datos');
    }
  }

  private actualizarTabla(): void {
    const tbody = document.querySelector('table tbody') as HTMLElement;
    if (!tbody) return;

    tbody.innerHTML = '';
    if (this.clientes.length > 0) {
      this.clientes.forEach(cliente => {
        tbody.innerHTML += `
          <tr>
            <td>${cliente.id_cliente}</td>
            <td>${cliente.nombre}</td>
            <td>${cliente.correo}</td>
            <td>${cliente.telefono}</td>
            <td>
              <button class="btn btn-warning btn-sm me-1" onclick="editarClienteGlobal(${cliente.id_cliente})">Editar</button>
              <button class="btn btn-danger btn-sm" onclick="eliminarClienteGlobal(${cliente.id_cliente})">Eliminar</button>
            </td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay clientes</td></tr>';
    }

    // Asignar las funciones globales
    (window as any).editarClienteGlobal = (id: number) => this.editarCliente(id);
    (window as any).eliminarClienteGlobal = (id: number) => this.eliminarCliente(id);
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    // Obtener valores directamente de los inputs
    const nombre = (document.getElementById('nombre') as HTMLInputElement).value.trim();
    const correo = (document.getElementById('correo') as HTMLInputElement).value.trim();
    const telefono = (document.getElementById('telefono') as HTMLInputElement).value.trim();
    
    if (!nombre || !correo || !telefono) {
      alert('Todos los campos son obligatorios');
      return;
    }
    
    const datos = {
      nombre,
      correo,
      telefono,
      ...(this.editandoId && { id_cliente: this.editandoId })
    };

    const metodo = this.editandoId ? 'PUT' : 'POST';

    try {
      console.log('Enviando datos:', datos); // Para debugging
      
      const respuesta = await fetch(this.API_URL, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      const resultado: ApiResponse = await respuesta.json();
      console.log('Resultado:', resultado); // Para debugging
      
      if (resultado.success) {
        alert(this.editandoId ? 'Cliente actualizado' : 'Cliente registrado');
        await this.cargarClientes();
        this.limpiarFormulario();
      } else {
        alert('Error: ' + resultado.error);
      }
    } catch (error) {
      alert('Error de conexión');
      console.error('Error completo:', error);
    }
  }

  async editarCliente(id: number): Promise<void> {
    const cliente = this.clientes.find(c => c.id_cliente === id);
    
    if (cliente) {
      (document.getElementById('nombre') as HTMLInputElement).value = cliente.nombre;
      (document.getElementById('correo') as HTMLInputElement).value = cliente.correo;
      (document.getElementById('telefono') as HTMLInputElement).value = cliente.telefono;
      
      (document.querySelector('#formUsuario button[type="submit"]') as HTMLElement).textContent = 'Actualizar usuario';
      (document.querySelector('.card-header') as HTMLElement).textContent = 'Editar usuario';
      (document.getElementById('btnCancelar') as HTMLElement).style.display = 'inline-block';
      
      this.editandoId = id;
    }
  }

  async eliminarCliente(id: number): Promise<void> {
    if (!confirm('¿Eliminar este cliente?')) return;

    try {
      const respuesta = await fetch(`${this.API_URL}?id_cliente=${id}`, { method: 'DELETE' });
      const resultado: ApiResponse = await respuesta.json();
      
      if (resultado.success) {
        alert('Cliente eliminado');
        await this.cargarClientes();
      } else {
        alert('Error: ' + resultado.error);
      }
    } catch (error) {
      alert('Error de conexión');
      console.error(error);
    }
  }

  limpiarFormulario(): void {
    (document.getElementById('formUsuario') as HTMLFormElement).reset();
    (document.querySelector('#formUsuario button[type="submit"]') as HTMLElement).textContent = 'Registrar usuario';
    (document.querySelector('.card-header') as HTMLElement).textContent = 'Registrar nuevo usuario';
    (document.getElementById('btnCancelar') as HTMLElement).style.display = 'none';
    this.editandoId = null;
  }

  private mostrarError(mensaje: string): void {
    const tbody = document.querySelector('table tbody') as HTMLElement;
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${mensaje}</td></tr>`;
    }
  }
}