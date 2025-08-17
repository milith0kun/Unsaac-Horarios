import React, { useRef, useCallback, useMemo } from 'react';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';
import './HorarioApp.css';
import ScheduleBoard from './ScheduleBoard';
import { useScheduleManager } from '../hooks/useScheduleManager';
import { 
  generarArchivoICS, 
  descargarArchivoICS, 
  enviarPorCorreo, 
  exportarHorarioCompleto 
} from '../services/calendarService';

const HorarioApp = React.memo(({ 
  cursosSeleccionados = [], 
  conflictos = [],
  onRemoverCurso, 
  onLimpiarSeleccion,
  loading = false 
}) => {
  // Usar el custom hook para manejo optimizado de horarios
  const {
    cursosConHorarios
  } = useScheduleManager(cursosSeleccionados);

  // Memoizar los cursos procesados para el tablero
  const cursosParaTablero = useMemo(() => {
    return cursosConHorarios || [];
  }, [cursosConHorarios]);

  // Función detectarConflictos removida - no se utiliza actualmente

  const handleCellClick = useCallback(() => {
    // console.log('Celda clickeada'); // Comentado para evitar spam en consola
    // Aquí se puede agregar lógica para manejar clicks en celdas
  }, []);

  // Ref para el tablero de horarios
  const tableroRef = useRef(null);

  // Funciones para las nuevas funcionalidades
  const exportarComoImagen = useCallback(async () => {
    // Funcionalidad temporalmente deshabilitada
    alert('Funcionalidad de exportar imagen temporalmente no disponible.');
    return;
    
    /* Código comentado para evitar errores de build
    if (!tableroRef.current) {
      console.error('No se encontró el elemento del tablero');
      return;
    }

    try {
      // Exportando como imagen
      
      // Configuración para html2canvas
      const canvas = await html2canvas(tableroRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Mayor resolución
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: tableroRef.current.scrollWidth,
        height: tableroRef.current.scrollHeight
      });
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.download = `horario_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      
      // Simular click para descargar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Imagen exportada exitosamente
    } catch (error) {
      console.error('Error al exportar imagen:', error);
      alert('Error al exportar la imagen. Por favor, inténtalo de nuevo.');
    }
    */
  }, []);

  const exportarComoPDF = useCallback(async () => {
    // Funcionalidad temporalmente deshabilitada
    alert('Funcionalidad de exportar PDF temporalmente no disponible.');
    return;
    
    /* Código comentado para evitar errores de build
    if (!tableroRef.current) {
      console.error('No se encontró el elemento del tablero');
      return;
    }

    try {
      // Exportando como PDF
      
      // Capturar el tablero como imagen
      const canvas = await html2canvas(tableroRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: tableroRef.current.scrollWidth,
        height: tableroRef.current.scrollHeight
      });
      
      // Crear PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calcular dimensiones para ajustar al PDF
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calcular escala para mantener proporción
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;
      
      // Centrar la imagen en el PDF
      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;
      
      // Añadir imagen al PDF
      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
      
      // Descargar PDF
      pdf.save(`horario_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // PDF exportado exitosamente
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar el PDF. Por favor, inténtalo de nuevo.');
    }
    */
  }, []);

  const generarNuevoHorario = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres crear un nuevo horario? Se perderá la selección actual.')) {
      // Si hay función para limpiar selección, la llamamos
      if (onLimpiarSeleccion) {
        onLimpiarSeleccion();
      }
      
      // Mostrar mensaje de confirmación
      alert('Horario limpiado. Puedes seleccionar nuevos cursos para crear un nuevo horario.');
    }
  }, [onLimpiarSeleccion]);

  const limpiarTodo = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres limpiar todo el horario? Esta acción no se puede deshacer.')) {
      // Llamar a la función de limpiar selección del componente padre
      if (onLimpiarSeleccion) {
        onLimpiarSeleccion();
      }
    }
  }, [onLimpiarSeleccion]);

  // Nuevas funciones de exportación
  const exportarACalendario = useCallback(() => {
    try {
      if (cursosParaTablero.length === 0) {
        alert('No hay cursos en el horario para exportar.');
        return;
      }

      const contenidoICS = generarArchivoICS(cursosParaTablero);
      const nombreArchivo = `horario_unsaac_${new Date().toISOString().split('T')[0]}.ics`;
      descargarArchivoICS(contenidoICS, nombreArchivo);
      
      alert('Archivo de calendario descargado. Puedes importarlo en Google Calendar, Outlook o cualquier aplicación de calendario.');
    } catch (error) {
      console.error('Error al exportar a calendario:', error);
      alert('Error al generar el archivo de calendario. Por favor, inténtalo de nuevo.');
    }
  }, [cursosParaTablero]);

  const enviarHorarioPorCorreo = useCallback(() => {
    try {
      if (cursosParaTablero.length === 0) {
        alert('No hay cursos en el horario para enviar.');
        return;
      }

      enviarPorCorreo(cursosParaTablero);
    } catch (error) {
      console.error('Error al enviar por correo:', error);
      alert('Error al abrir el cliente de correo. Por favor, inténtalo de nuevo.');
    }
  }, [cursosParaTablero]);

  const exportarCompleto = useCallback(() => {
    try {
      if (cursosParaTablero.length === 0) {
        alert('No hay cursos en el horario para exportar.');
        return;
      }

      const exito = exportarHorarioCompleto(cursosParaTablero);
      if (exito) {
        alert('Se ha descargado el archivo de calendario y se abrirá tu cliente de correo.');
      } else {
        alert('Error al exportar el horario completo.');
      }
    } catch (error) {
      console.error('Error en exportación completa:', error);
      alert('Error al exportar el horario. Por favor, inténtalo de nuevo.');
    }
  }, [cursosParaTablero]);

  // Mostrar estado de carga o error si es necesario

  return (
    <div className="horario-app">
      {/* Header con información de cursos */}
      <div className="horario-header">
        <div className="header-top">
          <h1>Tablero de Horarios</h1>
          {cursosSeleccionados.length > 0 && (
            <div className="cursos-info">
              <span>Cursos activos: </span>
              <div className="cursos-activos-lista">
                {cursosSeleccionados.map((curso) => (
                  <div key={curso.id} className="curso-activo">
                    <span className="curso-tag">
                      {curso.codigo}
                    </span>
                    {onRemoverCurso && (
                      <button 
                        className="btn-remover-curso"
                        onClick={() => onRemoverCurso(curso.id)}
                        title={`Deseleccionar ${curso.codigo}`}
                        aria-label={`Deseleccionar curso ${curso.codigo}`}
                        disabled={false}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="acciones-horario">
            <button 
              className="btn-accion btn-exportar-imagen"
              onClick={exportarComoImagen}
              title="Exportar como imagen"
              disabled={loading || cursosParaTablero.length === 0}
            >
              📷 Imagen
            </button>
            <button 
              className="btn-accion btn-exportar-pdf"
              onClick={exportarComoPDF}
              title="Exportar como PDF"
              disabled={loading || cursosParaTablero.length === 0}
            >
              📄 PDF
            </button>
            <button 
              className="btn-accion btn-nuevo-horario"
              onClick={generarNuevoHorario}
              title="Generar nuevo horario"
              disabled={loading}
            >
              ➕ Nuevo
            </button>
            <button 
              className="btn-accion btn-limpiar"
              onClick={limpiarTodo}
              title="Limpiar todo"
              disabled={loading || cursosSeleccionados.length === 0}
            >
              🗑️ Limpiar
              {cursosSeleccionados.length > 0 && (
                <span className="action-badge">{cursosSeleccionados.length}</span>
              )}
            </button>
            
            {conflictos.length > 0 && (
              <div className="conflict-indicator">
                ⚠️ {conflictos.length} conflicto{conflictos.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tablero de Horarios */}
      <div className="tablero-horario" ref={tableroRef}>
        <ScheduleBoard 
          cursos={cursosParaTablero}
          onCellClick={handleCellClick}
          loading={loading}
        />
      </div>

      {/* Botones de exportación en la base del panel */}
      <div className="acciones-exportacion">
        <button 
          className="btn-accion btn-exportar-calendario"
          onClick={exportarACalendario}
          title="Descargar archivo para Google Calendar"
          disabled={loading || cursosParaTablero.length === 0}
        >
          📅 Calendario
        </button>
        <button 
          className="btn-accion btn-enviar-correo"
          onClick={enviarHorarioPorCorreo}
          title="Enviar horario por correo"
          disabled={loading || cursosParaTablero.length === 0}
        >
          ✉️ Correo
        </button>
        <button 
          className="btn-accion btn-exportar-completo"
          onClick={exportarCompleto}
          title="Descargar calendario y enviar por correo"
          disabled={loading || cursosParaTablero.length === 0}
        >
          📤 Exportar Todo
        </button>
      </div>
    </div>
  );
});

HorarioApp.displayName = 'HorarioApp';

export default HorarioApp;