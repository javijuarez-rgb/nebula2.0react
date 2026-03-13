import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { MOCK_TAREAS, MOCK_CLIENTES } from '../mocks/data';
import { Calendar as CalendarIcon, Filter, Plus, Info, Clock, Calendar, CheckCircle } from 'lucide-react';
import Modal from '../components/Modal';

const CalendarioView = () => {
  const [events, setEvents] = useState([]);
  const [filtroCliente, setFiltroCliente] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const PRIORITY_COLORS = {
    urgente: '#f38ba8',
    alta: '#fab387',
    media: '#f9e2af',
    baja: '#a6e3a1'
  };

  useEffect(() => {
    const mappedEvents = MOCK_TAREAS.map(tarea => ({
      id: tarea.id.toString(),
      title: `${tarea.cliente_nombre}: ${tarea.titulo}`,
      start: tarea.fecha_limite,
      backgroundColor: PRIORITY_COLORS[tarea.prioridad] || '#bac2de',
      borderColor: PRIORITY_COLORS[tarea.prioridad] || '#bac2de',
      textColor: '#11111b',
      extendedProps: {
        cliente_id: tarea.cliente_id,
        cliente_nombre: tarea.cliente_nombre,
        titulo_corto: tarea.titulo,
        descripcion: tarea.descripcion,
        prioridad: tarea.prioridad,
        estado: tarea.estado
      }
    }));

    if (filtroCliente === 'all') {
      setEvents(mappedEvents);
    } else {
      setEvents(mappedEvents.filter(ev => ev.extendedProps.cliente_id === parseInt(filtroCliente)));
    }
  }, [filtroCliente]);

  const handleEventClick = (info) => {
    setSelectedEvent({
      title: info.event.title,
      start: info.event.start,
      ...info.event.extendedProps
    });
    setShowModal(true);
  };

  return (
    <div className="container-fluid animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h3 className="text-white fw-bold mb-0 d-flex align-items-center gap-2">
          <CalendarIcon size={24} className="text-primary" />
          Calendario de Tareas
        </h3>
        
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <Filter size={18} className="text-muted" />
            <select 
              className="form-select border-0 shadow-sm"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', borderRadius: '10px', width: 'auto' }}
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
            >
              <option value="all">Todos los clientes</option>
              {MOCK_CLIENTES.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary d-flex align-items-center gap-2 fw-bold px-3">
            <Plus size={18} /> Nueva Tarea
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm p-3 overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '15px' }}>
        <div className="calendar-container text-white">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
            initialView="dayGridMonth"
            locale="es"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,listMonth'
            }}
            events={events}
            height="auto"
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              list: 'Lista'
            }}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
              hour12: false
            }}
            dayMaxEvents={true}
            eventClick={handleEventClick}
          />
        </div>
      </div>

      {/* Modal de Detalles de Tarea */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title="Detalles de la Tarea"
        icon={<Info size={24} />}
        footer={
          <button 
            className="btn btn-primary w-100 fw-bold py-2" 
            onClick={() => setShowModal(false)}
          >
            Entendido
          </button>
        }
      >
        {selectedEvent && (
          <div className="animate__animated animate__fadeIn">
            <div className="mb-4">
              <label className="small text-secondary fw-bold text-uppercase mb-1 d-block">Cliente</label>
              <h5 className="text-primary fw-bold mb-0">{selectedEvent.cliente_nombre}</h5>
            </div>

            <div className="mb-4">
              <label className="small text-secondary fw-bold text-uppercase mb-1 d-block">Tarea</label>
              <h6 className="text-white fw-medium mb-0">{selectedEvent.titulo_corto}</h6>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-6">
                <div className="p-3 rounded-3 border border-secondary border-opacity-10 bg-dark bg-opacity-25">
                  <div className="d-flex align-items-center gap-2 text-primary mb-1">
                    <Calendar size={16} />
                    <span className="small fw-bold">Fecha</span>
                  </div>
                  <div className="text-white fw-medium">
                    {selectedEvent.start.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 rounded-3 border border-secondary border-opacity-10 bg-dark bg-opacity-25">
                  <div className="d-flex align-items-center gap-2 text-info mb-1">
                    <Clock size={16} />
                    <span className="small fw-bold">Hora</span>
                  </div>
                  <div className="text-white fw-medium">
                    {selectedEvent.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div 
                  className="rounded-circle" 
                  style={{ width: '12px', height: '12px', backgroundColor: PRIORITY_COLORS[selectedEvent.prioridad] }}
                ></div>
                <span className="small text-secondary fw-bold text-uppercase">Prioridad {selectedEvent.prioridad}</span>
                <span className="mx-2 text-secondary">|</span>
                <CheckCircle size={14} className="text-success" />
                <span className="small text-secondary fw-bold text-uppercase">Estado {selectedEvent.estado}</span>
              </div>
            </div>

            <div className="p-3 rounded-3 border border-secondary border-opacity-10 bg-dark bg-opacity-10">
              <label className="small text-secondary fw-bold text-uppercase mb-2 d-block">Descripción</label>
              <p className="text-white opacity-75 small mb-0 lh-lg italic">
                {selectedEvent.descripcion || "Sin descripción proporcionada."}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .fc {
          --fc-border-color: rgba(255, 255, 255, 0.05);
          --fc-daygrid-event-dot-width: 8px;
          --fc-page-bg-color: transparent;
          font-family: inherit;
        }
        .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 700;
          color: white;
        }
        .fc-button {
          background-color: var(--bg-deep) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          font-weight: 600 !important;
          text-transform: capitalize !important;
          box-shadow: none !important;
          transition: 0.2s;
        }
        .fc-button:hover {
          background-color: var(--primary-color) !important;
          border-color: var(--primary-color) !important;
        }
        .fc-button-active {
          background-color: var(--primary-color) !important;
          border-color: var(--primary-color) !important;
        }
        .fc-day-today {
          background-color: rgba(137, 180, 250, 0.05) !important;
        }
        .fc-col-header-cell-cushion {
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding: 10px 0 !important;
        }
        .fc-daygrid-day-number {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          padding: 8px !important;
          font-size: 0.9rem;
        }
        .fc-event {
          cursor: pointer;
          border-radius: 6px !important;
          border: none !important;
          padding: 2px 4px !important;
          font-size: 0.8rem !important;
          font-weight: 600 !important;
          margin-bottom: 1px !important;
        }
        .fc-daygrid-day-frame {
          transition: transform 0.2s, z-index 0.2s;
        }
        /* Solo aplicamos el efecto si hay eventos dentro del día */
        .fc-daygrid-day:has(.fc-event):hover {
          z-index: 10 !important;
        }
        .fc-daygrid-day:has(.fc-event):hover .fc-daygrid-day-frame {
          transform: scale(1.5);
          z-index: 20 !important;
          background-color: var(--bg-card) !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.6);
          border-radius: 12px;
          border: 1px solid var(--primary-color) !important;
          padding-bottom: 10px;
        }
        .fc-daygrid-day:has(.fc-event):hover .fc-event {
          white-space: normal !important;
          height: auto !important;
        }
        /* Efecto Zoom en Vista SEMANA (TimeGrid) */
        .fc-timegrid-event:hover {
          z-index: 100 !important;
          transform: scale(1.5);
          box-shadow: 0 12px 40px rgba(0,0,0,0.8);
          transition: transform 0.2s ease, z-index 0.2s;
          border: 1px solid rgba(255,255,255,0.2) !important;
          height: auto !important;
          min-height: 150px !important;
        }
        .fc-timegrid-event:hover .fc-event-main {
          white-space: normal !important;
          overflow: visible !important;
          padding: 10px !important;
          height: auto !important;
        }
        .fc-timegrid-event:hover .fc-event-title {
          font-size: 1rem !important;
          margin-bottom: 5px;
        }
        .fc-list-event {
          background-color: transparent !important;
        }
        .fc-list-day-cushion {
          background-color: rgba(255, 255, 255, 0.03) !important;
        }
        .fc-list-event:hover td {
          background-color: rgba(255, 255, 255, 0.03) !important;
        }
        .fc-list-event-title b {
          color: var(--primary-color);
        }
      `}</style>
    </div>
  );
};

export default CalendarioView;
