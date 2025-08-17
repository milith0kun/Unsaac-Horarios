import ScrapingCarrera from './ScrapingCarrera.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script para ejecutar scraping masivo de todas las carreras de la UNSAAC
 * Utiliza el catálogo verificado y el módulo ScrapingCarrera para procesar todas las carreras
 */
class ScrapingMasivo {
  constructor(config = {}) {
    this.catalogoPath = path.join(__dirname, '..', 'data', 'verificacion_acceso_2025-08-15.json');
    this.outputDir = path.join(__dirname, '..', 'data', 'carreras');
    this.config = {
      headless: config.headless ?? true, // Modo headless para mejor rendimiento
      timeout: config.timeout ?? 45000,
      maxRetries: config.maxRetries ?? 3,
      cleanupHTML: config.cleanupHTML ?? true,
      saveHTML: config.saveHTML ?? false, // No guardar HTML por defecto para ahorrar espacio
      verbose: config.verbose ?? true,
      batchSize: config.batchSize ?? 3, // Procesar en lotes de 3 carreras
      delayBetweenBatches: config.delayBetweenBatches ?? 5000, // 5 segundos entre lotes
      delayBetweenCarreras: config.delayBetweenCarreras ?? 2000, // 2 segundos entre carreras
      ...config
    };
    this.scraper = null;
    this.resultados = {
      exitosas: [],
      fallidas: [],
      estadisticas: {
        totalCarreras: 0,
        procesadas: 0,
        exitosas: 0,
        fallidas: 0,
        tiempoInicio: null,
        tiempoFin: null,
        tiempoTotal: 0
      }
    };
  }

