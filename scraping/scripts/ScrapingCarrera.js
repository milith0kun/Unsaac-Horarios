import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar mapeo de facultades y escuelas
let mapeoFacultadEscuela = null;
async function cargarMapeoFacultadEscuela() {
  if (!mapeoFacultadEscuela) {
    try {
      const rutaMapeo = path.join(__dirname, '..', 'config', 'mapeo-facultades-escuelas.json');
      const contenido = await fs.readFile(rutaMapeo, 'utf8');
      mapeoFacultadEscuela = JSON.parse(contenido);
    } catch (error) {
      console.warn('⚠️ No se pudo cargar el mapeo de facultades y escuelas:', error.message);
      mapeoFacultadEscuela = { mapeoFacultadEscuela: {}, facultades: {} };
    }
  }
  return mapeoFacultadEscuela;
}

/**
 * Módulo limpio y modular para scrapear datos de carreras de la UNSAAC
 * Extrae información completa de cursos con estrategias adaptativas
 * Versión optimizada para uso como módulo independiente
 */
class ScrapingCarrera {
  constructor(config = {}) {
    this.browser = null;
    this.outputDir = config.outputDir || path.join(__dirname, '..', 'data');
    this.config = {
      headless: config.headless ?? true,
      timeout: config.timeout ?? 30000,
      maxRetries: config.maxRetries ?? 2,
      verbose: config.verbose ?? false,
      saveToFile: config.saveToFile ?? true,
      ...config
    };
  }

  /**
   * Inicializa el browser de Puppeteer con configuración optimizada
   */
  async initBrowser() {
    if (this.browser) return;

    const launchOptions = {
      headless: this.config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-field-trial-config',
        '--disable-back-forward-cache',
        '--disable-ipc-flooding-protection',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-sync',
        '--disable-translate',
        '--disable-component-extensions-with-background-pages',
        '--disable-client-side-phishing-detection',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-domain-reliability',
        '--disable-component-update',
        '--allow-running-insecure-content',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
        '--ignore-certificate-errors-ssl-errors'
      ],
      ignoreDefaultArgs: ['--enable-automation'],
      ignoreHTTPSErrors: true,
      defaultViewport: null
    };

