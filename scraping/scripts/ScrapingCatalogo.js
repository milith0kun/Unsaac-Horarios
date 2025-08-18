/* eslint-env node */
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script para scrapear la página principal del catálogo de UNSAAC
 * Extrae enlaces y datos de todas las carreras disponibles
 */
class ScrapingCatalogo {
  constructor(config = {}) {
    this.browser = null;
    this.outputDir = path.join(__dirname, '..', 'data');
    this.config = {
      headless: config.headless ?? false,
      timeout: config.timeout ?? 30000,
      verbose: config.verbose ?? true,
      saveHTML: config.saveHTML ?? true,
      ...config
    };
  }

  /**
   * Inicializa el browser
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
        '--disable-blink-features=AutomationControlled'
      ],
      ignoreDefaultArgs: ['--enable-automation'],
      ignoreHTTPSErrors: true,
      defaultViewport: null
    };

    try {
      this.browser = await puppeteer.launch(launchOptions);
      this.log('✅ Browser inicializado correctamente');
    } catch (error) {
      this.log(`❌ Error inicializando browser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cierra el browser
   */
  async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.log('✅ Browser cerrado correctamente');
      } catch (error) {
        this.log(`⚠️ Error cerrando browser: ${error.message}`);
      } finally {
        this.browser = null;
      }
    }
  }

  /**
   * Método de logging
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
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      this.log(`⚠️ Error creando directorios: ${error.message}`);
    }
  }

  /**
   * Función principal para scrapear el catálogo
   */
  async scrapearCatalogo(url = 'http://ccomputo.unsaac.edu.pe/?op=catalog') {
    await this.crearDirectorios();
    
    try {
      this.log('🚀 Iniciando scraping del catálogo UNSAAC');
      this.log(`📍 URL: ${url}`);
      
      if (!this.browser) {
        await this.initBrowser();
      }

      const page = await this.browser.newPage();
      
      try {
        // Configurar página
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        page.setDefaultTimeout(this.config.timeout);
        page.setDefaultNavigationTimeout(this.config.timeout);
        
        // Configurar headers adicionales
        await page.setExtraHTTPHeaders({
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        });
        
        // Interceptar y permitir todas las requests
        await page.setRequestInterception(true);
        page.on('request', (request) => {
          request.continue();
        });
        
        // Navegar a la página
        this.log('📄 Navegando a la página del catálogo...');
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        // Esperar carga
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Guardar HTML si está configurado
        if (this.config.saveHTML) {
          const htmlCompleto = await page.content();
          await this.guardarHTML(htmlCompleto, 'catalogo_unsaac');
        }
        
        // Extraer datos del catálogo
        this.log('📊 Extrayendo datos del catálogo...');
        const datosExtraidos = await this.extraerDatosCatalogo(page);
        
        // Estructurar datos completos
        const datosCompletos = {
          informacionGeneral: {
            url: url,
            fechaExtraccion: new Date().toISOString(),
            totalCarreras: datosExtraidos.carreras.length,
            tipoExtraccion: 'real',
            titulo: datosExtraidos.titulo || 'Catálogo UNSAAC'
          },
          carreras: datosExtraidos.carreras,
          metadatos: {
            timestamp: Date.now(),
            configuracion: {
              timeout: this.config.timeout,
              saveHTML: this.config.saveHTML
            }
          }
        };
        
        // Guardar datos
        const nombreArchivo = await this.guardarDatos(datosCompletos, 'catalogo_unsaac');
        
        this.log(`✅ Scraping completado. ${datosExtraidos.carreras.length} carreras extraídas.`);
        this.log(`💾 Datos guardados en: ${nombreArchivo}`);
        
        return datosCompletos;
        
      } finally {
        await page.close();
      }
      
    } catch (error) {
      this.log(`❌ Error durante el scraping: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrae datos del catálogo usando múltiples estrategias
   */
  async extraerDatosCatalogo(page) {
    return await page.evaluate(() => {
      const datos = {
        titulo: '',
        carreras: []
      };
      
      // Extraer título
      datos.titulo = document.title || '';
      
      // Estrategia 1: Buscar tabla con carreras
      const tabla = document.querySelector('table');
      if (tabla) {
        const filas = tabla.querySelectorAll('tr');
        
        filas.forEach((fila, index) => {
          const celdas = fila.querySelectorAll('td');
          if (celdas.length >= 3) {
            const numero = celdas[0]?.textContent?.trim();
            const nombre = celdas[1]?.textContent?.trim();
            const enlaceElement = celdas[2]?.querySelector('a');
            
            if (numero && nombre && enlaceElement) {
              const href = enlaceElement.getAttribute('href');
              let urlCompleta = '';
              
              if (href) {
                if (href.startsWith('http')) {
                  urlCompleta = href;
                } else if (href.startsWith('?')) {
                  urlCompleta = `http://ccomputo.unsaac.edu.pe/index.php${href}`;
                } else {
                  urlCompleta = `http://ccomputo.unsaac.edu.pe/${href}`;
                }
              }
              
              datos.carreras.push({
                numero: parseInt(numero) || index + 1,
                nombre: nombre,
                enlace: urlCompleta,
                enlaceOriginal: href,
                tipoArchivo: enlaceElement.textContent?.trim() || 'Ver'
              });
            }
          }
        });
      }
      
      // Estrategia 2: Si no se encontraron carreras, buscar enlaces directamente
      if (datos.carreras.length === 0) {
        const enlaces = document.querySelectorAll('a[href*="catalog"], a[href*="dt="]');
        
        enlaces.forEach((enlace, index) => {
          const href = enlace.getAttribute('href');
          const texto = enlace.textContent?.trim();
          
          if (href && texto) {
            let urlCompleta = '';
            
            if (href.startsWith('http')) {
              urlCompleta = href;
            } else if (href.startsWith('?')) {
              urlCompleta = `http://ccomputo.unsaac.edu.pe/index.php${href}`;
            } else {
              urlCompleta = `http://ccomputo.unsaac.edu.pe/${href}`;
            }
            
            datos.carreras.push({
              numero: index + 1,
              nombre: texto,
              enlace: urlCompleta,
              enlaceOriginal: href,
              tipoArchivo: 'Enlace'
            });
          }
        });
      }
      
      // Estrategia 3: Buscar texto que contenga nombres de carreras
      if (datos.carreras.length === 0) {
        const textoCompleto = document.body.textContent || '';
        const _lineas = textoCompleto.split('\n');
        
        const patronesCarreras = [
          /\d+\s*([A-ZÁÉÍÓÚÑ\s]+)\s*Ver/gi,
          /([A-ZÁÉÍÓÚÑ\s]{10,})\s*XLS/gi
        ];
        
        patronesCarreras.forEach(patron => {
          let match;
          while ((match = patron.exec(textoCompleto)) !== null) {
            const nombre = match[1]?.trim();
            if (nombre && nombre.length > 5) {
              datos.carreras.push({
                numero: datos.carreras.length + 1,
                nombre: nombre,
                enlace: '',
                enlaceOriginal: '',
                tipoArchivo: 'Detectado por patrón'
              });
            }
          }
        });
      }
      
      return datos;
    });
  }

  /**
   * Guarda el HTML completo
   */
  async guardarHTML(html, nombreBase) {
    try {
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `${nombreBase}_${fecha}.html`;
      const rutaArchivo = path.join(this.outputDir, nombreArchivo);
      
      await fs.writeFile(rutaArchivo, html, 'utf8');
      this.log(`💾 HTML guardado: ${nombreArchivo}`);
      
      return rutaArchivo;
    } catch (error) {
      this.log(`⚠️ Error guardando HTML: ${error.message}`);
      return null;
    }
  }

  /**
   * Guarda los datos en JSON
   */
  async guardarDatos(datos, nombreBase) {
    try {
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `${nombreBase}_${fecha}.json`;
      const rutaArchivo = path.join(this.outputDir, nombreArchivo);
      
      await fs.writeFile(rutaArchivo, JSON.stringify(datos, null, 2), 'utf8');
      
      return rutaArchivo;
    } catch (error) {
      this.log(`⚠️ Error guardando datos: ${error.message}`);
      throw error;
    }
  }
}

