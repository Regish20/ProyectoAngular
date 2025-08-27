import { Component, OnInit } from '@angular/core';

interface Producto {
  id_producto: number;
  nombre: string;
  precio: number;
  stock: number;
  id_marca: number;
  descripcion?: string;
  estado: boolean;
  nombre_marca?: string; // Para mostrar el nombre de la marca en la tabla
}

interface Marca {
  id_marca: number;
  nombre_marca: string;
  estado: boolean;
}

interface ApiResponse {
  success: boolean;
  error?: string;
}

@Component({
  selector: 'app-productos',
  imports: [],
  standalone: true,
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class Productos implements OnInit {
  private editandoIdProducto: number | null = null;
  private editandoIdMarca: number | null = null;
  private readonly API_URL_PRODUCTOS = 'http://localhost/PROYECTO/PROYECTO_FINAL/PROYECTO_FINAL/php/productos.php';
  private readonly API_URL_MARCAS = 'http://localhost/PROYECTO/PROYECTO_FINAL/PROYECTO_FINAL/php/marcas.php';
  
  productos: Producto[] = [];
  marcas: Marca[] = [];

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarMarcas();
  }

  async cargarProductos(): Promise<void> {
    try {
      const respuesta = await fetch(this.API_URL_PRODUCTOS);
      this.productos = await respuesta.json();
      this.actualizarTablaProductos();
    } catch (error) {
      console.error('Error al cargar productos:', error);
      this.mostrarErrorProductos('Error al cargar datos');
    }
  }

  private actualizarTablaProductos(): void {
    const tbody = document.querySelector('#tablaProductos tbody') as HTMLElement;
    if (!tbody) return;

    console.log('=== ACTUALIZANDO TABLA PRODUCTOS ===');
    console.log('Productos disponibles:', this.productos);

    tbody.innerHTML = '';
    if (this.productos.length > 0) {
      this.productos.forEach(producto => {
        console.log('Procesando producto:', producto);
        tbody.innerHTML += `
          <tr>
            <td>${producto.id_producto}</td>
            <td>${producto.nombre}</td>
            <td>$${parseFloat(producto.precio.toString()).toFixed(2)}</td>
            <td>${producto.stock}</td>
            <td>${producto.nombre_marca || 'Sin marca'}</td>
            <td><span class="badge ${producto.estado ? 'bg-success' : 'bg-danger'}">${producto.estado ? 'Activo' : 'Inactivo'}</span></td>
            <td>${producto.descripcion || 'Sin descripción'}</td>
            <td>
              <button class="btn btn-warning btn-sm me-1" onclick="editarProductoGlobal(${producto.id_producto})">Editar</button>
              <button class="btn btn-danger btn-sm" onclick="eliminarProductoGlobal(${producto.id_producto})">Eliminar</button>
            </td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay productos</td></tr>';
    }

    (window as any).editarProductoGlobal = (id: number) => {
      console.log('=== FUNCIÓN GLOBAL EDITARPRODUCTO LLAMADA ===');
      console.log('ID recibido en función global:', id, typeof id);
      this.editarProducto(id);
    };
    (window as any).eliminarProductoGlobal = (id: number) => this.eliminarProducto(id);
    
    console.log('Funciones globales de productos asignadas');
  }

  async onSubmitProducto(event: Event): Promise<void> {
    event.preventDefault();
    
    const nombre = (document.getElementById('nombre') as HTMLInputElement).value.trim();
    const precio = parseFloat((document.getElementById('precio') as HTMLInputElement).value);
    const stock = parseInt((document.getElementById('stock') as HTMLInputElement).value);
    const id_marca = parseInt((document.getElementById('id_marca') as HTMLSelectElement).value);
    const estado = (document.getElementById('estado') as HTMLSelectElement).value;
    const descripcion = (document.getElementById('descripcion') as HTMLTextAreaElement).value.trim();
    
    if (!nombre || isNaN(precio) || isNaN(stock) || !id_marca || !estado) {
      alert('Todos los campos son obligatorios');
      return;
    }
    
    const datos = {
      nombre,
      precio,
      stock,
      id_marca,
      estado,
      descripcion,
      ...(this.editandoIdProducto && { id_producto: this.editandoIdProducto })
    };

    const metodo = this.editandoIdProducto ? 'PUT' : 'POST';

    try {
      console.log('Enviando datos de producto:', datos);
      
      const respuesta = await fetch(this.API_URL_PRODUCTOS, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      const resultado: ApiResponse = await respuesta.json();
      console.log('Resultado:', resultado);
      
      if (resultado.success) {
        alert(this.editandoIdProducto ? 'Producto actualizado' : 'Producto registrado');
        await this.cargarProductos();
        this.limpiarFormularioProducto();
      } else {
        alert('Error: ' + resultado.error);
      }
    } catch (error) {
      alert('Error de conexión');
      console.error('Error completo:', error);
    }
  }

  async editarProducto(id: number | string): Promise<void> {
    console.log('=== INICIANDO EDITAR PRODUCTO ===');
    console.log('ID recibido:', id, 'tipo:', typeof id);
    
    const productoId = Number(id);
    console.log('ID convertido:', productoId, 'tipo:', typeof productoId);
    
    const producto = this.productos.find(p => Number(p.id_producto) === productoId);
    console.log('Producto encontrado:', producto);
    
    if (producto) {
      // Llenar los campos del formulario
      (document.getElementById('nombre') as HTMLInputElement).value = producto.nombre;
      (document.getElementById('precio') as HTMLInputElement).value = producto.precio.toString();
      (document.getElementById('stock') as HTMLInputElement).value = producto.stock.toString();
      (document.getElementById('id_marca') as HTMLSelectElement).value = producto.id_marca.toString();
      (document.getElementById('estado') as HTMLSelectElement).value = producto.estado.toString();
      (document.getElementById('descripcion') as HTMLTextAreaElement).value = producto.descripcion || '';
      
      // Cambiar textos del formulario
      const submitBtn = document.querySelector('#formProducto button[type="submit"]') as HTMLElement;
      const cardHeaders = document.querySelectorAll('.card-header');
      const cancelBtn = document.getElementById('btnCancelarProducto') as HTMLElement;
      
      if (submitBtn) submitBtn.textContent = 'Actualizar producto';
      if (cardHeaders && cardHeaders.length > 0) {
        (cardHeaders[0] as HTMLElement).textContent = 'Editar producto';
      }
      if (cancelBtn) cancelBtn.style.display = 'inline-block';
      
      this.editandoIdProducto = productoId;
      
      console.log('Producto editado exitosamente:', producto.nombre);
      alert('Modo edición activado para: ' + producto.nombre);
    } else {
      console.log('ERROR: Producto no encontrado');
      alert('Producto no encontrado');
    }
    console.log('=== FIN EDITAR PRODUCTO ===');
  }

  async eliminarProducto(id: number): Promise<void> {
    if (!confirm('¿Eliminar este producto?')) return;

    try {
      const respuesta = await fetch(`${this.API_URL_PRODUCTOS}?id_producto=${id}`, { method: 'DELETE' });
      const resultado: ApiResponse = await respuesta.json();
      
      if (resultado.success) {
        alert('Producto eliminado');
        await this.cargarProductos();
      } else {
        alert('Error: ' + resultado.error);
      }
    } catch (error) {
      alert('Error de conexión');
      console.error(error);
    }
  }

  limpiarFormularioProducto(): void {
    (document.getElementById('formProducto') as HTMLFormElement).reset();
    (document.querySelector('#formProducto button[type="submit"]') as HTMLElement).textContent = 'Registrar producto';
    const cardHeaders = document.querySelectorAll('.card-header');
    if (cardHeaders && cardHeaders.length > 0) {
      (cardHeaders[0] as HTMLElement).textContent = 'Registrar nuevo producto';
    }
    (document.getElementById('btnCancelarProducto') as HTMLElement).style.display = 'none';
    this.editandoIdProducto = null;
  }

  private mostrarErrorProductos(mensaje: string): void {
    const tbody = document.querySelector('#tablaProductos tbody') as HTMLElement;
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">${mensaje}</td></tr>`;
    }
  }

  // ==================== MÉTODOS PARA MARCAS ====================
  async cargarMarcas(): Promise<void> {
    try {
      const respuesta = await fetch(this.API_URL_MARCAS);
      this.marcas = await respuesta.json();
      this.actualizarTablaMarcas();
      this.actualizarSelectMarcas();
    } catch (error) {
      console.error('Error al cargar marcas:', error);
      this.mostrarErrorMarcas('Error al cargar datos');
    }
  }

  private actualizarTablaMarcas(): void {
    const tbody = document.querySelector('#tablaMarcas tbody') as HTMLElement;
    if (!tbody) return;

    console.log('=== ACTUALIZANDO TABLA MARCAS ===');
    console.log('Marcas disponibles:', this.marcas);

    tbody.innerHTML = '';
    if (this.marcas.length > 0) {
      this.marcas.forEach(marca => {
        console.log('Procesando marca:', marca);
        tbody.innerHTML += `
          <tr>
            <td>${marca.id_marca}</td>
            <td>${marca.nombre_marca}</td>
            <td><span class="badge ${marca.estado ? 'bg-success' : 'bg-danger'}">${marca.estado ? 'Activo' : 'Inactivo'}</span></td>
            <td>
              <button class="btn btn-warning btn-sm me-1" onclick="editarMarcaGlobal(${marca.id_marca})">Editar</button>
              <button class="btn btn-danger btn-sm" onclick="eliminarMarcaGlobal(${marca.id_marca})">Eliminar</button>
            </td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay marcas</td></tr>';
    }

    (window as any).editarMarcaGlobal = (id: number) => {
      console.log('=== FUNCIÓN GLOBAL EDITARMARCA LLAMADA ===');
      console.log('ID recibido en función global:', id, typeof id);
      this.editarMarca(id);
    };
    (window as any).eliminarMarcaGlobal = (id: number) => this.eliminarMarca(id);
    
    console.log('Funciones globales de marcas asignadas');
  }

  private actualizarSelectMarcas(): void {
    const selectMarca = document.getElementById('id_marca') as HTMLSelectElement;
    if (!selectMarca) return;

    selectMarca.innerHTML = '<option value="">Seleccione una marca</option>';
    
    // Agregar opciones de marcas
    this.marcas.forEach(marca => {
      const option = document.createElement('option');
      option.value = marca.id_marca.toString();
      option.textContent = marca.nombre_marca;
      selectMarca.appendChild(option);
    });
  }

  async onSubmitMarca(event: Event): Promise<void> {
    event.preventDefault();
    
    // Obtener valores directamente de los inputs
    const nombre_marca = (document.getElementById('nombre_marca') as HTMLInputElement).value.trim();
    const estado = (document.getElementById('estado_marca') as HTMLSelectElement).value;
    
    if (!nombre_marca || !estado) {
      alert('El nombre de la marca y el estado son obligatorios');
      return;
    }
    
    const datos = {
      nombre_marca,
      estado,
      ...(this.editandoIdMarca && { id_marca: this.editandoIdMarca })
    };

    const metodo = this.editandoIdMarca ? 'PUT' : 'POST';

    try {
      console.log('Enviando datos de marca:', datos);
      
      const respuesta = await fetch(this.API_URL_MARCAS, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      const resultado: ApiResponse = await respuesta.json();
      console.log('Resultado:', resultado);
      
      if (resultado.success) {
        alert(this.editandoIdMarca ? 'Marca actualizada' : 'Marca registrada');
        await this.cargarMarcas(); // Esto también actualiza el select
        this.limpiarFormularioMarca();
      } else {
        alert('Error: ' + resultado.error);
      }
    } catch (error) {
      alert('Error de conexión');
      console.error('Error completo:', error);
    }
  }

  async editarMarca(id: number | string): Promise<void> {
    console.log('=== INICIANDO EDITAR MARCA ===');
    console.log('ID recibido:', id, 'tipo:', typeof id);
    
    const marcaId = Number(id);
    console.log('ID convertido:', marcaId, 'tipo:', typeof marcaId);
    
    const marca = this.marcas.find(m => Number(m.id_marca) === marcaId);
    console.log('Marca encontrada:', marca);
    
    if (marca) {
      // Llenar los campos del formulario
      (document.getElementById('nombre_marca') as HTMLInputElement).value = marca.nombre_marca;
      (document.getElementById('estado_marca') as HTMLSelectElement).value = marca.estado.toString();
      
      // Cambiar textos del formulario
      const submitBtn = document.querySelector('#formMarca button[type="submit"]') as HTMLElement;
      const cardHeaders = document.querySelectorAll('.card-header');
      const cancelBtn = document.getElementById('btnCancelarMarca') as HTMLElement;
      
      if (submitBtn) submitBtn.textContent = 'Actualizar marca';
      if (cardHeaders && cardHeaders.length > 2) {
        (cardHeaders[2] as HTMLElement).textContent = 'Editar marca';
      }
      if (cancelBtn) cancelBtn.style.display = 'inline-block';
      
      this.editandoIdMarca = marcaId;
      
      console.log('Marca editada exitosamente:', marca.nombre_marca);
      alert('Modo edición activado para: ' + marca.nombre_marca);
    } else {
      console.log('ERROR: Marca no encontrada');
      alert('Marca no encontrada');
    }
    console.log('=== FIN EDITAR MARCA ===');
  }

  async eliminarMarca(id: number): Promise<void> {
    if (!confirm('¿Eliminar esta marca? Esto puede afectar los productos asociados.')) return;

    try {
      const respuesta = await fetch(`${this.API_URL_MARCAS}?id_marca=${id}`, { method: 'DELETE' });
      const resultado: ApiResponse = await respuesta.json();
      
      if (resultado.success) {
        alert('Marca eliminada');
        await this.cargarMarcas(); // Esto también actualiza el select
        await this.cargarProductos(); // Recargar productos por si había referencias
      } else {
        alert('Error: ' + resultado.error);
      }
    } catch (error) {
      alert('Error de conexión');
      console.error(error);
    }
  }

  limpiarFormularioMarca(): void {
    (document.getElementById('formMarca') as HTMLFormElement).reset();
    (document.querySelector('#formMarca button[type="submit"]') as HTMLElement).textContent = 'Registrar marca';
    const cardHeaders = document.querySelectorAll('.card-header');
    if (cardHeaders && cardHeaders.length > 2) {
      (cardHeaders[2] as HTMLElement).textContent = 'Registrar nueva marca';
    }
    (document.getElementById('btnCancelarMarca') as HTMLElement).style.display = 'none';
    this.editandoIdMarca = null;
  }

  private mostrarErrorMarcas(mensaje: string): void {
    const tbody = document.querySelector('#tablaMarcas tbody') as HTMLElement;
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${mensaje}</td></tr>`;
    }
  }
}