    try {
      this.browser = await puppeteer.launch(launchOptions);
      this.log('✅ Browser inicializado');
    } catch (error) {
      throw new Error(`Error inicializando browser: ${error.message}`);
    }
  }

  /**
   * Cierra el browser y limpia recursos
   */
  async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.log('✅ Browser cerrado');
      } catch (error) {
        this.log(`⚠️ Error cerrando browser: ${error.message}`);
      } finally {
        this.browser = null;
      }
    }
  }

  /**
   * Método de logging configurable
   */
  log(mensaje) {
    if (this.config.verbose) {
      console.log(mensaje);
    }
  }

  /**
   * Crea directorios necesarios
   */
  async crearDirectorios() {
    if (this.config.saveToFile) {
      try {
        await fs.mkdir(this.outputDir, { recursive: true });
      } catch (error) {
        this.log(`⚠️ Error creando directorios: ${error.message}`);
      }
    }
  }

  /**
   * Función principal para scrapear una carrera
   * @param {string} url - URL de la carrera a scrapear
   * @param {string} nombreCarrera - Nombre de la carrera (opcional)
   * @param {Object} opciones - Opciones específicas para esta carrera
   * @returns {Object} Datos extraídos de la carrera
   */
  async scrapearCarrera(url, nombreCarrera = 'carrera', opciones = {}) {
    await this.crearDirectorios();
    
    this.log(`🚀 Iniciando scraping: ${nombreCarrera}`);
    this.log(`📍 URL: ${url}`);
    
    let ultimoError = null;
    
    for (let intento = 1; intento <= this.config.maxRetries; intento++) {
      try {
        this.log(`🔄 Intento ${intento}/${this.config.maxRetries}`);
        return await this.scrapearReal(url, nombreCarrera, opciones);
      } catch (error) {
        ultimoError = error;
        this.log(`⚠️ Intento ${intento} falló: ${error.message}`);
        
        if (intento < this.config.maxRetries) {
          const tiempoEspera = intento * 1000;
          this.log(`⏳ Esperando ${tiempoEspera}ms...`);
          await new Promise(resolve => setTimeout(resolve, tiempoEspera));
        }
      }
    }
    
    throw ultimoError || new Error('Scraping falló después de todos los intentos');
  }

  /**
   * Intenta hacer scraping real de la página con estrategias adaptativas
   */
  async scrapearReal(url, nombreCarrera, opciones = {}) {
    if (!this.browser) {
      await this.initBrowser();
    }

    const page = await this.browser.newPage();
    
    try {
      // Configurar página para mejor extracción
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Configurar timeouts personalizados
      page.setDefaultTimeout(this.config.timeout);
      page.setDefaultNavigationTimeout(this.config.timeout);
      
      // Configurar headers adicionales
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      });
      
      // Interceptar y permitir todas las requests
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        // Permitir todas las requests
        request.continue();
      });
      
      // Navegar a la página con estrategia adaptativa
      this.log('📄 Navegando a la página...');
      
      const estrategiasNavegacion = [
        { waitUntil: 'domcontentloaded', timeout: this.config.timeout },
        { waitUntil: 'networkidle0', timeout: this.config.timeout * 1.5 },
        { waitUntil: 'load', timeout: this.config.timeout * 2 }
      ];
      
      let navegacionExitosa = false;
      
      for (const estrategia of estrategiasNavegacion) {
        try {
          await page.goto(url, estrategia);
          navegacionExitosa = true;
          this.log(`✅ Navegación exitosa con estrategia: ${estrategia.waitUntil}`);
          break;
        } catch (error) {
          this.log(`⚠️ Estrategia ${estrategia.waitUntil} falló: ${error.message}`);
        }
      }
      
      if (!navegacionExitosa) {
        throw new Error('Todas las estrategias de navegación fallaron');
      }
      
      // Esperar carga adicional con tiempo adaptativo
      const tiempoEspera = opciones.tiempoEspera || 3000;
      await new Promise(resolve => setTimeout(resolve, tiempoEspera));
      
      // Guardar HTML completo para análisis (opcional)
      let htmlCompleto = null;
      let rutaHTML = null;
      
      if (this.config.saveHTML) {
        this.log('💾 Guardando HTML completo para análisis...');
        htmlCompleto = await page.content();
        rutaHTML = await this.guardarHTML(htmlCompleto, nombreCarrera, opciones);
      }
      
      // Extraer información de la carrera
      this.log('📊 Extrayendo información de la carrera...');
      const carreraInfo = await this.extraerInfoCarrera(page, { ...opciones, nombreCarrera });
      
      // Extraer cursos con estrategias adaptativas
      this.log('📚 Extrayendo cursos con estrategias adaptativas...');
      const resultadoExtraccion = await this.extraerCursosAdaptativo(page, htmlCompleto, opciones);
      
      // Verificar si se extrajeron datos válidos
      if (resultadoExtraccion.cursos.length === 0) {
        this.log('⚠️ No se encontraron cursos, analizando estructura de la página...');
        const analisis = await this.analizarEstructuraPagina(page);
        
        // Intentar extracción basada en análisis
        const cursosAnalisis = await this.extraerCursosBasadoEnAnalisis(page, analisis);
        if (cursosAnalisis.length > 0) {
          resultadoExtraccion.cursos = cursosAnalisis;
          resultadoExtraccion.estrategiaUsada = 'analisis_estructura';
        } else {
          throw new Error('No se encontraron cursos en la página después de análisis completo');
        }
      }
      
      // Estructurar datos completos
      const datosCompletos = {
        informacionGeneral: {
          numero: opciones.numeroCarrera || null,
          nombre: nombreCarrera,
          url: url,
          enlaceOriginal: opciones.enlaceOriginal || null,
          tipoArchivo: opciones.tipoArchivo || null,
          fechaExtraccion: new Date().toISOString(),
          totalCursos: resultadoExtraccion.cursos.length,
          tipoExtraccion: 'real',
          estrategiaExtraccion: resultadoExtraccion.estrategiaUsada,
          ...carreraInfo
        },
        cursos: resultadoExtraccion.cursos,
        metadatos: {
          htmlGuardado: this.config.saveHTML,
          rutaHTML: rutaHTML,
          estrategiaExtraccion: resultadoExtraccion.estrategiaUsada,
          timestamp: Date.now(),
          datosCatalogo: {
            numero: opciones.numeroCarrera || null,
            enlaceOriginal: opciones.enlaceOriginal || null,
            tipoArchivo: opciones.tipoArchivo || null
          },
          configuracion: {
            timeout: this.config.timeout,
            maxRetries: this.config.maxRetries,
            tiempoEspera: opciones.tiempoEspera || 3000
          },
          estadisticas: resultadoExtraccion.estadisticas
        }
      };
      
      // Guardar en archivo JSON
      const nombreArchivo = await this.guardarDatos(datosCompletos, nombreCarrera, opciones);
      
      this.log(`✅ Scraping real completado. ${resultadoExtraccion.cursos.length} cursos extraídos.`);
      this.log(`📊 Estrategia usada: ${resultadoExtraccion.estrategiaUsada}`);
      this.log(`💾 Datos guardados en: ${nombreArchivo}`);
      
      return datosCompletos;
      
    } finally {
      await page.close();
    }
  }



  /**
   * Extrae información general de la carrera con estrategias mejoradas
   * @param {Object} page - Página de Puppeteer
   * @param {Object} opciones - Opciones específicas
   * @returns {Object} Información de la carrera
   */
  async extraerInfoCarrera(page, opciones = {}) {
    // Cargar mapeo de facultades y escuelas
    const mapeo = await cargarMapeoFacultadEscuela();
    
    const infoBasica = await page.evaluate(() => {
      const info = {};
      
      // Buscar título de la página
      info.titulo = document.title || '';
      
      // Buscar información de facultad y escuela en el HTML (como fallback)
      const textoCompleto = document.body.textContent || '';
      const matchFacultad = textoCompleto.match(/FACULTAD[\s:]+([^\n]{1,100})/i);
      const matchEscuela = textoCompleto.match(/ESCUELA[\s:]+([^\n]{1,100})/i);
      
      info.facultadHTML = matchFacultad ? matchFacultad[1].trim() : '';
      info.escuelaHTML = matchEscuela ? matchEscuela[1].trim() : '';
      
      return info;
    });
    
    // Obtener nombre de la carrera desde opciones o desde el scraping
    const nombreCarrera = opciones.nombreCarrera || '';
    
    // Buscar información en el mapeo usando el nombre de la carrera
    let facultadInfo = null;
    let escuelaInfo = null;
    
    if (nombreCarrera && mapeo.mapeoFacultadEscuela[nombreCarrera]) {
      const mapeoCarrera = mapeo.mapeoFacultadEscuela[nombreCarrera];
      facultadInfo = {
        nombre: mapeoCarrera.facultad,
        codigo: mapeoCarrera.codigoFacultad,
        area: mapeoCarrera.area
      };
      escuelaInfo = {
        nombre: mapeoCarrera.escuela,
        codigo: mapeoCarrera.codigoEscuela
      };
    }
    
    return {
      ...infoBasica,
      facultad: facultadInfo ? facultadInfo.nombre : infoBasica.facultadHTML,
      codigoFacultad: facultadInfo ? facultadInfo.codigo : '',
      escuela: escuelaInfo ? escuelaInfo.nombre : infoBasica.escuelaHTML,
      codigoEscuela: escuelaInfo ? escuelaInfo.codigo : '',
      area: facultadInfo ? facultadInfo.area : '',
      fuenteInfo: facultadInfo ? 'mapeo_oficial' : 'extraccion_html'
    };
  }

  /**
   * Extrae cursos usando estrategias adaptativas
   */
  async extraerCursosAdaptativo(page, htmlCompleto = null, opciones = {}) {
    const estrategias = [
      { nombre: 'tabla_estructurada', metodo: () => this.extraerCursos(page) },
      { nombre: 'tabla_generica', metodo: () => this.extraerCursosTabla(page) },
      { nombre: 'elementos_divs', metodo: () => this.extraerCursosDivs(page) },
      { nombre: 'texto_completo', metodo: () => this.extraerCursosAlternativo(page) },
      { nombre: 'html_parsing', metodo: () => this.extraerCursosDesdeHTML(htmlCompleto) }
    ];
    
    const estadisticas = {
      estrategiasIntentadas: [],
      tiempoTotal: 0,
      cursosEncontrados: 0
    };
    
    const inicioTiempo = Date.now();
    
    for (const estrategia of estrategias) {
      try {
        const inicioEstrategia = Date.now();
        this.log(`🔄 Probando estrategia: ${estrategia.nombre}`);
        
        const cursos = await estrategia.metodo();
        const tiempoEstrategia = Date.now() - inicioEstrategia;
        
        estadisticas.estrategiasIntentadas.push({
          nombre: estrategia.nombre,
          exito: cursos && cursos.length > 0,
          cursosEncontrados: cursos ? cursos.length : 0,
          tiempo: tiempoEstrategia
        });
        
        if (cursos && cursos.length > 0) {
          estadisticas.tiempoTotal = Date.now() - inicioTiempo;
          estadisticas.cursosEncontrados = cursos.length;
          
          this.log(`✅ Estrategia ${estrategia.nombre} exitosa: ${cursos.length} cursos`);
          
          return {
            cursos: this.procesarCursosExtraidos(cursos),
            estrategiaUsada: estrategia.nombre,
            estadisticas
          };
        }
        
        this.log(`⚠️ Estrategia ${estrategia.nombre} no encontró cursos`);
        
      } catch (error) {
        this.log(`❌ Error en estrategia ${estrategia.nombre}: ${error.message}`);
        estadisticas.estrategiasIntentadas.push({
          nombre: estrategia.nombre,
          exito: false,
          error: error.message,
          tiempo: Date.now() - inicioEstrategia
        });
      }
    }
    
    estadisticas.tiempoTotal = Date.now() - inicioTiempo;
    
    return {
      cursos: [],
      estrategiaUsada: 'ninguna',
      estadisticas
    };
  }

  /**
   * Procesa y limpia los cursos extraídos
   */
  procesarCursosExtraidos(cursos) {
    return cursos.map((curso, index) => {
      // Filtrar horarios válidos
      const horariosLimpios = Array.isArray(curso.horarios) ? 
        curso.horarios.filter(horario => {
          // Validar que el horario tenga estructura correcta
          return horario && 
                 typeof horario === 'object' &&
                 horario.dia && 
                 horario.horario &&
                 !['Docente', 'Dia', 'Horario', 'Tipo'].includes(horario.dia) &&
                 /^[A-Z]{2}$/.test(horario.dia) &&
                 /^\[\d{2}-\d{2}\]$/.test(horario.horario);
        }) : [];
      
      // Filtrar docentes válidos
      const docentesLimpios = Array.isArray(curso.docentes) ? 
        curso.docentes.filter(docente => {
          return docente && 
                 typeof docente === 'string' &&
                 docente.length > 2 &&
                 !['Docente', 'Dia', 'Horario', 'Tipo'].includes(docente) &&
                 !/^[A-Z]{2,4}\d{2,4}/.test(docente);
        }) : [];
      
      // Filtrar aulas válidas
      const aulasLimpias = Array.isArray(curso.aulas) ? 
        curso.aulas.filter(aula => {
          return aula && 
                 typeof aula === 'string' &&
                 aula.length > 0 &&
                 !['Docente', 'Dia', 'Horario', 'Tipo', 'Aula'].includes(aula);
        }) : [];
      
      // Procesar horarios para facilitar la generación de horarios
      const horariosParaHorario = this.procesarHorariosParaGeneracion(horariosLimpios);
      
      // Determinar si es curso obligatorio o electivo
      const esObligatorio = this.determinarTipoCurso(curso.tipo, curso.nombre);
      
      // Calcular duración total semanal
      const duracionSemanal = this.calcularDuracionSemanal(horariosLimpios);
      
      return {
        // Información básica del curso
        id: `${curso.codigo}_${index + 1}`,
        codigo: this.limpiarTexto(curso.codigo || ''),
        nombre: this.limpiarTexto(curso.nombre || ''),
        creditos: parseInt(curso.creditos) || 0,
        tipo: this.limpiarTexto(curso.tipo || ''),
        
        // Información para generación de horarios
        esObligatorio: esObligatorio,
        duracionSemanal: duracionSemanal,
        
        // Horarios optimizados (solo los procesados)
        horarios: horariosParaHorario,
        
        // Recursos del curso (solo si no están vacíos)
        ...(docentesLimpios.length > 0 && { docentes: docentesLimpios }),
        ...(aulasLimpias.length > 0 && { aulas: aulasLimpias }),
        
        // Prioridad para algoritmos de horarios
        prioridad: this.calcularPrioridadCurso(curso)
      };
    });
  }

  /**
   * Procesa horarios para facilitar la generación de horarios de cursos
   */
  procesarHorariosParaGeneracion(horarios) {
    return horarios.map(horario => {
      const horaInicio = this.extraerHoraInicio(horario.horario);
      const horaFin = this.extraerHoraFin(horario.horario);
      const duracion = horaFin - horaInicio;
      
      return {
        ...horario,
        horaInicio: horaInicio,
        horaFin: horaFin,
        duracion: duracion,
        diaNumerico: this.convertirDiaANumero(horario.dia),
        bloqueHorario: `${horario.dia}_${horaInicio}_${horaFin}`,
        esMatutino: horaInicio < 12,
        esVespertino: horaInicio >= 12 && horaInicio < 18,
        esNocturno: horaInicio >= 18
      };
    });
  }
  
  /**
   * Extrae la hora de inicio del formato [HH-HH]
   */
  extraerHoraInicio(horarioTexto) {
    const match = horarioTexto.match(/\[(\d{2})-(\d{2})\]/);
    return match ? parseInt(match[1]) : 0;
  }
  
  /**
   * Extrae la hora de fin del formato [HH-HH]
   */
  extraerHoraFin(horarioTexto) {
    const match = horarioTexto.match(/\[(\d{2})-(\d{2})\]/);
    return match ? parseInt(match[2]) : 0;
  }
  
  /**
   * Convierte día de texto a número (LU=1, MA=2, etc.)
   */
  convertirDiaANumero(dia) {
    const dias = {
      'LU': 1, 'MA': 2, 'MI': 3, 'JU': 4, 'VI': 5, 'SA': 6, 'DO': 7
    };
    return dias[dia] || 0;
  }
  
  /**
   * Determina si un curso es obligatorio o electivo
   */
  determinarTipoCurso(tipo, nombre) {
    const tipoLower = (tipo || '').toLowerCase();
    const nombreLower = (nombre || '').toLowerCase();
    
    if (tipoLower.includes('obligatorio') || tipoLower.includes('required')) {
      return true;
    }
    if (tipoLower.includes('electivo') || tipoLower.includes('elective')) {
      return false;
    }
    
    // Heurística: cursos con códigos específicos suelen ser obligatorios
    return !nombreLower.includes('electivo') && !nombreLower.includes('opcional');
  }
  
  /**
   * Calcula la duración total semanal del curso
   */
  calcularDuracionSemanal(horarios) {
    return horarios.reduce((total, horario) => {
      const horaInicio = this.extraerHoraInicio(horario.horario);
      const horaFin = this.extraerHoraFin(horario.horario);
      return total + (horaFin - horaInicio);
    }, 0);
  }
  
  /**
   * Calcula la prioridad del curso para la generación de horarios
   */
  calcularPrioridadCurso(curso) {
    let prioridad = 50; // Prioridad base
    
    // Cursos obligatorios tienen mayor prioridad
    if (this.determinarTipoCurso(curso.tipo, curso.nombre)) {
      prioridad += 30;
    }
    
    // Cursos con más créditos tienen mayor prioridad
    prioridad += (parseInt(curso.creditos) || 0) * 5;
    
    // Cursos con menos opciones de horario tienen mayor prioridad
    const numHorarios = Array.isArray(curso.horarios) ? curso.horarios.length : 0;
    if (numHorarios > 0) {
      prioridad += Math.max(0, 20 - numHorarios * 2);
    }
    
    return Math.min(100, Math.max(0, prioridad));
  }
  
  /**
   * Limpia y normaliza texto
   */
  limpiarTexto(texto) {
    if (!texto) return '';
    return texto.toString().trim().replace(/\s+/g, ' ');
  }

  /**
   * Extrae cursos desde HTML usando parsing directo
   */
  async extraerCursosDesdeHTML(html) {
    if (!html) return [];
    
    // Esta función parseará el HTML directamente para encontrar patrones
    // Implementación simplificada por ahora
    return [];
  }

  /**
   * Extrae cursos basado en análisis de estructura
   */
  async extraerCursosBasadoEnAnalisis(page, analisis) {
    if (!analisis || !analisis.estructuraTablas || analisis.estructuraTablas.length === 0) {
      return [];
    }
    
    // Usar el análisis para crear selectores más específicos
    return await page.evaluate((analisisData) => {
      const cursos = [];
      
      // Implementar extracción basada en el análisis de estructura
      // Por ahora, retornar array vacío
      
      return cursos;
    }, analisis);
  }

  /**
   * Guarda el HTML completo para análisis
   */
  async guardarHTML(html, nombreCarrera, opciones = {}) {
    try {
      const fecha = new Date().toISOString().split('T')[0];
      const timestamp = Date.now();
      const nombreLimpio = nombreCarrera.toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      
      // Incluir número de carrera si está disponible
      const prefijo = opciones.numeroCarrera ? 
        String(opciones.numeroCarrera).padStart(2, '0') + '_' : '';
      
      const nombreArchivo = `${prefijo}${nombreLimpio}_${fecha}_${timestamp}.html`;
      const directorioDestino = this.config.cleanupHTML ? this.tempDir : this.outputDir;
      const rutaArchivo = path.join(directorioDestino, nombreArchivo);
      
      await fs.writeFile(rutaArchivo, html, 'utf8');
      
      // Registrar archivo para limpieza posterior si es temporal
      if (this.config.cleanupHTML) {
        this.htmlFiles.add(rutaArchivo);
      }
      
      this.log(`💾 HTML guardado en: ${rutaArchivo}`);
      return rutaArchivo;
    } catch (error) {
      this.log(`⚠️ Error guardando HTML: ${error.message}`);
      return null;
    }
  }

  /**
   * Analiza la estructura de la página para debugging
   */
  async analizarEstructuraPagina(page) {
    try {
      const analisis = await page.evaluate(() => {
        const info = {
          totalTablas: document.querySelectorAll('table').length,
          totalFilas: document.querySelectorAll('tr').length,
          totalCeldas: document.querySelectorAll('td').length,
          elementosConTexto: [],
          estructuraTablas: []
        };
        
        // Analizar tablas
        const tablas = document.querySelectorAll('table');
        tablas.forEach((tabla, index) => {
          const filas = tabla.querySelectorAll('tr');
          info.estructuraTablas.push({
            tabla: index + 1,
            filas: filas.length,
            primeraFilaTexto: filas[0]?.textContent?.trim().substring(0, 100) || ''
          });
        });
        
        // Buscar elementos con texto relevante
        const elementos = document.querySelectorAll('*');
        elementos.forEach(el => {
          const texto = el.textContent?.trim() || '';
          if (texto.length > 10 && texto.length < 200) {
            if (texto.includes('curso') || texto.includes('código') || 
                texto.includes('crédito') || texto.includes('horario') ||
                /^[A-Z]{2,4}\d{2,4}/.test(texto)) {
              info.elementosConTexto.push({
                tag: el.tagName,
                texto: texto.substring(0, 100),
                clase: el.className || '',
                id: el.id || ''
              });
            }
          }
        });
        
        return info;
      });
      
      console.log('🔍 Análisis de estructura:', JSON.stringify(analisis, null, 2));
    } catch (error) {
      console.warn('⚠️ Error analizando estructura:', error.message);
    }
  }

  /**
   * Extrae cursos con estrategia completa
   * @param {Object} page - Página de Puppeteer
   * @returns {Array} Lista de cursos extraídos
   */
  async extraerCursosCompleto(page) {
    // Intentar múltiples estrategias de extracción
    const estrategias = [
      () => this.extraerCursos(page),
      () => this.extraerCursosTabla(page),
      () => this.extraerCursosDivs(page)
    ];
    
    for (const estrategia of estrategias) {
      try {
        const cursos = await estrategia();
        if (cursos && cursos.length > 0) {
          console.log(`✅ Estrategia exitosa: ${cursos.length} cursos encontrados`);
          return cursos;
        }
      } catch (error) {
        console.warn(`⚠️ Estrategia falló: ${error.message}`);
      }
    }
    
    return [];
  }

  /**
   * Extrae cursos usando estrategia de tabla específica
   */
  async extraerCursosTabla(page) {
    return await page.evaluate(() => {
      const cursos = [];
      const tablas = document.querySelectorAll('table');
      
      tablas.forEach(tabla => {
        const filas = tabla.querySelectorAll('tr');
        
        filas.forEach((fila, index) => {
          const celdas = fila.querySelectorAll('td');
          if (celdas.length >= 3) {
            const textos = Array.from(celdas).map(celda => celda.textContent?.trim() || '');
            
            // Buscar patrones de código de curso
            const posibleCodigo = textos.find(texto => /^[A-Z]{2,4}\d{2,4}/.test(texto));
            if (posibleCodigo) {
              // Buscar créditos de manera más específica (formato "01", "02", "03", "10", etc.)
              const creditosTexto = textos.find(t => /^0?[1-9]$|^1[0-5]$/.test(t));
              
              // Buscar tipo de curso de manera más específica (códigos CAT)
               const tipoTexto = textos.find(t => 
                 t === 'ESG' || t === 'ESP' || t === 'ELE' || 
                 t === 'OBL' || t === 'OPT' || t === 'EG' ||
                 t === 'FG' || t === 'FE' || t === 'PPP' ||
                 t === 'AFB' || t === 'AFE' || t === 'EEP' || t === 'AEC'
               );
               
               // Mapear códigos a nombres descriptivos
               const mapeoTipos = {
                 'ESG': 'Estudios Generales',
                 'EG': 'Estudios Generales',
                 'FG': 'Formación General',
                 'ESP': 'Especialidad',
                 'FE': 'Formación Especializada',
                 'ELE': 'Electivo',
                 'OBL': 'Obligatorio',
                 'OPT': 'Optativo',
                 'PPP': 'Prácticas Pre Profesionales',
                 'AFB': 'Área de Formación Básica',
                 'AFE': 'Área de Formación Especializada',
                 'EEP': 'Estudios Específicos y de Especialidad',
                 'AEC': 'Actividades de Extensión Cultural'
               };
              
              const curso = {
                numero: cursos.length + 1,
                codigo: posibleCodigo,
                 nombre: textos.find(t => t.length > 10 && t !== posibleCodigo) || '',
                 creditos: creditosTexto ? parseInt(creditosTexto) : 0,
                 tipo: tipoTexto ? (mapeoTipos[tipoTexto] || tipoTexto) : '',

                horarios: [],
                docentes: [],
                aulas: [],
                filaOriginal: index,
                datosOriginales: textos
              };
              
              cursos.push(curso);
            }
          }
        });
      });
      
      return cursos;
    });
  }

  /**
   * Extrae cursos usando divs y otros elementos
   */
  async extraerCursosDivs(page) {
    return await page.evaluate(() => {
      const cursos = [];
      const elementos = document.querySelectorAll('div, span, p');
      
      elementos.forEach(elemento => {
        const texto = elemento.textContent?.trim() || '';
        
        // Buscar códigos de curso
        const match = texto.match(/([A-Z]{2,4}\d{2,4})\s*[-:]?\s*(.+)/i);
        if (match) {
          const curso = {
            numero: cursos.length + 1,
            codigo: match[1],
            nombre: match[2]?.trim() || '',
            creditos: 0,
            tipo: '',
            
            horarios: [],
            docentes: [],
            aulas: [],
            elementoOriginal: elemento.tagName,
            textoOriginal: texto
          };
          
          cursos.push(curso);
        }
      });
      
      return cursos;
    });
  }

  /**
   * Extrae cursos con método alternativo
   */
  async extraerCursosAlternativo(page) {
    return await page.evaluate(() => {
      const cursos = [];
      const todoElTexto = document.body.textContent || '';
      
      // Buscar patrones de cursos en todo el texto
      const patrones = [
        /([A-Z]{2,4}\d{2,4})\s*[-:]?\s*([^\n]{10,100})/gi,
        /(\d+)\s*\.\s*([A-Z]{2,4}\d{2,4})\s*[-:]?\s*([^\n]{10,100})/gi
      ];
      
      patrones.forEach(patron => {
        let match;
        while ((match = patron.exec(todoElTexto)) !== null) {
          const curso = {
            numero: cursos.length + 1,
            codigo: match[2] || match[1],
            nombre: match[3] || match[2] || '',
            creditos: 0,
            tipo: '',
            
            horarios: [],
            docentes: [],
            aulas: [],
            metodoExtraccion: 'texto_completo'
          };
          
          // Evitar duplicados
          if (!cursos.find(c => c.codigo === curso.codigo)) {
            cursos.push(curso);
          }
        }
      });
      
      return cursos;
    });
  }

  /**
   * Extrae todos los cursos de la página (método original mejorado)
   * @param {Object} page - Página de Puppeteer
   * @returns {Array} Lista de cursos extraídos
   */
  async extraerCursos(page) {
    return await page.evaluate(() => {
      const cursos = [];
      
      // Función para limpiar texto
      const limpiarTexto = (texto) => {
        return texto ? texto.trim().replace(/\s+/g, ' ') : '';
      };
      
      // Función para validar si es un encabezado
      const esEncabezado = (texto) => {
        const encabezados = ['Docente', 'Dia', 'Horario', 'Tipo', 'Grupo', 'Aula'];
        return encabezados.includes(texto);
      };
      
      // Función para validar si es un código de curso válido
      const esCodigoCurso = (texto) => {
        return /^[A-Z]{2,4}\d{2,4}[A-Z]*$/.test(texto);
      };
      
      // Función para validar si es un día válido
      const esDiaValido = (texto) => {
        const dias = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];
        return dias.includes(texto);
      };
      
      // Función para validar si es un horario válido
      const esHorarioValido = (texto) => {
        return /^\[\d{2}-\d{2}\]$/.test(texto);
      };
      
      // Buscar todas las filas de la tabla
      const filas = document.querySelectorAll('tr');
      
      console.log(`Procesando ${filas.length} filas...`);
      
      for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const celdas = Array.from(fila.querySelectorAll('td'));
        
        // Verificar si la fila tiene la estructura de un curso
        // Estructura esperada: número, código, nombre, créditos, tipo
        if (celdas.length >= 3) {
          const numeroCurso = limpiarTexto(celdas[0]?.textContent || '');
          const codigoCurso = limpiarTexto(celdas[1]?.textContent || '');
          const nombreCurso = limpiarTexto(celdas[2]?.textContent || '');
          
          // Buscar créditos y tipo en todas las celdas de la fila
          let creditosCurso = '0';
          let tipoCurso = '';
          
          // Buscar créditos (formato "01", "02", "03", "10", etc.)
          for (let j = 3; j < celdas.length; j++) {
            const textoCelda = limpiarTexto(celdas[j]?.textContent || '');
            if (/^0?[1-9]$|^1[0-5]$/.test(textoCelda)) {
              creditosCurso = parseInt(textoCelda).toString();
              break;
            }
          }
          
          // Buscar tipo de curso en la columna CAT (ESG, ESP, EG, PPP, etc.)
          for (let j = 3; j < celdas.length; j++) {
            const textoCelda = limpiarTexto(celdas[j]?.textContent || '');
            if (textoCelda === 'ESG' || textoCelda === 'ESP' || textoCelda === 'ELE' || 
                textoCelda === 'OBL' || textoCelda === 'OPT' || textoCelda === 'EG' ||
                textoCelda === 'FG' || textoCelda === 'FE' || textoCelda === 'PPP' ||
                textoCelda === 'AFB' || textoCelda === 'AFE' || textoCelda === 'EEP' || textoCelda === 'AEC') {
              // Mapear códigos a nombres descriptivos
              const mapeoTipos = {
                'ESG': 'Estudios Generales',
                'EG': 'Estudios Generales',
                'FG': 'Formación General',
                'ESP': 'Especialidad',
                'FE': 'Formación Especializada',
                'ELE': 'Electivo',
                'OBL': 'Obligatorio',
                'OPT': 'Optativo',
                'PPP': 'Prácticas Pre Profesionales',
                'AFB': 'Área de Formación Básica',
                'AFE': 'Área de Formación Especializada',
                'EEP': 'Estudios Específicos y de Especialidad',
                'AEC': 'Área de Estudios Complementarios'
              };
              tipoCurso = mapeoTipos[textoCelda] || textoCelda;
              break;
            }
          }
          
          // Validar que sea una fila de curso válida
          if (numeroCurso && /^\d+$/.test(numeroCurso) && 
              codigoCurso && codigoCurso.length >= 3 &&
              nombreCurso && nombreCurso.length >= 3) {
            
            const curso = {
              numero: parseInt(numeroCurso),
              codigo: codigoCurso,
              nombre: nombreCurso,
              creditos: parseInt(creditosCurso) || 0,
              tipo: tipoCurso || '',
              
              horarios: [],
              docentes: [],
              aulas: []
            };
            
            // Buscar información adicional en las siguientes filas
            let filaInfo = i + 1;
            while (filaInfo < filas.length) {
              const filaAdicional = filas[filaInfo];
              const celdasAdicionales = Array.from(filaAdicional.querySelectorAll('td'));
              
              // Verificar si es el inicio de otro curso
              if (celdasAdicionales.length >= 4) {
                const siguienteNumero = limpiarTexto(celdasAdicionales[0]?.textContent || '');
                const siguienteCodigo = limpiarTexto(celdasAdicionales[1]?.textContent || '');
                
                // Si encontramos otro curso, salir del bucle
                if (/^\d+$/.test(siguienteNumero) && siguienteCodigo.length >= 3) {
                  break;
                }
              }
              
              // Si la siguiente fila tiene información de horarios/docentes
              if (celdasAdicionales.length >= 4) {
                const primeraCelda = limpiarTexto(celdasAdicionales[0]?.textContent || '');
                const segundaCelda = limpiarTexto(celdasAdicionales[1]?.textContent || '');
                const terceraCelda = limpiarTexto(celdasAdicionales[2]?.textContent || '');
                const cuartaCelda = limpiarTexto(celdasAdicionales[3]?.textContent || '');
                const quintaCelda = limpiarTexto(celdasAdicionales[4]?.textContent || '');
                const sextaCelda = limpiarTexto(celdasAdicionales[5]?.textContent || '');
                
                // Filtrar encabezados y datos inválidos
                if (esEncabezado(primeraCelda) || esEncabezado(segundaCelda) || 
                    esCodigoCurso(primeraCelda) || esCodigoCurso(segundaCelda)) {
                  filaInfo++;
                  continue;
                }
                
                // Validar si es información de horario válida
                if (esDiaValido(segundaCelda) && esHorarioValido(terceraCelda)) {
                  const docente = primeraCelda;
                  const dia = segundaCelda;
                  const horario = terceraCelda;
                  const tipoClase = cuartaCelda;
                  const grupo = quintaCelda;
                  const aula = sextaCelda;
                  
                  // Agregar docente si es válido
                  if (docente && docente.length > 2 && !curso.docentes.includes(docente)) {
                    curso.docentes.push(docente);
                  }
                  
                  // Agregar horario
                  curso.horarios.push({
                    dia: dia,
                    horario: horario,
                    tipo: tipoClase || '',
                    grupo: grupo || ''
                  });
                  
                  // Agregar aula si es válida
                  if (aula && aula.length > 0 && !curso.aulas.includes(aula)) {
                    curso.aulas.push(aula);
                  }
                  
                  filaInfo++;
                } else {
                  // Buscar información de plan curricular
                  const textoPlan = filaAdicional.textContent || '';
                  if (textoPlan.includes('PLAN CURRICULAR')) {
                    // Eliminado: planCurricular para evitar información basura
                    filaInfo++;
                  } else {
                    filaInfo++;
                  }
                }
              } else {
                filaInfo++;
              }
            }
            
            cursos.push(curso);
            console.log(`Curso extraído: ${curso.codigo} - ${curso.nombre}`);
          }
        }
      }
      
      console.log(`Total de cursos extraídos: ${cursos.length}`);
      return cursos;
    });
  }

  /**
   * Guarda los datos en un archivo JSON
   * @param {Object} datos - Datos a guardar
   * @param {string} nombreCarrera - Nombre de la carrera
   * @param {Object} opciones - Opciones que pueden incluir numeroCarrera
   * @returns {string} Ruta del archivo guardado
   */
  async guardarDatos(datos, nombreCarrera, opciones = {}) {
    try {
      // Crear directorio si no existe
      await fs.mkdir(this.outputDir, { recursive: true });
      
      // Generar nombre de archivo
      const fecha = new Date().toISOString().split('T')[0];
      const nombreLimpio = nombreCarrera.toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      
      // Incluir número de carrera si está disponible
      const prefijo = opciones.numeroCarrera ? 
        String(opciones.numeroCarrera).padStart(2, '0') + '_' : '';
      
      const nombreArchivo = `${prefijo}${nombreLimpio}_${fecha}.json`;
      const rutaArchivo = path.join(this.outputDir, nombreArchivo);
      
      // Guardar archivo
      await fs.writeFile(rutaArchivo, JSON.stringify(datos, null, 2), 'utf8');
      
      return rutaArchivo;
    } catch (error) {
      console.error('❌ ERROR guardando archivo:', error);
      throw error;
    }
  }

  /**
   * Scrapea múltiples carreras con configuración avanzada
   * @param {Array} carreras - Array de objetos {url, nombre, opciones?}
   * @param {Object} configGlobal - Configuración global para todas las carreras
   * @returns {Array} Resultados del scraping
   */
  async scrapearMultiplesCarreras(carreras, configGlobal = {}) {
    const resultados = [];
    const estadisticasGlobales = {
      inicioTiempo: Date.now(),
      carrerasExitosas: 0,
      carrerasFallidas: 0,
      totalCursos: 0,
      tiempoPromedioPorCarrera: 0
    };
    
    try {
      await this.initBrowser();
      this.log(`🚀 Iniciando scraping de ${carreras.length} carreras`);
      
      for (let i = 0; i < carreras.length; i++) {
        const carrera = carreras[i];
        const { url, nombre, opciones = {} } = carrera;
        const inicioCarrera = Date.now();
        
        try {
          this.log(`\n📚 [${i + 1}/${carreras.length}] Procesando: ${nombre}`);
          
          // Combinar opciones específicas con configuración global
          const opcionesFinales = { ...configGlobal, ...opciones };
          
          const resultado = await this.scrapearCarrera(url, nombre, opcionesFinales);
          const tiempoCarrera = Date.now() - inicioCarrera;
          
          estadisticasGlobales.carrerasExitosas++;
          estadisticasGlobales.totalCursos += resultado.cursos.length;
          
          resultados.push({
            nombre,
            url,
            exito: true,
            cursos: resultado.cursos.length,
            tiempoExtraccion: tiempoCarrera,
            estrategiaUsada: resultado.informacionGeneral.estrategiaExtraccion,
            datos: resultado
          });
          
          this.log(`✅ ${nombre} completado: ${resultado.cursos.length} cursos en ${tiempoCarrera}ms`);
          
          // Pausa entre carreras para evitar sobrecarga
          if (i < carreras.length - 1 && configGlobal.pausaEntreCarreras) {
            this.log(`⏳ Pausa de ${configGlobal.pausaEntreCarreras}ms...`);
            await new Promise(resolve => setTimeout(resolve, configGlobal.pausaEntreCarreras));
          }
          
        } catch (error) {
          const tiempoCarrera = Date.now() - inicioCarrera;
          estadisticasGlobales.carrerasFallidas++;
          
          this.log(`❌ Error procesando ${nombre}: ${error.message}`);
          resultados.push({
            nombre,
            url,
            exito: false,
            error: error.message,
            tiempoExtraccion: tiempoCarrera
          });
        }
      }
      
    } finally {
      await this.closeBrowser();
    }
    
    // Calcular estadísticas finales
    estadisticasGlobales.tiempoTotal = Date.now() - estadisticasGlobales.inicioTiempo;
    estadisticasGlobales.tiempoPromedioPorCarrera = estadisticasGlobales.tiempoTotal / carreras.length;
    
    this.log('\n📊 RESUMEN FINAL:');
    this.log(`✅ Carreras exitosas: ${estadisticasGlobales.carrerasExitosas}`);
    this.log(`❌ Carreras fallidas: ${estadisticasGlobales.carrerasFallidas}`);
    this.log(`📚 Total de cursos extraídos: ${estadisticasGlobales.totalCursos}`);
    this.log(`⏱️ Tiempo total: ${estadisticasGlobales.tiempoTotal}ms`);
    this.log(`📈 Tiempo promedio por carrera: ${Math.round(estadisticasGlobales.tiempoPromedioPorCarrera)}ms`);
    
    return {
      resultados,
      estadisticas: estadisticasGlobales,
      resumen: {
        total: carreras.length,
        exitosas: estadisticasGlobales.carrerasExitosas,
        fallidas: estadisticasGlobales.carrerasFallidas,
        cursosTotal: estadisticasGlobales.totalCursos
      }
    };
  }

  /**
   * Crea configuración predefinida para carreras de la UNSAAC
   */
  static crearConfiguracionUNSAAC(opciones = {}) {
    return {
      headless: opciones.headless ?? false,
      timeout: opciones.timeout ?? 60000,
      maxRetries: opciones.maxRetries ?? 3,
      cleanupHTML: opciones.cleanupHTML ?? true,
      saveHTML: opciones.saveHTML ?? false,
      verbose: opciones.verbose ?? true,
      pausaEntreCarreras: opciones.pausaEntreCarreras ?? 5000,
      tiempoEspera: opciones.tiempoEspera ?? 3000
    };
  }

  /**
   * Obtiene lista predefinida de carreras de la UNSAAC
   */
  static obtenerCarrerasUNSAAC() {
    return [
      {
        nombre: 'Antropologia',
        url: 'http://ccomputo.unsaac.edu.pe/index.php?op=catalog&dt=vCvqO09qWpsFXhbFxs',
        opciones: { tiempoEspera: 4000 }
      },
      // Agregar más carreras aquí según se vayan identificando
  ];
}

  /**
   * Genera un nombre de archivo único basado en la carrera
   * @param {string} nombreCarrera - Nombre de la carrera
   * @returns {string} Nombre del archivo
   */
  generarNombreArchivo(nombreCarrera) {
    const timestamp = new Date().toISOString().split('T')[0];
    const nombreLimpio = nombreCarrera
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
    
    return `${nombreLimpio}_${timestamp}.json`;
  }
}

