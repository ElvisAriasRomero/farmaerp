from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("productos", "0001_initial")]
    operations = [
        migrations.AddField(
            model_name="producto",
            name="unidades_por_empaque",
            field=models.PositiveIntegerField(default=1),
        ),
    ]
