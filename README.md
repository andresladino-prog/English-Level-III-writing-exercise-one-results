# Portal de resultados — English III Environmental Writing Task

Página web donde cada estudiante ingresa su correo institucional y su
código estudiantil, y ve **únicamente sus propios resultados**: el texto
que envió, la nota y la retroalimentación de cada uno de los 4 criterios
de la rúbrica, y la nota final.

## Cómo es distinto a tus otros proyectos

Este NO recibe envíos de estudiantes — tú ya calificaste los 24 textos
(los leí del Word que me compartiste) y esos resultados ya calificados
son los que se consultan aquí. Por eso el flujo es:

1. Tú importas los resultados a un Google Sheet (un solo paso, con el CSV
   que te dejo listo).
2. El backend (Apps Script) busca, por cada consulta, la fila que
   coincide con el correo Y el código enviados, y devuelve **solo esa
   fila**.
3. El estudiante nunca recibe ni ve el resto de la hoja.

### Diferencia con el portal de English IV

La estructura es prácticamente igual (nota + retroalimentación por
criterio, con barra de progreso). La única diferencia real es que este
documento fuente no trae un "comentario general" aparte del docente —
solo los 4 criterios calificados y la nota final.

## 🚨 MUY IMPORTANTE — léelo antes de publicar: 6 códigos estudiantiles necesitan verificación

Al extraer los datos del Word, encontré que **6 de los 24 códigos
estudiantiles** están guardados en notación científica de Excel (por
ejemplo `2.02328252E8` en vez de `202328252`). Esto pasa cuando alguien
pega una columna de códigos en Excel/Sheets y el programa la interpreta
como número en vez de texto, perdiendo el formato original.

Reconstruí el código completo a partir del número en notación científica
para 5 de los 6 casos, con **confianza alta** porque el valor guardado
tenía las 9 cifras significativas completas:

| # | Estudiante | Código original en el Word | Código reconstruido |
|---|---|---|---|
| 06 | LUCIANO TUTA HERNANDEZ | `2.02328252E8` | `202328252` |
| 11 | EDINSON MEZU LOZANO | `2.02437721E8` | `202437721` |
| 12 | EDWAR ANTONIO ZAPATA LONDOÑO | `2.02521374E8` | `202521374` |
| 23 | SARA IZTMENA RINCON MORALES | `2.01923416E8` | `201923416` |
| 24 | Sofia Molina Sanchez | `2.02415636E8` | `202415636` |

**El sexto caso es distinto y no lo puedo confirmar con certeza:**

| # | Estudiante | Código original en el Word | Código reconstruido | Problema |
|---|---|---|---|---|
| 13 | JUAN ALEJANDRO NARVAEZ ROSERO | `2.0251597E8` | `202515970` | Solo tiene **8** cifras significativas guardadas, pero un código de este formato normalmente tiene 9. El último dígito (`0`) es una suposición mía basada en el patrón de los demás códigos — **no está confirmado**. Podría terminar en cualquier otro dígito. |

**Antes de publicar esta página, por favor:**

1. Verifica los 6 códigos de la tabla contra tu listado oficial de
   estudiantes (o pregúntale directamente al estudiante #13 su código
   completo).
2. Corrige lo que haga falta directamente en el Google Sheet, en la
   columna `Codigo estudiantil`, una vez lo hayas importado.
3. Dejé una columna extra en el CSV llamada `VERIFICAR CODIGO` que marca
   estas 6 filas con el valor original en notación científica, para que
   sea fácil encontrarlas en el Sheet. Puedes borrar esa columna después
   de verificar, o dejarla como referencia — no afecta el funcionamiento
   de la página (el backend no la usa).

Si no corriges el código #13 y resulta ser incorrecto, ese estudiante
simplemente no podrá ver sus resultados (le aparecerá "no encontrado"),
no verá datos de otro compañero — el diseño es seguro en ese sentido —
pero sí quedaría bloqueado hasta que lo corrijas.

## ⚠️ Léelo también: qué tan segura es esta "sesión"

El acceso es correo institucional + código estudiantil — no hay
contraseña real. Esto es razonable para un portal de resultados de bajo
riesgo (no es información financiera ni de salud), pero no es
autenticación fuerte:

- El backend nunca expone el listado completo de estudiantes ni permite
  "adivinar y listar" — cada consulta requiere ambos datos exactos y solo
  devuelve una fila.
- Aun así, alguien que conociera el correo Y el código de un compañero
  podría ver su resultado. Los códigos estudiantiles no suelen ser
  secretos entre compañeros de clase, así que esto es una limitación
  real, no hipotética.
- Si más adelante quieres algo más fuerte (por ejemplo, un enlace único
  por estudiante, o pedir confirmación por correo), es una mejora
  posible, pero es un cambio de arquitectura — dímelo si te interesa.

---

## Paso 1 — Crear el Sheet e importar los resultados

1. Crea un Google Sheet **nuevo** (sheets.new), por ejemplo
   `Resultados Environmental Writing - English III`.
2. Ve a **Archivo → Importar → Subir** y sube el archivo
   `resultados_english_III_writing.csv` que te envié junto con este
   proyecto.
