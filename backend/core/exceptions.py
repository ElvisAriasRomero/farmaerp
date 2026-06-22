"""Manejador de excepciones personalizado para respuestas uniformes."""
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            "exito": False,
            "errores": response.data,
            "status_code": response.status_code,
        }
    return response
