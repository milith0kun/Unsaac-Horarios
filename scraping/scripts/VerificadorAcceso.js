/* eslint-env node */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VerificadorAcceso {
    constructor(config = {}) {
        this.config = {
            timeout: config.timeout || 30000,
            maxConcurrent: config.maxConcurrent || 3,
            retryAttempts: config.retryAttempts || 2,
            delayBetweenRequests: config.delayBetweenRequests || 1000,
            saveResults: config.saveResults !== false,
            verbose: config.verbose !== false
        };
        this.browser = null;
        this.resultados = {
            exitosas: [],
            fallidas: [],
            estadisticas: {
                total: 0,
                exitosas: 0,
                fallidas: 0,
                tiempoTotal: 0
            }
        };
    }

    log(mensaje, tipo = 'info') {
        if (!this.config.verbose) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const prefijos = {
            info: '📋',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            progress: '🔄'
        };
        
        console.log(`${prefijos[tipo]} [${timestamp}] ${mensaje}`);
    }

    async inicializarBrowser() {
        this.log('Inicializando navegador...', 'progress');
        
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-field-trial-config',
                '--disable-ipc-flooding-protection'
            ],
            ignoreDefaultArgs: ['--enable-automation'],
            ignoreHTTPSErrors: true
        });
        
        this.log('Navegador inicializado correctamente', 'success');
    }

    async verificarEnlace(carrera, intentos = 0) {
        const page = await this.browser.newPage();
        
        try {
            // Configurar página
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            page.setDefaultTimeout(this.config.timeout);
            page.setDefaultNavigationTimeout(this.config.timeout);
            
            // Configurar headers
            await page.setExtraHTTPHeaders({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            });
            
            // Interceptar requests y manejar errores
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                try {
                    request.continue();
                // eslint-disable-next-line no-unused-vars
                } catch (_error) {
                    // Ignorar errores de request ya manejado
                }
            });
            
            // Manejar errores de página
            page.on('error', (error) => {
                this.log(`Error en página: ${error.message}`, 'warning');
            });
            
            page.on('pageerror', (error) => {
                this.log(`Error de página: ${error.message}`, 'warning');
            });
            
            const tiempoInicio = Date.now();
            
            // Navegar a la página
            const response = await page.goto(carrera.enlace, {
                waitUntil: 'networkidle2',
                timeout: this.config.timeout
            });
            
            const tiempoRespuesta = Date.now() - tiempoInicio;
            
            // Verificar respuesta
            if (!response.ok()) {
                throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
            }
            
            // Verificar contenido
            const titulo = await page.title();
            const contenidoTabla = await page.$('table');
            
            if (!contenidoTabla) {
                throw new Error('No se encontró tabla de cursos en la página');
            }
            
            // Contar filas de la tabla
            const filas = await page.$$eval('table tr', rows => rows.length);
            
            const resultado = {
                numero: carrera.numero,
                nombre: carrera.nombre,
                enlace: carrera.enlace,
                estado: 'exitosa',
                statusCode: response.status(),
                titulo: titulo,
                tiempoRespuesta: tiempoRespuesta,
                filasEncontradas: filas,
                timestamp: new Date().toISOString()
            };
            
            this.resultados.exitosas.push(resultado);
            this.log(`✓ ${carrera.nombre} - ${filas} filas - ${tiempoRespuesta}ms`, 'success');
            
            return resultado;
            
        } catch (error) {
            if (intentos < this.config.retryAttempts) {
                this.log(`Reintentando ${carrera.nombre} (intento ${intentos + 1}/${this.config.retryAttempts})`, 'warning');
                await page.close();
                await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenRequests * 2));
                return await this.verificarEnlace(carrera, intentos + 1);
            }
            
            const resultado = {
                numero: carrera.numero,
                nombre: carrera.nombre,
                enlace: carrera.enlace,
                estado: 'fallida',
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            this.resultados.fallidas.push(resultado);
            this.log(`✗ ${carrera.nombre} - Error: ${error.message}`, 'error');
            
            return resultado;
            
        } finally {
            try {
                if (page && !page.isClosed()) {
                    await page.close();
                }
            // eslint-disable-next-line no-unused-vars
            } catch (_error) {
                // Ignorar errores al cerrar página
            }
        }
    }

    async verificarTodasLasCarreras(catalogoPath) {
        const tiempoInicio = Date.now();
        
        try {
            // Leer archivo del catálogo
            this.log('Leyendo archivo del catálogo...', 'progress');
            const catalogoData = JSON.parse(fs.readFileSync(catalogoPath, 'utf8'));
            const carreras = catalogoData.carreras;
            
            this.resultados.estadisticas.total = carreras.length;
            this.log(`Total de carreras a verificar: ${carreras.length}`, 'info');
            
            // Inicializar browser
            await this.inicializarBrowser();
            
            // Procesar carreras en lotes
            const lotes = [];
            for (let i = 0; i < carreras.length; i += this.config.maxConcurrent) {
                lotes.push(carreras.slice(i, i + this.config.maxConcurrent));
            }
            
            this.log(`Procesando en ${lotes.length} lotes de máximo ${this.config.maxConcurrent} carreras`, 'info');
            
            for (let i = 0; i < lotes.length; i++) {
                const lote = lotes[i];
                this.log(`Procesando lote ${i + 1}/${lotes.length} (${lote.length} carreras)`, 'progress');
                
                // Procesar lote en paralelo
                const promesasLote = lote.map(carrera => this.verificarEnlace(carrera));
                await Promise.all(promesasLote);
                
                // Pausa entre lotes
                if (i < lotes.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenRequests));
                }
            }
            
            // Calcular estadísticas
            this.resultados.estadisticas.exitosas = this.resultados.exitosas.length;
            this.resultados.estadisticas.fallidas = this.resultados.fallidas.length;
            this.resultados.estadisticas.tiempoTotal = Date.now() - tiempoInicio;
            
            // Mostrar resumen
            this.mostrarResumen();
            
            // Guardar resultados
            if (this.config.saveResults) {
                await this.guardarResultados();
            }
            
            return this.resultados;
            
        } catch (error) {
            this.log(`Error durante la verificación: ${error.message}`, 'error');
            throw error;
        } finally {
            if (this.browser) {
                try {
                    await this.browser.close();
                    this.log('Navegador cerrado', 'info');
                // eslint-disable-next-line no-unused-vars
                } catch (_error) {
                    this.log('Error al cerrar navegador (ignorado)', 'warning');
                }
            }
        }
    }

    mostrarResumen() {
        const stats = this.resultados.estadisticas;
        const porcentajeExito = ((stats.exitosas / stats.total) * 100).toFixed(1);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE VERIFICACIÓN DE ACCESO');
        console.log('='.repeat(60));
        console.log(`📋 Total de carreras verificadas: ${stats.total}`);
        console.log(`✅ Exitosas: ${stats.exitosas} (${porcentajeExito}%)`);
        console.log(`❌ Fallidas: ${stats.fallidas} (${(100 - porcentajeExito).toFixed(1)}%)`);
        console.log(`⏱️  Tiempo total: ${(stats.tiempoTotal / 1000).toFixed(1)}s`);
        console.log(`⚡ Promedio por carrera: ${(stats.tiempoTotal / stats.total / 1000).toFixed(1)}s`);
        
        if (this.resultados.fallidas.length > 0) {
            console.log('\n❌ CARRERAS CON PROBLEMAS:');
            this.resultados.fallidas.forEach(carrera => {
                console.log(`   ${carrera.numero}. ${carrera.nombre}`);
                console.log(`      Error: ${carrera.error}`);
                console.log(`      URL: ${carrera.enlace}`);
            });
        }
        
        console.log('='.repeat(60));
    }

    async guardarResultados() {
        const timestamp = new Date().toISOString().split('T')[0];
        const nombreArchivo = `verificacion_acceso_${timestamp}.json`;
        const rutaArchivo = path.join(__dirname, '..', 'data', nombreArchivo);
        
        // Asegurar que el directorio existe
        const dirData = path.dirname(rutaArchivo);
        if (!fs.existsSync(dirData)) {
            fs.mkdirSync(dirData, { recursive: true });
        }
        
        // Preparar datos para guardar
        const datosCompletos = {
            informacionGeneral: {
                fechaVerificacion: new Date().toISOString(),
                configuracion: this.config,
                version: '1.0.0'
            },
            estadisticas: this.resultados.estadisticas,
            resultadosExitosos: this.resultados.exitosas,
            resultadosFallidos: this.resultados.fallidas
        };
        
        fs.writeFileSync(rutaArchivo, JSON.stringify(datosCompletos, null, 2), 'utf8');
        this.log(`Resultados guardados en: ${rutaArchivo}`, 'success');
        
        return rutaArchivo;
    }

    // Método estático para uso rápido
    static async verificarCatalogo(catalogoPath, config = {}) {
        const verificador = new VerificadorAcceso(config);
        return await verificador.verificarTodasLasCarreras(catalogoPath);
    }
}