/**
 * Clase para generar horarios de cursos usando los datos extraídos
 */
class GeneradorHorarios {
  constructor(cursos) {
    this.cursos = cursos || [];
    this.horariosGenerados = [];
  }

  /**
   * Genera todas las combinaciones posibles de horarios
   */
  generarCombinacionesHorarios(cursosSeleccionados = null) {
    const cursosAUsar = cursosSeleccionados || this.cursos;
    const combinaciones = [];
    
    // Ordenar cursos por prioridad (mayor prioridad primero)
    const cursosOrdenados = cursosAUsar.sort((a, b) => (b.prioridad || 0) - (a.prioridad || 0));
    
    this._generarCombinacionesRecursivo(cursosOrdenados, [], combinaciones);
    
    return combinaciones.map(combinacion => ({
      cursos: combinacion,
      conflictos: this.detectarConflictos(combinacion),
      creditosTotales: this.calcularCreditosTotales(combinacion),
      duracionSemanal: this.calcularDuracionTotal(combinacion),
      esValido: this.validarHorario(combinacion),
      puntuacion: this.calcularPuntuacionHorario(combinacion)
    })).sort((a, b) => b.puntuacion - a.puntuacion);
  }

  /**
   * Detecta conflictos de horario entre cursos
   */
  detectarConflictos(cursos) {
    const conflictos = [];
    
    for (let i = 0; i < cursos.length; i++) {
      for (let j = i + 1; j < cursos.length; j++) {
        const conflictosCursos = this.detectarConflictoEntreCursos(cursos[i], cursos[j]);
        if (conflictosCursos.length > 0) {
          conflictos.push({
            curso1: cursos[i].codigo,
            curso2: cursos[j].codigo,
            conflictos: conflictosCursos
          });
        }
      }
    }
    
    return conflictos;
  }

