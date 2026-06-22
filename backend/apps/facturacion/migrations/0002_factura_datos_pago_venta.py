from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("facturacion", "0001_initial"),
        ("ventas", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="factura",
            name="nit_ci",
            field=models.CharField(default="0", max_length=30),
        ),
        migrations.AddField(
            model_name="factura",
            name="razon_social",
            field=models.CharField(default="S/N", max_length=200),
        ),
        migrations.AddField(
            model_name="pago",
            name="venta",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                db_column="id_venta",
                related_name="pagos",
                to="ventas.venta",
            ),
        ),
        migrations.AlterField(
            model_name="pago",
            name="factura",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                db_column="id_factura",
                related_name="pagos",
                to="facturacion.factura",
            ),
        ),
    ]
