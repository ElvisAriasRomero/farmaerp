from django.db import migrations, models


def limpiar_predicciones(apps, schema_editor):
    """Las predicciones son desechables (se regeneran). Se limpian para
    poder aplicar la nueva restriccion unica sin choques de duplicados."""
    DatosPrediccion = apps.get_model("prediccion", "DatosPrediccion")
    DatosPrediccion.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [("prediccion", "0002_sugerencia_estado_drop_metricas")]
    operations = [
        migrations.RunPython(limpiar_predicciones, migrations.RunPython.noop),
        migrations.AddField(
            model_name="datosprediccion",
            name="metodo",
            field=models.CharField(
                max_length=12,
                choices=[
                    ("prophet", "Modelo Prophet"),
                    ("media_movil", "Promedio movil"),
                    ("sin_datos", "Sin datos"),
                ],
                default="sin_datos",
            ),
        ),
        migrations.AddField(
            model_name="datosprediccion",
            name="fecha_actualizacion",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterUniqueTogether(
            name="datosprediccion",
            unique_together={("producto", "periodo", "fecha_prediccion")},
        ),
    ]