  /**
   * Método principal para ejecutar el scraping masivo
   */
  async ejecutar() {
    try {
      this.log('🚀 Iniciando scraping masivo de carreras UNSAAC');
      this.resultados.estadisticas.tiempoInicio = new Date();
      
      // Crear directorio de salida
      await this.crearDirectorios();
      
      // Cargar catálogo
      const catalogo = await this.cargarCatalogo();
      this.resultados.estadisticas.totalCarreras = catalogo.carreras.length;
      
      this.log(`📚 Catálogo cargado: ${catalogo.carreras.length} carreras encontradas`);
      
      // Inicializar scraper
      this.scraper = new ScrapingCarrera(this.config);
      await this.scraper.initBrowser();
      
      // Procesar carreras en lotes
      await this.procesarCarrerasEnLotes(catalogo.carreras);
      
      // Finalizar
      await this.finalizarProceso();
      
    } catch (error) {
      this.log(`❌ Error crítico en scraping masivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Carga el catálogo de carreras verificado
   */
  async cargarCatalogo() {
    try {
      const contenido = await fs.readFile(this.catalogoPath, 'utf8');
      const verificacion = JSON.parse(contenido);
      
      if (!verificacion.resultadosExitosos || !Array.isArray(verificacion.resultadosExitosos)) {
        throw new Error('Formato de archivo de verificación inválido');
      }
      
      // Adaptar estructura del archivo de verificación al formato esperado
      return {
        carreras: verificacion.resultadosExitosos.map(carrera => ({
          numero: carrera.numero,
          nombre: carrera.nombre,
          enlace: carrera.enlace,
          enlaceOriginal: carrera.enlace,
          tipoArchivo: 'html'
        }))
      };
    } catch (error) {
      throw new Error(`Error cargando catálogo: ${error.message}`);
    }
  }

  /**
   * Crea directorios necesarios
   */
  async crearDirectorios() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      this.log(`📁 Directorio de salida creado: ${this.outputDir}`);
    } catch (error) {
      this.log(`⚠️ Error creando directorios: ${error.message}`);
    }
  }

  /**
   * Procesa las carreras en lotes para mejor rendimiento
   */
  async procesarCarrerasEnLotes(carreras) {
    const totalLotes = Math.ceil(carreras.length / this.config.batchSize);
    
    this.log(`🔄 Procesando ${carreras.length} carreras en ${totalLotes} lotes de ${this.config.batchSize}`);
    
    let carrerasProcesadas = 0;
    
    for (let i = 0; i < carreras.length; i += this.config.batchSize) {
      const lote = carreras.slice(i, i + this.config.batchSize);
      const numeroLote = Math.floor(i / this.config.batchSize) + 1;
      
      this.log(`\n📦 Procesando lote ${numeroLote}/${totalLotes} (${lote.length} carreras)`);
      
      // Procesar carreras del lote secuencialmente
      for (const carrera of lote) {
        // Reiniciar browser si es necesario
        if (this.config.reiniciarBrowserCada && carrerasProcesadas > 0 && carrerasProcesadas % this.config.reiniciarBrowserCada === 0) {
          this.log(`🔄 Reiniciando navegador después de ${carrerasProcesadas} carreras...`);
          await this.scraper.closeBrowser();
          await this.scraper.initBrowser();
          this.log(`✅ Navegador reiniciado`);
        }
        
        await this.procesarCarrera(carrera);
        carrerasProcesadas++;
        
        // Delay entre carreras dentro del lote
        if (this.config.delayBetweenCarreras > 0) {
          await this.esperar(this.config.delayBetweenCarreras);
        }
      }
      
      // Delay entre lotes
      if (numeroLote < totalLotes && this.config.delayBetweenBatches > 0) {
        this.log(`⏳ Esperando ${this.config.delayBetweenBatches}ms antes del siguiente lote...`);
        await this.esperar(this.config.delayBetweenBatches);
      }
    }
  }

  /**
   * Procesa una carrera individual
   */
  async procesarCarrera(carrera) {
    const inicio = Date.now();
    
    try {
      this.log(`\n🎓 Procesando: ${carrera.nombre}`);
      this.log(`🔗 URL: ${carrera.enlace}`);
      
      // Ejecutar scraping de la carrera
      const resultado = await this.scraper.scrapearCarrera(
        carrera.enlace,
        carrera.nombre,
        {
          tiempoEspera: 3000,
          numeroCarrera: carrera.numero,
          enlaceOriginal: carrera.enlaceOriginal,
          tipoArchivo: carrera.tipoArchivo
        }
      );
      
      const tiempoProceso = Date.now() - inicio;
      
      // Registrar resultado exitoso
      this.resultados.exitosas.push({
        numero: carrera.numero,
        nombre: carrera.nombre,
        url: carrera.enlace,
        totalCursos: resultado.informacionGeneral.totalCursos,
        tipoExtraccion: resultado.informacionGeneral.tipoExtraccion,
        estrategiaExtraccion: resultado.informacionGeneral.estrategiaExtraccion,
        tiempoProceso: tiempoProceso,
        timestamp: new Date().toISOString()
      });
      
      this.resultados.estadisticas.exitosas++;
      this.resultados.estadisticas.procesadas++;
      
      this.log(`✅ ${carrera.nombre} completada: ${resultado.informacionGeneral.totalCursos} cursos (${tiempoProceso}ms)`);
      
    } catch (error) {
      const tiempoProceso = Date.now() - inicio;
      
      // Registrar resultado fallido
      this.resultados.fallidas.push({
        numero: carrera.numero,
        nombre: carrera.nombre,
        url: carrera.enlace,
        error: error.message,
        tiempoProceso: tiempoProceso,
        timestamp: new Date().toISOString()
      });
      
      this.resultados.estadisticas.fallidas++;
      this.resultados.estadisticas.procesadas++;
      
      this.log(`❌ Error procesando ${carrera.nombre}: ${error.message} (${tiempoProceso}ms)`);
    }
    
    // Mostrar progreso
    const progreso = ((this.resultados.estadisticas.procesadas / this.resultados.estadisticas.totalCarreras) * 100).toFixed(1);
    this.log(`📊 Progreso: ${this.resultados.estadisticas.procesadas}/${this.resultados.estadisticas.totalCarreras} (${progreso}%)`);
  }

  /**
   * Finaliza el proceso y genera reporte
   */
  async finalizarProceso() {
    try {
      // Cerrar browser
      if (this.scraper) {
        await this.scraper.closeBrowser();
      }
      
      // Calcular estadísticas finales
      this.resultados.estadisticas.tiempoFin = new Date();
      this.resultados.estadisticas.tiempoTotal = this.resultados.estadisticas.tiempoFin - this.resultados.estadisticas.tiempoInicio;
      
      // Generar reporte
      await this.generarReporte();
      
      // Mostrar resumen final
      this.mostrarResumenFinal();
      
    } catch (error) {
      this.log(`⚠️ Error finalizando proceso: ${error.message}`);
    }
  }

  /**
   * Genera reporte detallado del scraping masivo
   */
  async generarReporte() {
    const fecha = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    const nombreReporte = `reporte_scraping_masivo_${fecha}_${timestamp}.json`;
    const rutaReporte = path.join(this.outputDir, nombreReporte);
    
    const reporte = {
      informacionGeneral: {
        fechaEjecucion: this.resultados.estadisticas.tiempoInicio.toISOString(),
        tiempoTotal: this.resultados.estadisticas.tiempoTotal,
        tiempoTotalFormateado: this.formatearTiempo(this.resultados.estadisticas.tiempoTotal),
        configuracion: this.config
      },
      estadisticas: this.resultados.estadisticas,
      resultadosExitosos: this.resultados.exitosas,
      resultadosFallidos: this.resultados.fallidas,
      resumen: {
        tasaExito: ((this.resultados.estadisticas.exitosas / this.resultados.estadisticas.totalCarreras) * 100).toFixed(2) + '%',
        tasaFallo: ((this.resultados.estadisticas.fallidas / this.resultados.estadisticas.totalCarreras) * 100).toFixed(2) + '%',
        tiempoPromedioPorCarrera: Math.round(this.resultados.estadisticas.tiempoTotal / this.resultados.estadisticas.procesadas) + 'ms'
      }
    };
    
    await fs.writeFile(rutaReporte, JSON.stringify(reporte, null, 2), 'utf8');
    this.log(`📊 Reporte generado: ${nombreReporte}`);
  }

  /**
   * Muestra resumen final en consola
   */
  mostrarResumenFinal() {
    const stats = this.resultados.estadisticas;
    const tiempoFormateado = this.formatearTiempo(stats.tiempoTotal);
    const tasaExito = ((stats.exitosas / stats.totalCarreras) * 100).toFixed(1);
    
    this.log('\n' + '='.repeat(60));
    this.log('📋 RESUMEN FINAL DEL SCRAPING MASIVO');
    this.log('='.repeat(60));
    this.log(`📚 Total de carreras: ${stats.totalCarreras}`);
    this.log(`✅ Exitosas: ${stats.exitosas}`);
    this.log(`❌ Fallidas: ${stats.fallidas}`);
    this.log(`📊 Tasa de éxito: ${tasaExito}%`);
    this.log(`⏱️ Tiempo total: ${tiempoFormateado}`);
    this.log(`⚡ Tiempo promedio por carrera: ${Math.round(stats.tiempoTotal / stats.procesadas)}ms`);
    this.log('='.repeat(60));
    
    if (stats.fallidas > 0) {
      this.log('\n⚠️ CARRERAS FALLIDAS:');
      this.resultados.fallidas.forEach(carrera => {
        this.log(`   - ${carrera.nombre}: ${carrera.error}`);
      });
    }
    
    this.log('\n🎉 Scraping masivo completado!');
  }

  /**
   * Formatea tiempo en milisegundos a formato legible
   */
  formatearTiempo(ms) {
    const segundos = Math.floor(ms / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos % 60}m ${segundos % 60}s`;
    } else if (minutos > 0) {
      return `${minutos}m ${segundos % 60}s`;
    } else {
      return `${segundos}s`;
    }
  }

  /**
   * Función de espera
   */
  async esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Método de logging
   */
  log(mensaje) {
    if (this.config.verbose) {
      console.log(mensaje);
    }
  }
}

/**
 * Función principal para ejecutar el scraping masivo
 */
async function main() {
  try {
    const config = {
      headless: true, // Volver a headless con configuración robusta
      timeout: 60000,
      maxRetries: 2, // Reducir reintentos para evitar bloqueos
      cleanupHTML: true,
      saveHTML: false, // No guardar HTML para mejor rendimiento
      verbose: true,
      batchSize: 1,
      delayBetweenBatches: 20000, // 20 segundos entre lotes
      delayBetweenCarreras: 8000, // 8 segundos entre carreras
      reiniciarBrowserCada: 5 // Reiniciar browser cada 5 carreras
    };
    
    const scrapingMasivo = new ScrapingMasivo(config);
    await scrapingMasivo.ejecutar();
    
  } catch (error) {
    console.error('❌ Error ejecutando scraping masivo:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
main();

// Exportar para uso como módulo
export { ScrapingMasivo };