  /**
   * Detecta conflictos entre dos cursos específicos
   */
  detectarConflictoEntreCursos(curso1, curso2) {
    const conflictos = [];
    
    if (!curso1.horariosParaHorario || !curso2.horariosParaHorario) {
      return conflictos;
    }
    
    curso1.horariosParaHorario.forEach(horario1 => {
      curso2.horariosParaHorario.forEach(horario2 => {
        if (this.hayConflictoHorario(horario1, horario2)) {
          conflictos.push({
            horario1: horario1.bloqueHorario,
            horario2: horario2.bloqueHorario,
            dia: horario1.dia,
            solapamiento: this.calcularSolapamiento(horario1, horario2)
          });
        }
      });
    });
    
    return conflictos;
  }

  /**
   * Verifica si hay conflicto entre dos horarios
   */
  hayConflictoHorario(horario1, horario2) {
    if (horario1.dia !== horario2.dia) {
      return false;
    }
    
    return !(horario1.horaFin <= horario2.horaInicio || horario2.horaFin <= horario1.horaInicio);
  }

  /**
   * Calcula el solapamiento entre dos horarios
   */
  calcularSolapamiento(horario1, horario2) {
    if (!this.hayConflictoHorario(horario1, horario2)) {
      return 0;
    }
    
    const inicioSolapamiento = Math.max(horario1.horaInicio, horario2.horaInicio);
    const finSolapamiento = Math.min(horario1.horaFin, horario2.horaFin);
    
    return finSolapamiento - inicioSolapamiento;
  }

