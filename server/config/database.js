import { PrismaClient } from '@prisma/client';

/**
 * Configuración y conexión a la base de datos usando Prisma
 */
class Database {
  constructor() {
    this.prisma = null;
  }

  /**
   * Inicializar conexión a la base de datos
   */
  async connect() {
    try {
      this.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      });
      
      await this.prisma.$connect();
      console.log('✅ Conexión a la base de datos establecida');
      
      return this.prisma;
    } catch (error) {
      console.error('❌ Error conectando a la base de datos:', error);
      throw error;
    }
  }

  /**
   * Obtener instancia de Prisma
   */
  getPrisma() {
    if (!this.prisma) {
      throw new Error('Base de datos no inicializada. Llama a connect() primero.');
    }
    return this.prisma;
  }

  /**
   * Cerrar conexión a la base de datos
   */
  async disconnect() {
    if (this.prisma) {
      await this.prisma.$disconnect();
      console.log('🔌 Conexión a la base de datos cerrada');
    }
  }

  /**
   * Verificar estado de la conexión
   */
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}

// Instancia singleton
const database = new Database();

export default database;
export { Database };