from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("prediccion", "0001_initial")]
    operations = [
        # Demandas: evita duplicados (un registro por producto y fecha)
        migrations.AlterUniqueTogether(
            name="demandashistoricas",
            unique_together={("producto", "fecha")},
        ),
        # CompraSugerida: quitar fecha_generacion redundante, agregar estado
        migrations.RemoveField(
            model_name="comprasugerida",
            name="fecha_generacion",
        ),
        migrations.AddField(
            model_name="comprasugerida",
            name="estado",
            field=models.CharField(
                max_length=12,
                choices=[
                    ("pendiente", "Pendiente"),
                    ("atendida", "Atendida"),
                    ("descartada", "Descartada"),
                ],
                default="pendiente",
            ),
        ),
        # Tabla de métricas que no se usaba
        migrations.DeleteModel(name="MetricasVentas"),
    ]
