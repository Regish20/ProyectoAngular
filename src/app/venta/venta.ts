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

    tbody.innerHTML = '';
    if (this.ventas.length > 0) {
      this.ventas.forEach(venta => {
        const fechaFormateada = this.formatearFechaParaMostrar(venta.fecha);
        tbody.innerHTML += `
          <tr>
            <td>${venta.id_venta}</td>
            <td>${venta.id_cliente}</td>
            <td>${fechaFormateada}</td>
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

    (window as any).editarVentaGlobal = (id: number) => this.editarVenta(id);
    (window as any).eliminarVentaGlobal = (id: number) => this.eliminarVenta(id);
  }

  private formatearFechaParaMostrar(fecha: string): string {
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return fecha;
    }
  }

  private formatearFechaParaEnvio(fechaDatetimeLocal: string): string {
    if (!fechaDatetimeLocal) return '';
    
    let fechaFormateada = fechaDatetimeLocal;
    if (!fechaFormateada.includes(':00')) {
      fechaFormateada += ':00';
    }
    
    return fechaFormateada.replace('T', ' ');
  }

  private formatearFechaParaInput(fechaMySQL: string): string {
    if (!fechaMySQL) return '';
    
    try {
      const fechaSinMilisegundos = fechaMySQL.split('.')[0];
      const partes = fechaSinMilisegundos.split(' ');
      if (partes.length === 2) {
        const fecha = partes[0];
        const horaPartes = partes[1].split(':');
        const horaMinutos = `${horaPartes[0]}:${horaPartes[1]}`;
        return `${fecha}T${horaMinutos}`;
      }
      
      return fechaSinMilisegundos.replace(' ', 'T');
    } catch (error) {
      return '';
    }
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const id_cliente = (document.getElementById('id_cliente') as HTMLInputElement).value.trim();
    const fechaDatetimeLocal = (document.getElementById('fecha') as HTMLInputElement).value.trim();
    const estado = (document.getElementById('estado') as HTMLSelectElement).value;
    
    if (!id_cliente || !fechaDatetimeLocal || !estado) {
      alert('Todos los campos son obligatorios');
      return;
    }
    
    const fechaParaEnvio = this.formatearFechaParaEnvio(fechaDatetimeLocal);
    
    const datos = {
      id_cliente: parseInt(id_cliente),
      fecha: fechaParaEnvio,
      estado,
      ...(this.editandoId && { id_venta: this.editandoId })
    };

    const metodo = this.editandoId ? 'PUT' : 'POST';

    try {
      const respuesta = await fetch(this.API_URL, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      const resultado: ApiResponse = await respuesta.json();
      
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
    const ventaId = Number(id);
    const venta = this.ventas.find(v => Number(v.id_venta) === ventaId);
    
    if (venta) {
      (document.getElementById('id_cliente') as HTMLInputElement).value = venta.id_cliente.toString();
      (document.getElementById('fecha') as HTMLInputElement).value = this.formatearFechaParaInput(venta.fecha);
      (document.getElementById('estado') as HTMLSelectElement).value = venta.estado.toString();
      
      const submitBtn = document.querySelector('#formVenta button[type="submit"]') as HTMLElement;
      const cardHeader = document.querySelector('.card-header') as HTMLElement;
      const cancelBtn = document.getElementById('btnCancelar') as HTMLElement;
      
      if (submitBtn) submitBtn.textContent = 'Actualizar venta';
      if (cardHeader) cardHeader.textContent = 'Editar venta';
      if (cancelBtn) cancelBtn.style.display = 'inline-block';
      
      this.editandoId = ventaId;
    } else {
      alert('Venta no encontrada');
    }
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