  /**
   * Calcula créditos totales de una combinación
   */
  calcularCreditosTotales(cursos) {
    return cursos.reduce((total, curso) => total + (curso.creditos || 0), 0);
  }

  /**
   * Calcula duración total semanal
   */
  calcularDuracionTotal(cursos) {
    return cursos.reduce((total, curso) => total + (curso.duracionSemanal || 0), 0);
  }

  /**
   * Valida si un horario es válido (sin conflictos)
   */
  validarHorario(cursos) {
    const conflictos = this.detectarConflictos(cursos);
    return conflictos.length === 0;
  }

  /**
   * Calcula puntuación de un horario
   */
  calcularPuntuacionHorario(cursos) {
    let puntuacion = 0;
    
    // Puntos por créditos
    puntuacion += this.calcularCreditosTotales(cursos) * 10;
    
    // Puntos por cursos obligatorios
    const cursosObligatorios = cursos.filter(c => c.esObligatorio).length;
    puntuacion += cursosObligatorios * 20;
    
    // Penalización por conflictos
    const conflictos = this.detectarConflictos(cursos);
    puntuacion -= conflictos.length * 50;
    
    // Bonificación por distribución equilibrada
    const distribucion = this.analizarDistribucionHoraria(cursos);
    puntuacion += distribucion.equilibrio * 10;
    
    return Math.max(0, puntuacion);
  }

