# Clubracer · Relative para iRacing

Overlay web con fondo transparente, pilotos cercanos en pista y tu auto resaltado. Incluye posición de carrera, número de auto, bandera de nacionalidad, nombre y apellido y diferencia en segundos.

## Desarrollo

Requisitos: Python 3 y Node.js 18 o superior. Sin dependencias externas.

```sh
cd /workspace/Clubracer
npm test
npm run dev
```

El servidor usa el puerto 5173. Abrir `index.html` a través del servidor muestra **DEMO** con datos ficticios. Para OBS local, agregar una fuente de navegador apuntando al servidor, tamaño sugerido 590 × 510. El fondo es transparente.

## Ventana transparente en Windows

Instalar Python 3.11 o 3.12 de 64 bits y ejecutar `windows/start.bat`. El lanzador instala PySide6 y pyirsdk en un entorno virtual local, abre una ventana sin bordes siempre visible y consulta iRacing cuatro veces por segundo. Usar iRacing en modo ventana sin bordes; la superposición no está garantizada en pantalla completa exclusiva. Con la ventana enfocada: `Ctrl+M` inicia el movimiento con el mouse y `Esc` la cierra. La ventana recibe clics (no tiene modo click-through).

El lanzador requiere Windows; su ejecución con el simulador no fue validada desde el entorno Linux. Hasta que iRacing publique tiempos de vuelta válidos se muestra solamente tu auto. Los gaps son **estimaciones** de la distancia porcentual en pista multiplicada por el mejor tiempo de vuelta disponible; no representan una medición exacta y pueden desviarse en sectores de distinta velocidad. Los nombres se separan en el primer espacio para conservar el nombre completo.

Para banderas, crear opcionalmente `windows/countries.json` con un mapa de ID de usuario de iRacing a código ISO, por ejemplo `{"123456": "AR"}`. No se inventa nacionalidad a partir del club. Qt/Windows puede necesitar una fuente con soporte para emojis de bandera para dibujarlas como imágenes.

## Proveedor WebSocket alternativo

El frontend también acepta un puente externo que publique JSON mediante WebSocket, para usar una fuente de gaps más precisa. El lanzador Windows incluido usa el SDK local y entrega los datos directamente a la interfaz.

Con un puente compatible, usar `?ws=ws%3A%2F%2F127.0.0.1%3A8765`. Envía mensajes completos con este formato:

```json
{
  "playerId": "42",
  "drivers": [
    {"id":"19","position":3,"number":"07","countryCode":"BR","firstName":"Rafael","lastName":"Costa","gapSeconds":-1.25},
    {"id":"42","position":4,"number":"21","countryCode":"AR","firstName":"Nicolás","lastName":"Fernández","gapSeconds":0},
    {"id":"63","position":5,"number":"8","countryCode":"ES","firstName":"Alejandro","lastName":"Martín","gapSeconds":2.5}
  ]
}
```

Los IDs deben ser únicos y del mismo tipo. `gapSeconds` negativo significa delante de tu auto en pista; positivo, detrás. El puente debe calcular diferencias relativas en pista, incluso para autos doblados, en lugar de diferencias respecto al líder. Se muestran hasta tres autos delante y tres detrás. La posición de carrera no determina el orden del relative.

`countryCode` usa ISO 3166-1 de dos letras. Si el proveedor no conoce la nacionalidad, omitirlo: no se deduce del club regional de iRacing. La representación gráfica de banderas depende de las fuentes del sistema.

El overlay reconecta cuando pierde conexión y atenúa los últimos datos después de cinco segundos sin actualizaciones. Con WebSocket configurado no se muestran datos de demostración.
