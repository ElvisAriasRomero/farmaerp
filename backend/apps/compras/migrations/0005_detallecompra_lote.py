from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("compras", "0004_detalle_2b"),
    ]

    operations = [
        migrations.AddField(
            model_name="detallecompra",
            name="fecha_vencimiento",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="detallecompra",
            name="numero_lote",
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
