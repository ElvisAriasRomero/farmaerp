from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("ventas", "0003_venta_con_factura")]
    operations = [
        migrations.AddField(
            model_name="detalleventa",
            name="presentacion",
            field=models.CharField(
                max_length=10,
                choices=[("paquete", "Paquete"), ("unidad", "Unidad")],
                default="unidad",
            ),
        ),
    ]
