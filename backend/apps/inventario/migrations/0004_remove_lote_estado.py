from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("inventario", "0003_lote"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="lote",
            name="estado",
        ),
    ]
