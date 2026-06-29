# Proyecto-IngSoftware
# EcoRoute Logistic AI

## Prototipo funcional para Transportes Sur-Austral

## 1. Resumen del proyecto

EcoRoute Logistic AI es un prototipo web funcional desarrollado para apoyar la gestión logística de la empresa Transportes Sur-Austral. El sistema busca reemplazar procesos manuales como el uso de planillas Excel, llamadas telefónicas y registros desordenados, entregando una plataforma más clara, rápida y centralizada.

El prototipo permite registrar despachos, consultar envíos por número de guía, administrar trabajadores, gestionar vehículos, revisar rutas, visualizar alertas climáticas y monitorear el avance de los despachos mediante GPS simulado. Además, utiliza una base de datos local en el navegador para guardar la información ingresada durante las pruebas.

## 2. Objetivo del prototipo

El objetivo principal del prototipo es demostrar cómo una plataforma digital puede mejorar la trazabilidad de los despachos y la comunicación entre administradores, conductores y clientes.

La página no corresponde solo a una maqueta visual, ya que cada módulo tiene interacción real. El usuario puede ingresar datos, modificarlos, eliminarlos, consultarlos y visualizar los cambios directamente en pantalla mediante tablas, tarjetas, mensajes y notificaciones.

## 3. Tecnologías utilizadas

El prototipo fue desarrollado con tecnologías web básicas, ya que permiten crear una página funcional sin necesidad de instalar programas adicionales o levantar un servidor externo.

* **HTML:** estructura principal de la página y sus secciones.
* **CSS:** diseño visual, colores, tarjetas, formularios, tablas y adaptación a distintos tamaños de pantalla.
* **JavaScript:** lógica funcional, validaciones, navegación entre módulos, acciones de botones y conexión con la base de datos local.
* **IndexedDB:** base de datos local del navegador para guardar despachos, usuarios, vehículos, rutas, clima, notificaciones e historial de cambios.
* **Git y GitHub:** control de versiones, registro de cambios y trabajo colaborativo del equipo.

## 4. Estructura de archivos

El proyecto se organizó en tres archivos principales para facilitar la mantención y el orden del código:

```text
EcoRoute-Prototipo-Funcional/
│
├── index.html
├── styles.css
└── script.js
```

Esta separación permite que la estructura, el diseño y la lógica estén ordenados. Esto facilita futuras modificaciones, corrección de errores y explicación del prototipo durante la presentación.

## 5. Módulos implementados

### 5.1 Inicio

La página de inicio muestra un resumen general del sistema mediante tarjetas e indicadores. Se incluyeron datos como despachos registrados, vehículos disponibles, usuarios, rutas y alertas activas.

Esta vista fue diseñada para entregar una visión rápida del estado operativo de la empresa.

### 5.2 Gestión de despachos

Este módulo permite registrar nuevos despachos con datos como número de guía, cliente, origen, destino, conductor, vehículo, ruta y estado del envío.

También permite visualizar los despachos en una tabla dinámica, editar información, eliminar registros y cambiar el estado del despacho. Cada cambio se guarda en la base de datos local y genera una notificación visual.

### 5.3 Seguimiento de envíos

Este módulo está pensado para el cliente. Permite consultar un despacho mediante su número de guía.

Si la guía existe, el sistema muestra los datos principales del envío, como cliente, conductor, vehículo, ruta, estado y ubicación simulada. Si la guía no existe, se muestra un mensaje de error claro para evitar confusión.

### 5.4 Usuarios y trabajadores

Se agregó una sección para gestionar trabajadores de la empresa, como administradores, conductores y personal de apoyo.

Desde este módulo se pueden ingresar nuevos usuarios, editar datos, eliminar registros y visualizar información relacionada con el rol, estado y disponibilidad de cada trabajador.

### 5.5 Vehículos

El módulo de vehículos permite administrar la flota disponible. Se pueden registrar vehículos con patente, tipo, capacidad, estado y conductor asignado.

Esta sección ayuda a representar cómo la empresa puede controlar mejor sus recursos logísticos y saber qué vehículos están disponibles, en ruta o en mantención.

### 5.6 Rutas

El módulo de rutas permite crear y revisar rutas logísticas. Cada ruta puede tener origen, destino, distancia, tiempo estimado y estado operativo.

También se incluyó la posibilidad de asignar rutas a despachos, lo que permite relacionar la información logística con el seguimiento del envío.

### 5.7 Clima

La sección de clima muestra alertas simuladas relacionadas con riesgos en ruta, como escarcha, lluvia, viento o retrasos por condiciones climáticas.

Este módulo fue agregado porque las rutas hacia zonas australes pueden verse afectadas por factores climáticos, por lo que es importante que el sistema entregue advertencias visibles al usuario.

