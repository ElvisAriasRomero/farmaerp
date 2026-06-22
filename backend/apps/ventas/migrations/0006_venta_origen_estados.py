from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("ventas", "0005_venta_cliente_nullable")]
    operations = [
        migrations.AddField(
            model_name="venta",
            name="origen",
            field=models.CharField(
                max_length=10,
                choices=[("mostrador", "Mostrador"), ("tienda", "Tienda online")],
                default="mostrador",
            ),
        ),
        migrations.AlterField(
            model_name="venta",
            name="estado",
            field=models.CharField(
                max_length=12,
                choices=[
                    ("pendiente", "Pendiente"),
                    ("reservada", "Reservada"),
                    ("pagada", "Pagada"),
                    ("entregada", "Entregada"),
                    ("completada", "Completada"),
                    ("cancelada", "Cancelada"),
                ],
                default="pendiente",
            ),
        ),
    ]
