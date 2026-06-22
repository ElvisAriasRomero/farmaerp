from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("empleados", "0001_initial"),
        ("ventas", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="venta",
            name="empleado",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                db_column="id_empleado",
                related_name="ventas",
                to="empleados.empleado",
            ),
        ),
    ]