  /**
   * Analiza la distribución horaria de los cursos
   */
  analizarDistribucionHoraria(cursos) {
    const distribucionDias = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    const distribucionHoras = { matutino: 0, vespertino: 0, nocturno: 0 };
    
    cursos.forEach(curso => {
      if (curso.horariosParaHorario) {
        curso.horariosParaHorario.forEach(horario => {
          distribucionDias[horario.diaNumerico]++;
          if (horario.esMatutino) distribucionHoras.matutino++;
          else if (horario.esVespertino) distribucionHoras.vespertino++;
          else if (horario.esNocturno) distribucionHoras.nocturno++;
        });
      }
    });
    
    // Calcular equilibrio (menor varianza = mejor equilibrio)
    const valoresDias = Object.values(distribucionDias);
    const promedioDias = valoresDias.reduce((a, b) => a + b, 0) / valoresDias.length;
    const varianzaDias = valoresDias.reduce((acc, val) => acc + Math.pow(val - promedioDias, 2), 0) / valoresDias.length;
    const equilibrio = Math.max(0, 10 - varianzaDias);
    
    return {
      distribucionDias,
      distribucionHoras,
      equilibrio
    };
  }

  /**
   * Genera combinaciones recursivamente
   */
  _generarCombinacionesRecursivo(cursosRestantes, combinacionActual, todasLasCombinaciones, maxCombinaciones = 100) {
    if (todasLasCombinaciones.length >= maxCombinaciones) {
      return;
    }
    
    if (cursosRestantes.length === 0 || combinacionActual.length >= 8) {
      if (combinacionActual.length > 0) {
        todasLasCombinaciones.push([...combinacionActual]);
      }
      return;
    }
    
    const cursoActual = cursosRestantes[0];
    const restantes = cursosRestantes.slice(1);
    
    // Probar sin incluir el curso actual
    this._generarCombinacionesRecursivo(restantes, combinacionActual, todasLasCombinaciones, maxCombinaciones);
    
    // Probar incluyendo el curso actual (si no hay conflictos)
    const nuevaCombinacion = [...combinacionActual, cursoActual];
    if (this.validarHorario(nuevaCombinacion)) {
      this._generarCombinacionesRecursivo(restantes, nuevaCombinacion, todasLasCombinaciones, maxCombinaciones);
    }
  }

