"""Utilidades compartidas."""
from datetime import datetime


def generar_numero_factura(prefijo: str = "FAC") -> str:
    """Genera un numero de factura unico basado en timestamp."""
    return f"{prefijo}-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
