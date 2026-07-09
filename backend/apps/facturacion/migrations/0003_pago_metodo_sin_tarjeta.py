from django.db import migrations, models


def tarjeta_a_efectivo(apps, schema_editor):
    """Reasigna pagos existentes con metodo 'tarjeta' a 'efectivo'
    (tarjeta ya no es un metodo valido)."""
    Pago = apps.get_model("facturacion", "Pago")
    Pago.objects.filter(metodo_pago="tarjeta").update(metodo_pago="efectivo")


class Migration(migrations.Migration):
    dependencies = [("facturacion", "0002_factura_datos_pago_venta")]
    operations = [
        migrations.RunPython(tarjeta_a_efectivo, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="pago",
            name="metodo_pago",
            field=models.CharField(
                max_length=10,
                choices=[("efectivo", "Efectivo"), ("qr", "QR")],
            ),
        ),
    ]
