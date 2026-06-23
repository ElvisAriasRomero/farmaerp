from django.db import migrations, models
import django.db.models.deletion


def crear_lotes_iniciales(apps, schema_editor):
    """Crea un lote inicial por cada producto que ya tenga stock, usando su
    fecha de vencimiento actual. Idempotente: no duplica si ya existe lote."""
    Inventario = apps.get_model("inventario", "Inventario")
    Lote = apps.get_model("inventario", "Lote")
    for inv in Inventario.objects.select_related("producto").all():
        producto = inv.producto
        stock = inv.stock_actual or 0
        if stock <= 0:
            continue
        if Lote.objects.filter(producto=producto).exists():
            continue
        Lote.objects.create(
            producto=producto,
            numero_lote="INICIAL",
            cantidad=stock,
            fecha_vencimiento=getattr(producto, "fecha_vencimiento", None),
            estado="activo",
        )


def revertir(apps, schema_editor):
    # Al revertir se elimina la tabla completa; no se requiere acción extra.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("inventario", "0002_remove_cantidad_reservada"),
        ("productos", "0004_producto_precio_venta_nullable"),
    ]

    operations = [
        migrations.CreateModel(
            name="Lote",
            fields=[
                ("id_lote", models.AutoField(primary_key=True, serialize=False)),
                ("numero_lote", models.CharField(blank=True, max_length=50, null=True)),
                ("cantidad", models.IntegerField(default=0)),
                ("fecha_vencimiento", models.DateField(blank=True, null=True)),
                ("fecha_ingreso", models.DateField(auto_now_add=True)),
                (
                    "estado",
                    models.CharField(
                        choices=[("activo", "Activo"), ("agotado", "Agotado")],
                        default="activo",
                        max_length=10,
                    ),
                ),
                ("fecha_creacion", models.DateTimeField(auto_now_add=True)),
                ("fecha_actualizacion", models.DateTimeField(auto_now=True)),
                (
                    "producto",
                    models.ForeignKey(
                        db_column="id_producto",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="lotes",
                        to="productos.producto",
                    ),
                ),
            ],
            options={
                "verbose_name": "Lote",
                "verbose_name_plural": "Lotes",
                "db_table": "lote",
                "ordering": ["fecha_vencimiento", "id_lote"],
            },
        ),
        migrations.RunPython(crear_lotes_iniciales, revertir),
    ]
