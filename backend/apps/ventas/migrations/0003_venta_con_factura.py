from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ventas", "0002_venta_empleado_nullable"),
    ]

    operations = [
        migrations.AddField(
            model_name="venta",
            name="con_factura",
            field=models.BooleanField(default=False),
        ),
    ]
