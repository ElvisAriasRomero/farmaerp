"""Tareas asincronas de prediccion y analisis (Celery)."""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="prediccion.consolidar_demanda")
def consolidar_demanda_task():
    from ml.data import consolidar_demanda_historica
    filas = consolidar_demanda_historica()
    logger.info("Demanda historica consolidada: %s filas", filas)
    return {"filas": filas}


@shared_task(name="prediccion.entrenar_modelos")
def entrenar_modelos_task():
    from ml.train_model import entrenar_todos
    resumen = entrenar_todos()
    logger.info("Entrenamiento completado: %s", resumen)
    return resumen


@shared_task(name="prediccion.generar_predicciones")
def generar_predicciones_task(periodo: str = "semanal"):
    from ml.predict import generar_y_guardar_predicciones
    n = generar_y_guardar_predicciones(periodo)
    logger.info("Predicciones generadas: %s", n)
    return {"predicciones": n}


@shared_task(name="prediccion.generar_sugerencias")
def generar_sugerencias_task(periodo: str = "semanal"):
    from ml.analytics import generar_sugerencias_compra
    n = generar_sugerencias_compra(periodo)
    logger.info("Sugerencias de compra generadas: %s", n)
    return {"sugerencias": n}


@shared_task(name="prediccion.pipeline_diario")
def pipeline_diario_task(periodo: str = "semanal"):
    """Pipeline completo nocturno: consolida -> entrena -> predice -> sugiere."""
    from ml.data import consolidar_demanda_historica
    from ml.train_model import entrenar_todos
    from ml.predict import generar_y_guardar_predicciones
    from ml.analytics import generar_sugerencias_compra

    filas = consolidar_demanda_historica()
    resumen = entrenar_todos()
    predicciones = generar_y_guardar_predicciones(periodo)
    sugerencias = generar_sugerencias_compra(periodo)
    return {
        "demanda_filas": filas,
        "entrenamiento": resumen,
        "predicciones": predicciones,
        "sugerencias": sugerencias,
    }
