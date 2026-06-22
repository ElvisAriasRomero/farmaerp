from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("ventas", "0004_detalleventa_presentacion"), ("clientes", "0001_initial")]
    operations = [
        migrations.AlterField(
            model_name="venta",
            name="cliente",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.PROTECT,
                db_column="id_cliente", related_name="ventas",
                to="clientes.cliente",
            ),
        ),
    ]
