from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("empleados", "0001_initial"),
        ("auditoria", "0002_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="bitacoraauditoria",
            name="empleado",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                db_column="id_empleado",
                related_name="bitacoras",
                to="empleados.empleado",
            ),
        ),
    ]