3. En el cuadro de opciones de importación, **antes de darle a
   "Importar datos"**, despliega "Opciones avanzadas" (o revisa la parte
   de abajo del cuadro) y **desmarca la casilla "Convertir texto a
   números, fechas y fórmulas"**. Esto es importante: si la dejas
   marcada, Sheets puede interpretar notas como `4.1` o `4.4` como si
   fueran una fecha corta (día.mes) y las cambia a algo como
   `2026-04-04` — ver la sección de abajo "Si las notas aparecen como
   fechas" si esto ya te pasó.
4. Elige **"Reemplazar hoja actual"** (o "Insertar nueva hoja" y luego
   renómbrala a `Resultados` — el nombre de la pestaña debe ser
   exactamente `Resultados`).
5. Verifica que quedaron 24 filas de datos más la fila de encabezados, y
   que las columnas de notas (`Nota TAC`, `Nota OC`, `Nota VRA`, `Nota
   GRA`, `Nota final...`) muestran números como `4.1`, no fechas.
6. **Antes de seguir**, corrige los 6 códigos marcados en la columna
   `VERIFICAR CODIGO` (ver la sección de arriba).

## Paso 2 — Crear el backend (Apps Script)

1. En ese mismo Sheet: **Extensiones → Apps Script**.
2. Borra el contenido de `Code.gs` por defecto y pega el contenido de
   `apps-script/Code.gs` de este repositorio.
3. En los ajustes del proyecto (⚙️), activa "Mostrar archivo de
   manifiesto 'appsscript.json' en el editor" y reemplaza su contenido
   con `apps-script/appsscript.json` de este repositorio.
4. **Implementar → Nueva implementación**: tipo "Aplicación web",
   "Ejecutar como" tu cuenta, "Quién tiene acceso" → Cualquier usuario.
   Autoriza los permisos la primera vez. Copia la URL que termina en
   `/exec`.

(Este backend no necesita una función `setup` — la hoja ya existe porque
tú la creaste al importar el CSV.)

## Paso 3 — Conectar el frontend con el backend

En `script.js`, reemplaza:
```js
const WEB_APP_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
```
con la URL que copiaste en el paso 2.

## Paso 4 — Publicar en GitHub Pages

1. Crea un repositorio **nuevo** en GitHub.
2. Sube `index.html`, `style.css` y `script.js` a la raíz. (El CSV y la
   carpeta `apps-script/` no necesitan subirse a GitHub — ya los usaste
   en los pasos 1 y 2, pero no hace daño dejarlos.)
3. Settings → Pages → Deploy from a branch → `main` → `/ (root)`.
4. Espera 1-2 minutos y usa la URL pública que te da GitHub.

## Paso 5 — Probar

Ingresa con el correo y código de un estudiante real de la lista (por
ejemplo, María Alejandra: código `2538099`, correo
`maria.argote@correounivalle.edu.co`) y confirma que ves exactamente su
información — nombre, texto, la nota y retroalimentación de los 4
criterios (TAC 4.4/5, OC 4.1/5, VRA 4.0/5, GRA 3.7/5), y
la nota final 4.1/5. Luego intenta con un correo/código que no coincidan
y confirma que ves la pantalla de "no encontrado", sin ninguna pista de
datos ajenos. Prueba también con uno de los 6 códigos que corregiste,
para confirmar que quedó bien escrito en el Sheet.

---

## 🐛 Si las notas aparecen como fechas (ej. "2026-04-04T05:00:00.000Z")

Esto pasa cuando, al importar el CSV, Google Sheets interpreta una nota
corta como `4.1` o `4.4` como si fuera una fecha en formato día.mes
(común con la configuración regional de Colombia) y la convierte
automáticamente. El backend (`Code.gs`) ya incluye una corrección para
esto: si detecta que una celda de nota quedó guardada como fecha,
reconstruye el número original a partir del día y el mes. Por eso, si
ves este error:

1. **Actualiza el backend**: pega de nuevo el contenido de
   `apps-script/Code.gs` de esta entrega (ya trae la corrección) sobre
   el que tengas en Apps Script.
2. **Implementar → Administrar implementaciones → ✏️ (editar) → Nueva
   versión → Implementar**, para que la corrección quede activa sin
   cambiar la URL.
3. Recarga la página del portal y prueba de nuevo.

Esto arregla lo que ven los estudiantes en la página, pero **tu propio
Google Sheet seguirá mostrando las fechas raras** en esas columnas (eso
no lo puede arreglar el backend, porque el dato ya está mal guardado en
la celda). Si te molesta verlo así al revisar el Sheet, la forma limpia
de corregirlo es reimportar el CSV siguiendo el Paso 1 con la casilla
"Convertir texto a números, fechas y fórmulas" **desmarcada** — así
Sheets guarda las notas como texto simple (`4.1`) desde el principio y
no hace falta ninguna corrección.

## Cómo actualizar los resultados más adelante

Si corriges alguna nota o comentario, edítalo directamente en el Google
Sheet — el backend siempre lee la hoja en el momento de la consulta, así
que los cambios se reflejan de inmediato, sin tocar el código.

## Estructura de archivos

```
index.html                            Página (login, resultados)
style.css                             Estilos (tipo boletín de notas)
script.js                             Lógica: login, consulta, render de resultados
resultados_english_III_writing.csv    Los 24 resultados, listos para importar al Sheet
apps-script/Code.gs                   Backend de solo lectura (pegar en Apps Script)
apps-script/appsscript.json           Manifiesto de permisos del backend
```