  /**
   * Exporta horarios a formato legible
   */
  exportarHorarios(combinaciones, formato = 'json') {
    if (formato === 'tabla') {
      return this.exportarComoTabla(combinaciones);
    }
    
    return JSON.stringify(combinaciones, null, 2);
  }

  /**
   * Exporta horarios como tabla visual
   */
  exportarComoTabla(combinaciones) {
    const dias = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];
    const horas = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 a 20:00
    
    return combinaciones.slice(0, 5).map((combinacion, index) => {
      const tabla = {};
      
      // Inicializar tabla
      dias.forEach(dia => {
        tabla[dia] = {};
        horas.forEach(hora => {
          tabla[dia][hora] = '';
        });
      });
      
      // Llenar tabla con cursos
      combinacion.cursos.forEach(curso => {
        if (curso.horariosParaHorario) {
          curso.horariosParaHorario.forEach(horario => {
            for (let h = horario.horaInicio; h < horario.horaFin; h++) {
              tabla[horario.dia][h] = `${curso.codigo} (${horario.tipo})`;
            }
          });
        }
      });
      
      return {
        numero: index + 1,
        puntuacion: combinacion.puntuacion,
        creditos: combinacion.creditosTotales,
        conflictos: combinacion.conflictos.length,
        tabla: tabla
      };
    });
  }
}

// Exportar la clase para uso como módulo
export default ScrapingCarrera;

// Exportar también la clase GeneradorHorarios
export { GeneradorHorarios };

// Ejecutar si es llamado directamente
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1].endsWith('ScrapingCarrera.js')) {
  const configuracion = {
    headless: false,
    timeout: 30000,
    maxRetries: 3,
    verbose: true,
    outputDir: '../data',
    saveHTML: true,
    cleanupHTML: false
  };

  const scraper = new ScrapingCarrera(configuracion);
  const url = 'http://ccomputo.unsaac.edu.pe/index.php?op=catalog&dt=vCvqO09qWpsFXhbFxs';
  const nombreCarrera = 'ANTROPOLOGÍA_MEJORADO';

  scraper.scrapearCarrera(url, nombreCarrera)
    .then(resultado => {
      console.log(`✅ Scraping completado: ${resultado.informacionGeneral.totalCursos} cursos`);
      console.log(`📊 Estrategia usada: ${resultado.informacionGeneral.estrategiaExtraccion}`);
      console.log(`📁 Archivo guardado con datos mejorados`);
    })
    .catch(console.error)
    .finally(() => scraper.closeBrowser());
}