### 5.8 Base de datos local

El prototipo incluye una sección para visualizar los datos almacenados en la base local. Desde ahí se puede revisar la información guardada, exportar datos en formato JSON, importar información y reiniciar la base.

Esto permite demostrar que la página no solo muestra datos fijos, sino que también almacena y recupera información ingresada por el usuario.

## 6. Decisiones de diseño

El diseño visual fue creado con una interfaz moderna, clara y ordenada. Se utilizaron tarjetas, tablas, botones, formularios y mensajes visuales para que el usuario pueda entender rápidamente qué acción debe realizar.

Los colores principales fueron seleccionados con una intención específica:

* **Azul:** representa tecnología, confianza y gestión digital.
* **Verde:** se asocia con rutas, avance correcto y operaciones exitosas.
* **Amarillo/Naranjo:** se usa para advertencias, alertas climáticas o estados pendientes.
* **Rojo:** se utiliza para errores, eliminación de datos o situaciones críticas.
* **Blanco y gris claro:** permiten mantener una interfaz limpia y fácil de leer.

La forma de la página se basa en módulos separados para que cada función tenga su propio espacio. Esto mejora la usabilidad, ya que el usuario no ve toda la información mezclada, sino organizada por áreas: despachos, seguimiento, usuarios, vehículos, rutas, clima y base de datos.

## 7. Funcionalidades principales

El prototipo final incluye las siguientes funcionalidades:

* Registro de despachos.
* Edición y eliminación de despachos.
* Cambio de estado del envío.
* Consulta de envío por número de guía.
* Monitoreo GPS simulado.
* Gestión de usuarios y trabajadores.
* Gestión de vehículos.
* Gestión de rutas.
* Alertas climáticas simuladas.
* Notificaciones visuales automáticas.
* Almacenamiento de datos en IndexedDB.
* Exportación e importación de datos.
* Visualización de información guardada.
* Validación de campos obligatorios.
* Diseño adaptable a distintos tamaños de pantalla.

## 8. Calidad aplicada al prototipo

Para la calidad del prototipo se aplicaron criterios relacionados con ISO 9126 e ISO 25000.

En funcionalidad, cada módulo cumple una acción específica dentro del sistema. En usabilidad, se utilizaron textos claros, botones visibles, colores diferenciados y mensajes de confirmación. En confiabilidad, se aplicaron validaciones para evitar registros incompletos. En rendimiento, las funciones responden rápidamente porque trabajan con datos locales. En mantenibilidad, el código se separó en archivos distintos para facilitar futuras mejoras.

## 9. Control de versiones

El desarrollo del prototipo se organizó mediante versiones para simular un avance progresivo del proyecto. Cada commit representa una mejora o módulo implementado.

Ejemplo de versiones utilizadas:

* **v0.1:** creación de estructura base del prototipo.
* **v0.2:** implementación del diseño visual general.
* **v0.5:** desarrollo del módulo de gestión de despachos.
* **v0.8:** creación del módulo de usuarios y trabajadores.
* **v1.0:** desarrollo del módulo de vehículos.
* **v1.2:** implementación de rutas logísticas.
* **v1.4:** integración del módulo de clima y alertas.
* **v1.6:** incorporación del GPS simulado y notificaciones.
* **v2.0:** versión final del prototipo funcional.

Este control permite demostrar que el sistema fue construido de forma incremental, ordenada y colaborativa.

## 10. Cómo ejecutar el prototipo

Para ejecutar el proyecto no se necesita instalar dependencias.

Pasos:

1. Descargar o clonar el repositorio.
2. Abrir la carpeta del proyecto.
3. Ejecutar el archivo `index.html` en Google Chrome, Microsoft Edge o Mozilla Firefox.
4. Probar los módulos ingresando datos, editando registros y consultando envíos.

Los datos quedarán guardados en la base local del navegador mediante IndexedDB.

## 11. Integrantes del equipo

* Elías Cárcamo
* Ignacio Martínez
* Sebastián Pérez
* Felipe Ojeda

## 12. Conclusión

El prototipo EcoRoute Logistic AI permite demostrar una solución digital funcional para mejorar la gestión logística de Transportes Sur-Austral. La página centraliza información, reduce la dependencia de registros manuales y permite visualizar de forma clara el estado de despachos, trabajadores, vehículos, rutas y alertas climáticas.

Las decisiones de diseño y desarrollo fueron tomadas para lograr una interfaz fácil de usar, ordenada y coherente con las necesidades del caso. Además, la incorporación de almacenamiento local, validaciones, notificaciones y control de versiones permite evidenciar un prototipo más completo y alineado con la ingeniería de software.
