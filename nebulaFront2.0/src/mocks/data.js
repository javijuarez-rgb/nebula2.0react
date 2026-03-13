// src/mocks/data.js

export const MOCK_CLIENTES = [
  {
    id: 1,
    nombre: "Restaurante La Nebula",
    logos: ["https://via.placeholder.com/150", "https://via.placeholder.com/50"],
    colores: ["#89b4fa", "#f38ba8"],
    tipografias: ["Montserrat", "Open Sans"],
    estrategias: [
      { id: 1, fecha: "2026-03-01", titulo: "Campaña Primavera", desc: "Promoción de terrazas" }
    ],
    es_activo: 1,
    telefono: "600123456",
    direccion: "Calle Falsa 123",
    es_potencial: 0
  },
  {
    id: 2,
    nombre: "Gimnasio FitTech",
    logos: [],
    colores: [],
    tipografias: [],
    estrategias: [],
    es_activo: 1,
    telefono: "600654321",
    direccion: "Av. Deportiva 45",
    es_potencial: 1
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
    empleados: "Juan Pérez, Admin",
    mensaje_empleado: ""
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
    empleados: "Admin",
    mensaje_empleado: ""
  },
  {
    id: 103,
    cliente_id: 1,
    cliente_nombre: "Restaurante La Nebula",
    titulo: "Diseño de Menú QR",
    descripcion: "Actualizar precios y subir a servidor",
    prioridad: "media",
    estado: "espera_aprobacion",
    fecha_limite: "2026-03-10 10:00:00",
    empleados: "Admin",
    mensaje_empleado: "Revisad el PDF adjunto por favor. https://example.com/uploads/pruebas/menu_v2.pdf"
  }
];
export const MOCK_EQUIPO = [
  { id: 1, nombre: "Juan Pérez", usuario: "juan.p", rol: "Superadmin", pin_generado: "1234" },
  { id: 2, nombre: "María García", usuario: "maria.g", rol: "Admin", pin_generado: "5678" },
  { id: 3, nombre: "Carlos López", usuario: "carlos.l", rol: "Empleado", pin_generado: "9012" },
  { id: 4, nombre: "Ana Martínez", usuario: "ana.m", rol: "Empleado", pin_generado: "3456" }
];
