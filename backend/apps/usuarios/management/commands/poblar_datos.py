"""Pobla la base de datos con datos de demostracion realistas.

Crea catalogo (categorias, proveedores, productos), inventario con lotes
(FEFO, algunos proximos a vencer), clientes y ~6 meses de ventas con
estacionalidad semanal y tendencia, de modo que:

  * El dashboard muestre KPIs, top productos y graficas con datos reales.
  * La IA de prediccion (Prophet) tenga historial suficiente por producto.
  * La gestion de lotes/vencimientos se vea poblada.

Al final consolida la tabla demandas_historicas a partir de las ventas, que
es la fuente que alimenta el entrenamiento del modelo.

Uso:
    python manage.py poblar_datos
    python manage.py poblar_datos --reset        # borra demo previa y repuebla
    python manage.py poblar_datos --si-vacio      # solo si no hay productos
    python manage.py poblar_datos --meses 6 --productos 28

Despues de poblar, entrena los modelos llamando al endpoint
    POST /api/v1/prediccion/entrenar/
o al pipeline    POST /api/v1/prediccion/pipeline/
"""
from __future__ import annotations

import math
import random
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone


# ----------------------------------------------------------------------------
# Datos base (catalogo tipico de farmacia)
# ----------------------------------------------------------------------------
CATEGORIAS = [
    ("Analgesicos", "Medicamentos para el dolor y la fiebre"),
    ("Antibioticos", "Tratamiento de infecciones bacterianas"),
    ("Antigripales", "Sintomas de resfriado y gripe"),
    ("Gastrointestinal", "Digestivos, antiacidos y similares"),
    ("Vitaminas", "Suplementos y vitaminas"),
    ("Dermatologicos", "Cremas y cuidado de la piel"),
    ("Cuidado personal", "Higiene y cuidado personal"),
    ("Material de curacion", "Vendas, gasas y antisepticos"),
    ("Bebidas", "Aguas, gaseosas, jugos y energizantes"),
    ("Snacks", "Golosinas, galletas y aperitivos"),
]

# (nombre, categoria, precio_compra, precio_venta, rotacion_base)
# rotacion_base = unidades promedio que se venden por dia (antes de estacionalidad)
PRODUCTOS = [
    ("Paracetamol 500mg x10", "Analgesicos", 4.50, 8.00, 9.0),
    ("Ibuprofeno 400mg x10", "Analgesicos", 5.00, 9.50, 7.5),
    ("Aspirina 500mg x20", "Analgesicos", 6.00, 11.00, 4.0),
    ("Naproxeno 550mg x10", "Analgesicos", 7.00, 13.00, 3.0),
    ("Amoxicilina 500mg x12", "Antibioticos", 9.00, 18.00, 4.5),
    ("Azitromicina 500mg x3", "Antibioticos", 14.00, 28.00, 2.5),
    ("Ciprofloxacino 500mg x10", "Antibioticos", 11.00, 22.00, 2.0),
    ("Cefalexina 500mg x12", "Antibioticos", 10.00, 20.00, 2.2),
    ("Antigripal compuesto x10", "Antigripales", 6.50, 12.50, 6.0),
    ("Loratadina 10mg x10", "Antigripales", 4.00, 8.50, 5.0),
    ("Pseudoefedrina jarabe", "Antigripales", 8.00, 15.00, 3.5),
    ("Paracetamol nino jarabe", "Antigripales", 7.00, 13.50, 4.0),
    ("Omeprazol 20mg x14", "Gastrointestinal", 6.00, 12.00, 5.5),
    ("Ranitidina 150mg x20", "Gastrointestinal", 5.50, 10.50, 3.0),
    ("Sales de rehidratacion", "Gastrointestinal", 2.50, 5.00, 4.0),
    ("Loperamida 2mg x10", "Gastrointestinal", 4.50, 9.00, 2.8),
    ("Vitamina C 1g x10", "Vitaminas", 5.00, 10.00, 6.5),
    ("Complejo B x30", "Vitaminas", 8.00, 16.00, 3.0),
    ("Vitamina D3 1000UI x30", "Vitaminas", 9.00, 18.00, 2.5),
    ("Multivitaminico x30", "Vitaminas", 10.00, 20.00, 3.2),
    ("Crema hidratante 100g", "Dermatologicos", 7.00, 14.00, 2.5),
    ("Clotrimazol crema 20g", "Dermatologicos", 6.00, 12.00, 2.0),
    ("Protector solar FPS50", "Dermatologicos", 15.00, 30.00, 2.2),
    ("Alcohol en gel 250ml", "Cuidado personal", 3.50, 7.00, 5.0),
    ("Jabon antibacterial", "Cuidado personal", 2.00, 4.50, 4.0),
    ("Cepillo dental", "Cuidado personal", 2.50, 5.50, 3.0),
    ("Gasas esteriles x10", "Material de curacion", 3.00, 6.50, 3.5),
    ("Venda elastica 5cm", "Material de curacion", 4.00, 8.00, 2.5),
    ("Agua oxigenada 120ml", "Material de curacion", 2.50, 5.00, 3.0),
    ("Curitas surtidas x30", "Material de curacion", 3.50, 7.50, 4.0),
    # --- Bebidas ---
    ("Bebida energetica Red Bull 250ml", "Bebidas", 8.00, 14.00, 5.5),
    ("Bebida energetica Volt 500ml", "Bebidas", 5.00, 9.00, 5.0),
    ("Agua mineral 500ml", "Bebidas", 2.00, 4.00, 8.0),
    ("Agua mineral 2L", "Bebidas", 4.00, 7.00, 3.5),
    ("Gaseosa Coca-Cola 500ml", "Bebidas", 4.00, 7.50, 7.0),
    ("Gaseosa Sprite 500ml", "Bebidas", 4.00, 7.50, 4.5),
    ("Jugo de naranja 300ml", "Bebidas", 3.00, 6.00, 4.5),
    ("Rehidratante deportivo 500ml", "Bebidas", 6.00, 11.00, 3.5),
    ("Te helado limon 500ml", "Bebidas", 4.50, 8.00, 3.5),
    # --- Snacks ---
    ("Galletas rellenas x6", "Snacks", 3.00, 6.00, 5.5),
    ("Papas fritas 120g", "Snacks", 7.00, 13.00, 4.5),
    ("Chocolate con leche 40g", "Snacks", 4.00, 8.00, 5.5),
    ("Chocolate con almendras 40g", "Snacks", 4.50, 9.00, 4.0),
    ("Mani salado 100g", "Snacks", 3.00, 6.00, 4.0),
    ("Caramelos surtidos x20", "Snacks", 2.00, 5.00, 6.0),
    ("Chicles menta x10", "Snacks", 2.50, 5.00, 5.0),
    ("Barra de cereal 25g", "Snacks", 3.50, 7.00, 3.5),
    ("Galletas de agua x8", "Snacks", 2.00, 4.50, 3.5),
]