// Función principal para uso por línea de comandos
async function main() {
    try {
        console.log('🔍 VERIFICADOR DE ACCESO UNSAAC');
        console.log('========================================');
        
        // Configuración
        const config = {
            timeout: 30000,
            maxConcurrent: 2, // Reducido para evitar sobrecarga
            retryAttempts: 2,
            delayBetweenRequests: 2000,
            saveResults: true,
            verbose: true
        };
        
        // Ruta del catálogo
        const catalogoPath = path.join(__dirname, '..', 'data', 'catalogo_unsaac_2025-08-15.json');
        
        if (!fs.existsSync(catalogoPath)) {
            throw new Error(`No se encontró el archivo del catálogo: ${catalogoPath}`);
        }
        
        // Ejecutar verificación
        const resultados = await VerificadorAcceso.verificarCatalogo(catalogoPath, config);
        
        // Mostrar resultado final
        const porcentajeExito = (resultados.estadisticas.exitosas / resultados.estadisticas.total * 100).toFixed(1);
        console.log(`\n🎯 VERIFICACIÓN COMPLETADA: ${porcentajeExito}% de éxito`);
        
        process.exit(resultados.estadisticas.fallidas > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('❌ Error durante la verificación:', error.message);
        process.exit(1);
    }
}

// Exportar clase y función principal
export { VerificadorAcceso, main };

// Ejecutar directamente
main().catch(error => {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
});