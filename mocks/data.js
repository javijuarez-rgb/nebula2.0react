// src/mocks/data.js

export const MOCK_CLIENTES = [
  {
    id: 1,
    nombre: "Restaurante La Nebula",
    telefono: "600000000",
    direccion: "Calle Falsa 123",
    descripcion: "Cliente VIP de hostelería",
    es_activo: 1,
    es_potencial: 0,
    ingreso_real: 1200.50,
    coste_real: 300.00,
    tiene_iva: 1,
    tiene_irpf: 1
  },
  {
    id: 2,
    nombre: "Gimnasio FitTech",
    telefono: "611222333",
    direccion: "Av. Principal 45",
    descripcion: "Interesado en gestión de redes",
    es_activo: 1,
    es_potencial: 1,
    ingreso_real: 0,
    coste_real: 0,
    tiene_iva: 1,
    tiene_irpf: 0
  }
];

export const MOCK_TAREAS = [
  {
    id: 101,
    cliente_id: 1,
    cliente_nombre: "Restaurante La Nebula",
    titulo: "Reel de cocina en vivo",
    descripcion: "Grabar al chef preparando el plato estrella",
    prioridad: "alta",
    estado: "proceso",
    fecha_limite: "2026-03-15 14:00:00",
    empleados: "Juan Pérez, Admin"
  },
  {
    id: 102,
    cliente_id: 2,
    cliente_nombre: "Gimnasio FitTech",
    titulo: "Post de bienvenida",
    descripcion: "Diseño para nuevos socios",
    prioridad: "media",
    estado: "pendiente",
    fecha_limite: "2026-03-20 10:00:00",
    empleados: "Admin"
  }
];