PROVEEDORES = [
    "Distribuidora Farmaceutica Andina",
    "Laboratorios Bago",
    "Drogueria Inti",
    "Genfar Bolivia",
    "Quimica Suiza",
    "Farma S.A.",
    "Distribuidora La Paz",
    "Bayer Bolivia",
]

NOMBRES = [
    "Maria Lopez", "Juan Perez", "Ana Gutierrez", "Carlos Mamani", "Lucia Flores",
    "Pedro Quispe", "Sofia Vargas", "Luis Rojas", "Elena Choque", "Jorge Castro",
    "Andrea Mendoza", "Diego Herrera", "Patricia Romero", "Miguel Torres",
    "Valeria Cruz", "Roberto Aliaga", "Carmen Salinas", "Fernando Ticona",
    "Gabriela Nina", "Oscar Condori",
]


class Command(BaseCommand):
    help = "Pobla la BD con datos de demostracion (catalogo, lotes, clientes y ventas historicas)."

    def add_arguments(self, parser):
        parser.add_argument("--meses", type=int, default=6,
                            help="Meses de historial de ventas a generar (def. 6).")
        parser.add_argument("--productos", type=int, default=len(PRODUCTOS),
                            help="Cantidad de productos a crear (def. todos).")
        parser.add_argument("--reset", action="store_true",
                            help="Borra los datos de demo previos antes de poblar.")
        parser.add_argument("--si-vacio", action="store_true",
                            help="Solo siembra si no hay productos (idempotente, "
                                 "seguro para correr al arrancar el contenedor).")
        parser.add_argument("--seed", type=int, default=42,
                            help="Semilla aleatoria para reproducibilidad.")
        parser.add_argument("--pipeline", action="store_true",
                            help="Tras poblar, ejecuta el pipeline de IA "
                                 "(predice, entrena Prophet y sugiere). Pensado "
                                 "para sembrar en el servidor.")

    def handle(self, *args, **opts):
        from apps.usuarios.models import Usuario, Rol
        from apps.empleados.models import Empleado
        from apps.clientes.models import Cliente
        from apps.proveedores.models import Proveedor
        from apps.productos.models import Categoria, Producto
        from apps.inventario.models import Inventario, Lote
        from apps.ventas.models import Venta, DetalleVenta

        if opts["si_vacio"] and Producto.objects.exists():
            self.stdout.write(
                "poblar_datos --si-vacio: ya hay productos, no se hace nada.")
            return

        random.seed(opts["seed"])
        meses = opts["meses"]
        n_prod = max(1, min(opts["productos"], len(PRODUCTOS)))
        dias = int(meses * 30)

        if opts["reset"]:
            self.stdout.write("Borrando TODOS los datos previos (reset completo)...")
            self._reset_datos()

        with transaction.atomic():
            self._poblar(
                meses, n_prod, dias,
                Usuario, Rol, Empleado, Cliente, Proveedor,
                Categoria, Producto, Inventario, Lote, Venta, DetalleVenta,
            )

        # Consolidar demanda historica (fuente del entrenamiento de la IA)
        self.stdout.write("Consolidando demandas_historicas para la IA...")
        try:
            from ml.data import consolidar_demanda_historica
            filas = consolidar_demanda_historica()
            self.stdout.write(self.style.SUCCESS(
                f"  demandas_historicas: {filas} filas escritas."))
        except Exception as exc:  # noqa: BLE001
            self.stdout.write(self.style.WARNING(
                f"  No se pudo consolidar demanda ({exc}). "
                "Puedes correrlo luego desde el pipeline."))

        if opts["pipeline"]:
            self.stdout.write("Ejecutando pipeline de IA...")
            try:
                from ml.predict import generar_y_guardar_predicciones
                from ml.analytics import generar_sugerencias_compra
                from ml.train_model import entrenar_todos
                # Predicciones base (rapidas, respaldo media movil) para que la
                # tabla nunca quede vacia aunque el entrenamiento falle/OOM.
                generar_y_guardar_predicciones("semanal")
                generar_sugerencias_compra("semanal")
                # Entrenamiento Prophet (mejor esfuerzo) y refresco de predicciones.
                resumen = entrenar_todos()
                generar_y_guardar_predicciones("semanal")
                generar_sugerencias_compra("semanal")
                self.stdout.write(self.style.SUCCESS(
                    f"  Pipeline IA completado: {resumen}"))
            except Exception as exc:  # noqa: BLE001
                self.stdout.write(self.style.WARNING(
                    f"  Pipeline IA incompleto ({exc})."))

        self.stdout.write(self.style.SUCCESS("\nPoblado completado."))
        self.stdout.write(
            "Siguiente paso: entrena los modelos llamando a\n"
            "  POST /api/v1/prediccion/entrenar/   (o /api/v1/prediccion/pipeline/)\n"
            "para generar las predicciones de la IA."
        )

    # ------------------------------------------------------------------
    def _reset_datos(self):
        """Borra todos los datos transaccionales y de catalogo respetando las
        FK PROTECT (pagos/facturas -> ventas; detalle_compra/carrito ->
        productos). No toca empleados ni superusuarios."""
        from apps.usuarios.models import Usuario
        from apps.clientes.models import Cliente
        from apps.proveedores.models import Proveedor
        from apps.productos.models import Categoria, Producto
        from apps.inventario.models import Inventario, Lote
        from apps.ventas.models import Venta, DetalleVenta

        def borrar(ruta, *clases):
            try:
                mod = __import__(ruta, fromlist=clases)
                for c in clases:
                    getattr(mod, c).objects.all().delete()
            except Exception:
                pass

        # 1) Lo que protege a las VENTAS
        borrar("apps.facturacion.models", "Pago", "Factura")
        DetalleVenta.objects.all().delete()
        Venta.objects.all().delete()
        # 2) Lo que protege a los PRODUCTOS (compras y carritos)
        borrar("apps.compras.models", "DetalleCompra", "Compra")
        borrar("apps.carrito.models", "DetalleCarrito", "Carrito")
        # 3) Catalogo e inventario
        Lote.objects.all().delete()
        Inventario.objects.all().delete()
        Producto.objects.all().delete()
        Categoria.objects.all().delete()
        Proveedor.objects.all().delete()
        # 4) Clientes y sus usuarios (nunca superusuarios)
        ids_user = list(Cliente.objects.values_list("usuario_id", flat=True))
        Cliente.objects.all().delete()
        Usuario.objects.filter(id_usuario__in=ids_user, is_superuser=False).delete()

    # ------------------------------------------------------------------
    def _poblar(self, meses, n_prod, dias,
                Usuario, Rol, Empleado, Cliente, Proveedor,
                Categoria, Producto, Inventario, Lote, Venta, DetalleVenta):
        from apps.compras.models import Compra, DetalleCompra
        from apps.facturacion.models import Factura, Pago

        hoy = date.today()

        # --- Rol + empleado (reutiliza superusuario si existe) ---
        rol_admin, _ = Rol.objects.get_or_create(nombre_rol="Administrador")
        Rol.objects.get_or_create(nombre_rol="Vendedor")
        super_user = Usuario.objects.filter(is_superuser=True).order_by("id_usuario").first()
        empleado = None
        if super_user and not Empleado.objects.filter(usuario=super_user).exists():
            empleado = Empleado.objects.create(
                usuario=super_user, nombre="Administrador del sistema",
                fecha_contratacion=hoy - timedelta(days=400),
                salario=Decimal("5000.00"), rol=rol_admin,
            )
        elif super_user:
            empleado = Empleado.objects.filter(usuario=super_user).first()

        # --- Categorias ---
        cats = {}
        for nombre, desc in CATEGORIAS:
            c, _ = Categoria.objects.get_or_create(
                nombre=nombre, defaults={"descripcion": desc})
            cats[nombre] = c
        self.stdout.write(f"Categorias: {len(cats)}")

        # --- Proveedores ---
        for nombre in PROVEEDORES:
            Proveedor.objects.get_or_create(
                nombre=nombre,
                defaults={"telefono": f"7{random.randint(1000000, 9999999)}"},
            )
        self.stdout.write(f"Proveedores: {Proveedor.objects.count()}")

        # --- Sin clientes de relleno ---
        # Las ventas de ejemplo son de mostrador (consumidor final). Los
        # clientes reales se registran desde el sistema/tienda.
        self.stdout.write("Clientes: 0 (ventas a consumidor final)")

        # --- Productos + inventario + lotes ---
        import re
        productos = []   # (Producto, rotacion_base)
        for idx, (nombre, cat, pc, pv, rot) in enumerate(PRODUCTOS[:n_prod]):
            # El "xN" del nombre es el tamano del paquete: lo movemos a
            # unidades_por_empaque y dejamos el nombre limpio.
            m = re.search(r"\s*x(\d+)$", nombre)
            uxe = int(m.group(1)) if m else 1
            nombre_limpio = re.sub(r"\s*x\d+$", "", nombre).strip()
            prod, _ = Producto.objects.get_or_create(
                nombre=nombre_limpio,
                defaults={
                    "categoria": cats[cat],
                    "precio_compra": Decimal(str(pc)),
                    "precio_venta": Decimal(str(pv)),
                    "unidad_medida": "caja",
                    "unidades_por_empaque": uxe,
                    "codigo_barras": f"77{idx:08d}",
                },
            )
            inv, _ = Inventario.objects.get_or_create(
                producto=prod,
                defaults={"stock_minimo": max(10, int(rot * 4))},
            )
            # Lotes: lote principal sano + (en 1 de cada 5 productos) un lote
            # proximo a vencer, para demostrar alertas FEFO/merma.
            Lote.objects.filter(producto=prod).delete()
            stock_total = 0
            if idx % 5 == 0:
                cant = random.randint(8, 20)
                Lote.objects.create(
                    producto=prod, cantidad=cant, numero_lote=f"L{idx}A",
                    fecha_vencimiento=hoy + timedelta(days=random.randint(15, 45)),
                )
                stock_total += cant
            cant = random.randint(60, 180)
            Lote.objects.create(
                producto=prod, cantidad=cant, numero_lote=f"L{idx}B",
                fecha_vencimiento=hoy + timedelta(days=random.randint(180, 540)),
            )
            stock_total += cant
            inv.stock_actual = stock_total
            inv.save(update_fields=["stock_actual"])
            productos.append((prod, rot))
        self.stdout.write(f"Productos: {len(productos)} (con inventario y lotes)")

        # --- Ventas historicas con estacionalidad ---
        self.stdout.write(
            f"Generando ~{dias} dias de ventas (esto puede tardar unos segundos)...")
        total_ventas = 0
        total_detalles = 0
        total_pagos = 0
        total_facturas = 0
        for d in range(dias, 0, -1):
            dia = hoy - timedelta(days=d)
            factor = self._factor_estacional(dia, dias, d)
            lineas_dia = []
            for prod, rot in productos:
                qty = self._poisson(rot * factor)
                if qty > 0:
                    lineas_dia.append((prod, qty))
            if not lineas_dia:
                continue
            random.shuffle(lineas_dia)
            i = 0
            while i < len(lineas_dia):
                grupo = lineas_dia[i:i + random.randint(1, 4)]
                i += len(grupo)
                total = Decimal("0")
                detalles = []
                for prod, qty in grupo:
                    pu = prod.precio_venta or Decimal("0")
                    total += pu * qty
                    detalles.append((prod, qty, pu))
                venta = Venta.objects.create(
                    cliente=None,   # venta de mostrador: consumidor final
                    empleado=empleado,
                    total=total,
                    estado="completada",
                    # Los datos de ejemplo son todos ventas de mostrador.
                    # Las reservas (origen="tienda") solo se crean con pedidos
                    # reales de la tienda/movil, no se generan de relleno.
                    origen="mostrador",
                )
                for prod, qty, pu in detalles:
                    DetalleVenta.objects.create(
                        venta=venta, producto=prod, cantidad=qty,
                        precio_unitario=pu, presentacion="unidad",
                    )
                    total_detalles += 1
                # Backdatear la fecha (auto_now_add no respeta el valor en create)
                ts = timezone.make_aware(
                    datetime.combine(dia, time(random.randint(8, 20),
                                               random.randint(0, 59))))
                Venta.objects.filter(pk=venta.pk).update(
                    fecha_venta=ts, fecha_creacion=ts)
                total_ventas += 1

                # Factura (en parte de las ventas) y pago siempre
                factura = None
                if random.random() < 0.35:
                    factura = Factura.objects.create(
                        venta=venta, numero_factura=f"F-{venta.pk:06d}",
                        fecha_emision=dia, total=total, estado="pagada",
                        nit_ci=str(random.randint(1000000, 9999999)),
                        razon_social="Consumidor Final",
                    )
                    Venta.objects.filter(pk=venta.pk).update(con_factura=True)
                    total_facturas += 1
                metodo = random.choices(
                    ["efectivo", "qr"], weights=[3, 1])[0]
                pago = Pago.objects.create(
                    venta=venta, factura=factura, monto=total,
                    metodo_pago=metodo, estado="completado",
                )
                Pago.objects.filter(pk=pago.pk).update(
                    fecha_pago=ts, fecha_creacion=ts)
                total_pagos += 1
        self.stdout.write(self.style.SUCCESS(
            f"Ventas: {total_ventas}  |  Detalles de venta: {total_detalles}"))
        self.stdout.write(self.style.SUCCESS(
            f"Pagos: {total_pagos}  |  Facturas: {total_facturas}"))

        # --- Compras de reabastecimiento a proveedores ---
        proveedores = list(Proveedor.objects.all())
        num_compras = max(8, dias // 5)
        total_compras = 0
        for _ in range(num_compras):
            dia_c = hoy - timedelta(days=random.randint(1, max(dias, 1)))
            compra = Compra.objects.create(
                proveedor=random.choice(proveedores),
                fecha_pedido=dia_c, fecha_recepcion=dia_c,
                total=Decimal("0"), empleado=empleado, estado="completada",
            )
            total_c = Decimal("0")
            for prod, _rot in random.sample(productos, k=random.randint(2, 5)):
                cant = random.randint(20, 100)
                pu = prod.precio_compra or Decimal("1")
                DetalleCompra.objects.create(
                    compra=compra, producto=prod, cantidad=cant,
                    precio_unitario=pu, unidades_por_paquete=1,
                )
                total_c += pu * cant
            Compra.objects.filter(pk=compra.pk).update(total=total_c)
            total_compras += 1
        self.stdout.write(self.style.SUCCESS(f"Compras: {total_compras}"))

    # ------------------------------------------------------------------
    @staticmethod
    def _factor_estacional(dia, dias_totales, d_restantes):
        """Multiplicador de demanda: tendencia + estacionalidad semanal/mensual."""
        progreso = 1.0 - (d_restantes / max(dias_totales, 1))
        tendencia = 0.8 + 0.4 * progreso
        peso_semana = {0: 1.0, 1: 1.0, 2: 1.05, 3: 1.1, 4: 1.25, 5: 1.3, 6: 0.6}
        semanal = peso_semana[dia.weekday()]
        mensual = 1.0 + 0.15 * math.sin(2 * math.pi * dia.timetuple().tm_yday / 365.0)
        return tendencia * semanal * mensual

    @staticmethod
    def _poisson(lam):
        """Muestra de una Poisson(lam) sin numpy (algoritmo de Knuth)."""
        if lam <= 0:
            return 0
        L = math.exp(-lam)
        k = 0
        p = 1.0
        while True:
            k += 1
            p *= random.random()
            if p <= L:
                return k - 1
