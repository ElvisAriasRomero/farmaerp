const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  LevelFormat
} = require("docx");

const ORANGE = "F4511E";
const INK = "16181D";
const border = { style: BorderStyle.SINGLE, size: 4, color: "B7C0CC" };
const borders = { top: border, bottom: border, left: border, right: border };

const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const P = (t) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 160, line: 276 },
  children: [new TextRun(t)],
});
const Pb = (label, rest) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 120, line: 276 },
  children: [new TextRun({ text: label, bold: true }), new TextRun(rest)],
});
const LI = (t) => new Paragraph({
  numbering: { reference: "bul", level: 0 },
  spacing: { after: 60, line: 276 },
  children: [new TextRun(t)],
});

function headerCell(text, w) {
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: { fill: ORANGE, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF" })] })],
  });
}
function cell(text, w, opts = {}) {
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 70, bottom: 70, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: !!opts.bold })] })],
  });
}

const W = 9026;
const equipoCols = [2600, 2600, 1700, 2126];
const equipoTable = new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: equipoCols,
  rows: [
    new TableRow({ tableHeader: true, children: [
      headerCell("Integrante", equipoCols[0]),
      headerCell("Rol", equipoCols[1]),
      headerCell("Teléfono", equipoCols[2]),
      headerCell("Contacto (WhatsApp)", equipoCols[3]),
    ]}),
    new TableRow({ children: [
      cell("Elvis Arias Romero", equipoCols[0], { bold: true }),
      cell("Desarrollador Full-Stack", equipoCols[1]),
      cell("+591 71050261", equipoCols[2]),
      cell("wa.me/59171050261", equipoCols[3]),
    ]}),
    new TableRow({ children: [
      cell("Harold Jhayson Apaza Monasterio", equipoCols[0], { bold: true }),
      cell("Desarrollador Full-Stack", equipoCols[1]),
      cell("+591 60933397", equipoCols[2]),
      cell("wa.me/59160933397", equipoCols[3]),
    ]}),
  ],
});

