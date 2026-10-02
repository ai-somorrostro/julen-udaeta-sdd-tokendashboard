# Especificación SDD: Feature 3 (Vista de Detalle)

## 1. Requisitos del Sistema
- **Sin dependencias externas:** Todo nativo (HTML5, CSS3, Vanilla JS).
- **Sin tests**.

## 2. Componentes de UI a Implementar
1. **Modal o Panel Lateral:**
   - Debe abrirse al hacer clic en cualquier fila de la tabla de modelos.
   - Incluir un botón de cierre (`X`) y permitir cerrar al hacer clic fuera (overlay) o pulsar `Esc`.
2. **Contenido Extendidos del Modelo:**
   - Mostrar todas las métricas en formato extendido (Nombre, Precios Entrada/Salida, TTFT, Modalidades Entrada/Salida, Consumo Diario y Semanal).
3. **Gráficas Individuales:**
   - Generar gráficas nativas específicas (Canvas/SVG) exclusivas para el modelo seleccionado (ej. distribución de precios, desglose de consumo diario vs semanal).