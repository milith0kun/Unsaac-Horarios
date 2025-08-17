# Guía de Despliegue - UNSAAC Horarios

Esta guía te llevará paso a paso para desplegar tu aplicación de horarios UNSAAC en Vercel usando GitHub.

## Prerrequisitos

- Tener Git instalado en tu sistema
- Tener una cuenta en GitHub
- Tener una cuenta en Vercel
- El proyecto debe estar funcionando localmente

## Paso 1: Configurar Git y Conectar con GitHub

### 1.1 Inicializar repositorio Git local (si no existe)

```bash
git init
```

### 1.2 Configurar Git (si es la primera vez)

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

### 1.3 Agregar archivos al repositorio

```bash
# Agregar todos los archivos
git add .

# Hacer el primer commit
git commit -m "Initial commit: UNSAAC Horarios application"
```

### 1.4 Conectar con el repositorio remoto

```bash
# Agregar el repositorio remoto
git remote add origin https://github.com/milith0kun/Unsaac-Horarios.git

# Verificar que se agregó correctamente
git remote -v
```

### 1.5 Hacer push al repositorio

```bash
# Hacer push de la rama main
git push -u origin main
```

**