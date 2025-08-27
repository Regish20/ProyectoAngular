import { Component, OnInit } from '@angular/core';

export interface Venta {
  id_venta: number;
  id_cliente: number;
  fecha: string;
  estado: boolean;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
}

@Component({
  selector: 'app-venta',
  imports: [],
  standalone: true,
  templateUrl: './venta.html',
  styleUrl: './venta.css'
})
export class Venta implements OnInit {
  private editandoId: number | null = null;
  private readonly API_URL = 'http://localhost/PROYECTO/PROYECTO_FINAL/PROYECTO_FINAL/php/venta.php';
  
  ventas: Venta[] = [];

  ngOnInit(): void {
    this.cargarVentas();
  }

  async cargarVentas(): Promise<void> {
    try {
      const respuesta = await fetch(this.API_URL);
      this.ventas = await respuesta.json();
      this.actualizarTabla();
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      this.mostrarError('Error al cargar datos');
    }
  }

  private actualizarTabla(): void {
    const tbody = document.querySelector('table tbody') as HTMLElement;
    if (!tbody) return;

    console.log('=== ACTUALIZANDO TABLA ===');
    console.log('Ventas disponibles:', this.ventas);

    tbody.innerHTML = '';
    if (this.ventas.length > 0) {
      this.ventas.forEach(venta => {
        console.log('Procesando venta:', venta);
        tbody.innerHTML += `
          <tr>
            <td>${venta.id_venta}</td>
            <td>${venta.id_cliente}</td>
            <td>${venta.fecha}</td>
            <td><span class="badge ${venta.estado ? 'bg-success' : 'bg-danger'}">${venta.estado ? 'Activo' : 'Inactivo'}</span></td>
            <td>
              <button class="btn btn-warning btn-sm me-1" onclick="editarVentaGlobal(${venta.id_venta})">Editar</button>
              <button class="btn btn-danger btn-sm" onclick="eliminarVentaGlobal(${venta.id_venta})">Eliminar</button>
            </td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay ventas</td></tr>';
    }

    // Asignar las funciones globales con debugging
    (window as any).editarVentaGlobal = (id: number) => {
      console.log('=== FUNCIÓN GLOBAL EDITARVENTA LLAMADA ===');
      console.log('ID recibido en función global:', id, typeof id);
      this.editarVenta(id);
    };
    (window as any).eliminarVentaGlobal = (id: number) => this.eliminarVenta(id);
    
    console.log('Funciones globales asignadas');
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    // Obtener valores directamente de los inputs
    const id_cliente = (document.getElementById('id_cliente') as HTMLInputElement).value.trim();
    const fecha = (document.getElementById('fecha') as HTMLInputElement).value.trim();
    const estado = (document.getElementById('estado') as HTMLSelectElement).value;
    
    if (!id_cliente || !fecha || !estado) {
      alert('Todos los campos son obligatorios');
      return;
    }
    
    const datos = {
      id_cliente: parseInt(id_cliente),
      fecha,
      estado,
      ...(this.editandoId && { id_venta: this.editandoId })
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
        alert(this.editandoId ? 'Venta actualizada' : 'Venta registrada');
        await this.cargarVentas();
        this.limpiarFormulario();
      } else {
        alert('Error: ' + resultado.error);
      }
    } catch (error) {
      alert('Error de conexión');
      console.error('Error completo:', error);
    }
  }

  async editarVenta(id: number | string): Promise<void> {
    console.log('=== INICIANDO EDITAR VENTA ===');
    console.log('ID recibido:', id, 'tipo:', typeof id);
    
    // Convertir AMBOS a número para asegurar comparación correcta
    const ventaId = Number(id); // Usar Number() en lugar de parseInt()
    console.log('ID convertido:', ventaId, 'tipo:', typeof ventaId);
    
    const venta = this.ventas.find(v => {
      const ventaIdEnArray = Number(v.id_venta); // También convertir el del array
      console.log('Comparando:', ventaIdEnArray, '===', ventaId, '?', ventaIdEnArray === ventaId);
      return ventaIdEnArray === ventaId;
    });
    
    console.log('Venta encontrada:', venta);
    
    if (venta) {
      // Llenar los campos del formulario
      (document.getElementById('id_cliente') as HTMLInputElement).value = venta.id_cliente.toString();
      (document.getElementById('fecha') as HTMLInputElement).value = venta.fecha;
      (document.getElementById('estado') as HTMLSelectElement).value = venta.estado.toString();
      
      // Cambiar textos del formulario
      const submitBtn = document.querySelector('#formVenta button[type="submit"]') as HTMLElement;
      const cardHeaders = document.querySelectorAll('.card-header');
      const cancelBtn = document.getElementById('btnCancelar') as HTMLElement;
      
      if (submitBtn) submitBtn.textContent = 'Actualizar venta';
      if (cardHeaders && cardHeaders.length > 0) {
        (cardHeaders[0] as HTMLElement).textContent = 'Editar venta';
      }
      if (cancelBtn) cancelBtn.style.display = 'inline-block';
      
      this.editandoId = ventaId;
      
      console.log('Venta editada exitosamente:', venta.id_venta);
      alert('Modo edición activado para venta ID: ' + venta.id_venta); // Para confirmar que funcionó
    } else {
      console.log('ERROR: Venta no encontrada');
      alert('Venta no encontrada');
    }
    console.log('=== FIN EDITAR VENTA ===');
  }

  async eliminarVenta(id: number): Promise<void> {
    if (!confirm('¿Eliminar esta venta?')) return;

    try {
      const respuesta = await fetch(`${this.API_URL}?id_venta=${id}`, { method: 'DELETE' });
      const resultado: ApiResponse = await respuesta.json();
      
      if (resultado.success) {
        alert('Venta eliminada');
        await this.cargarVentas();
      } else {
        alert('Error: ' + resultado.error);
      }
    } catch (error) {
      alert('Error de conexión');
      console.error(error);
    }
  }

  limpiarFormulario(): void {
    (document.getElementById('formVenta') as HTMLFormElement).reset();
    (document.querySelector('#formVenta button[type="submit"]') as HTMLElement).textContent = 'Registrar venta';
    (document.querySelector('.card-header') as HTMLElement).textContent = 'Registrar nueva venta';
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