const blCols = [700, 4926, 1500, 1900];
function blRow(id, hist, prio, est) {
  return new TableRow({ children: [
    cell(id, blCols[0], { bold: true }),
    cell(hist, blCols[1]),
    cell(prio, blCols[2]),
    cell(est, blCols[3]),
  ]});
}
const backlogTable = new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: blCols,
  rows: [
    new TableRow({ tableHeader: true, children: [
      headerCell("ID", blCols[0]),
      headerCell("Historia de usuario / Requerimiento", blCols[1]),
      headerCell("Prioridad", blCols[2]),
      headerCell("Estado", blCols[3]),
    ]}),
    blRow("HU-01", "Como visitante quiero ver una seccion principal (hero) con el nombre InovaSoft y su propuesta de valor para entender rapidamente que ofrece la empresa.", "Alta", "Terminado"),
    blRow("HU-02", "Como visitante quiero ver la lista de servicios que ofrece InovaSoft para conocer en que puede ayudarme.", "Alta", "Terminado"),
    blRow("HU-03", "Como cliente potencial quiero ver un proyecto destacado (FarmaERP) para evaluar la experiencia del equipo.", "Media", "Terminado"),
    blRow("HU-04", "Como visitante quiero conocer al equipo de desarrollo y contactarlo directamente por WhatsApp.", "Alta", "Terminado"),
    blRow("HU-05", "Como cliente quiero una seccion de contacto con botones directos a WhatsApp para iniciar una conversacion.", "Alta", "Terminado"),
    blRow("HU-06", "Como usuario en celular quiero que la pagina se adapte a mi pantalla (diseno responsivo).", "Alta", "Terminado"),
    blRow("HU-07", "Como visitante quiero una navegacion fluida entre secciones mediante el menu superior.", "Media", "Terminado"),
    blRow("HU-08", "Como administrador quiero que el sitio este publicado en linea y accesible desde cualquier dispositivo.", "Media", "Terminado"),
  ],
});

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: INK },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: INK },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•",
      alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ]},
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 },
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: [
      H1("CAPITULO 7. SITIO WEB"),

      H1("7.1. INTRODUCCION"),
      P("El presente capitulo describe el desarrollo del sitio web institucional de InovaSoft, un equipo dedicado al desarrollo de software a medida. El objetivo de la pagina es presentar de forma profesional la identidad de la empresa, dar a conocer los servicios que ofrece y facilitar el contacto directo con los desarrolladores a traves de canales rapidos como WhatsApp."),
      P("A diferencia del sistema FarmaERP desarrollado a lo largo del proyecto, este sitio web cumple una funcion de presentacion y captacion de clientes: actua como una carta de presentacion digital que muestra las capacidades del equipo, sus areas de especializacion y un proyecto destacado que evidencia la calidad del trabajo realizado. La pagina fue construida como una landing page de una sola vista, optimizada para cargar rapido, ser totalmente responsiva y poder publicarse facilmente en la web."),

      H1("7.2. IDENTIDAD VISUAL DEL SISTEMA"),
      P("La identidad visual de InovaSoft transmite innovacion, profesionalismo y cercania. Los elementos graficos fueron definidos para mantener coherencia en todo el sitio web y reforzar el reconocimiento de la marca."),
      Pb("Nombre y logotipo: ", "La marca se denomina InovaSoft. Su isotipo esta formado por el monograma “iS” construido con formas geometricas y un efecto de cinta tridimensional, acompanado del nombre completo y el eslogan descriptivo."),
      Pb("Eslogan: ", "“Desarrollo de software a medida”, que sintetiza la propuesta de valor del equipo."),
      Pb("Paleta de colores: ", "se utiliza una combinacion de naranja (#F4511E) y rojo (#E53935) como colores primarios, que aportan energia y dinamismo, sobre una base de negro (#16181D) y blanco que brindan elegancia y buena legibilidad."),
      Pb("Tipografia: ", "se emplea la familia Poppins para titulos y encabezados, por su caracter moderno y geometrico, e Inter para el cuerpo de texto, por su alta legibilidad en pantalla."),
      Pb("Estilo grafico: ", "tarjetas con bordes redondeados, sombras suaves, degradados en los colores de la marca y micro-animaciones al desplazarse, logrando una apariencia actual y profesional."),

      H1("7.3. VISION DEL PROYECTO"),
      P("InovaSoft tiene como vision convertirse en un referente regional en el desarrollo de software a medida, ofreciendo soluciones tecnologicas que se adapten a las necesidades reales de cada cliente y que aporten valor tangible a sus procesos."),
      Pb("Mision: ", "disenar y construir aplicaciones web, moviles y sistemas empresariales de alta calidad, acompanando al cliente desde la idea inicial hasta el despliegue y el soporte, con comunicacion directa y cercana."),
      P("El sitio web materializa esta vision al presentar de manera clara las capacidades del equipo y al ofrecer un canal de contacto inmediato, eliminando intermediarios entre el cliente y quienes desarrollan el software."),

      H1("7.4. EQUIPO DE TRABAJO"),
      P("El equipo de InovaSoft esta conformado por dos desarrolladores full-stack responsables del analisis, diseno, desarrollo y despliegue de las soluciones. Cada integrante puede ser contactado directamente mediante WhatsApp, tal como se presenta en el sitio web."),
      equipoTable,
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("")] }),

      H1("7.5. PLANIFICACION DE SPRINTS"),
      P("El desarrollo del sitio web se organizo bajo un enfoque agil, dividiendo el trabajo en dos sprints. Esta planificacion permitio avanzar de forma incremental: primero estableciendo las bases de diseno e identidad, y luego implementando el contenido y la funcionalidad completa de la pagina."),

      H2("7.5.1. SPRINT 1: DISENO Y PLANIFICACION INICIAL"),
      P("El primer sprint se centro en la definicion conceptual y visual del sitio. Las principales actividades fueron:"),
      LI("Definicion de los objetivos del sitio web y del publico objetivo."),
      LI("Diseno de la identidad visual: logotipo, paleta de colores y tipografias."),
      LI("Definicion de la estructura de la pagina y sus secciones (inicio, servicios, proyecto destacado, equipo y contacto)."),
      LI("Elaboracion del Product Backlog con las historias de usuario."),
      LI("Seleccion de la tecnologia de implementacion (HTML, CSS y JavaScript en un unico archivo, sin dependencias externas)."),

      H2("7.5.2. SPRINT 2: DESARROLLO Y CONTENIDO FUNCIONAL"),
      P("El segundo sprint se enfoco en la construccion de la pagina y la incorporacion de todo el contenido y la interactividad. Las principales actividades fueron:"),
      LI("Maquetacion de la seccion principal (hero) con el nombre y la propuesta de valor de InovaSoft."),
      LI("Implementacion de la seccion de servicios mediante tarjetas."),
      LI("Creacion de la seccion de proyecto destacado, presentando el sistema FarmaERP."),
      LI("Desarrollo de la seccion de equipo con enlaces directos de contacto por WhatsApp."),
      LI("Implementacion de la seccion de contacto y del menu de navegacion responsivo."),
      LI("Aplicacion de diseno responsivo y animaciones de aparicion al desplazarse."),
      LI("Pruebas en distintos dispositivos y preparacion para su publicacion en linea."),

      H1("7.6. SPRINTS"),
      P("A continuacion se presenta el Product Backlog del proyecto, que reune las historias de usuario y los requerimientos que guiaron el desarrollo del sitio web, con su prioridad y estado final."),

      H2("7.6.1. PRODUCT BACKLOG"),
      backlogTable,
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("")] }),

      H1("7.7. CAPTURA DE LAS INTERFACES DE LA PAGINA WEB"),
      P("En esta seccion se presentan las capturas de pantalla de las principales interfaces del sitio web de InovaSoft, evidenciando el resultado final del desarrollo. Las vistas capturadas corresponden a:"),
      LI("Seccion principal (hero) con el nombre InovaSoft y la propuesta de valor."),
      LI("Seccion de servicios ofrecidos por el equipo."),
      LI("Seccion de proyecto destacado (FarmaERP)."),
      LI("Seccion de equipo de trabajo con los contactos de WhatsApp."),
      LI("Seccion de contacto y vista responsiva en dispositivos moviles."),
      new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: "[Insertar aqui las capturas de pantalla del sitio web]", italics: true, color: "6B7280" })] }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/sessions/charming-cool-planck/mnt/Proyecto_Taller_de_Grado/CAPITULO_7_InovaSoft.docx", buf);
  console.log("OK escrito");
});