// Función principal
async function main() {
  const config = {
    headless: false,
    verbose: true,
    saveHTML: true,
    timeout: 30000
  };
  
  const scraper = new ScrapingCatalogo(config);
  
  try {
    console.log('🎓 UNSAAC Catálogo Scraper');
    console.log('=' .repeat(40));
    
    const url = 'http://ccomputo.unsaac.edu.pe/?op=catalog';
    const resultado = await scraper.scrapearCatalogo(url);
    
    console.log('\n📋 RESUMEN:');
    console.log(`- Total de carreras: ${resultado.informacionGeneral.totalCarreras}`);
    console.log(`- Fecha de extracción: ${resultado.informacionGeneral.fechaExtraccion}`);
    
    if (resultado.carreras.length > 0) {
      console.log('\n📚 CARRERAS ENCONTRADAS:');
      resultado.carreras.slice(0, 10).forEach(carrera => {
        console.log(`${carrera.numero}. ${carrera.nombre}`);
        if (carrera.enlace) {
          console.log(`   🔗 ${carrera.enlace}`);
        }
      });
      
      if (resultado.carreras.length > 10) {
        console.log(`   ... y ${resultado.carreras.length - 10} más`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
  } finally {
    await scraper.closeBrowser();
  }
}

// Exportar para uso como módulo
export default ScrapingCatalogo;
export { main };

// Ejecutar si se llama directamente
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  main().catch(error => {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  });
}

// Ejemplo de uso:
// node ScrapingCatalogo.js
// 
// Para uso programático:
// import ScrapingCatalogo from './ScrapingCatalogo.js';
// const scraper = new ScrapingCatalogo(config);
// const resultado = await scraper.scrapearCatalogo();