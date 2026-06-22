"""Registro de operaciones en la bitácora de auditoría."""
import json


def _ip_de(request):
    if request is None:
        return None
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _limpiar(data):
    """Convierte los datos a tipos JSON-serializables (str para Decimal/fechas)."""
    if data is None:
        return None
    try:
        return json.loads(json.dumps(data, default=str))
    except (TypeError, ValueError):
        return None


def registrar_bitacora(request, *, tabla, tipo, datos_anteriores=None, datos_nuevos=None):
    """Crea un registro en la bitácora. Nunca interrumpe la operación principal."""
    from .models import BitacoraAuditoria

    try:
        user = getattr(request, "user", None)
        empleado = getattr(user, "empleado", None) if user else None
        BitacoraAuditoria.objects.create(
            empleado=empleado,
            tabla_afectada=tabla,
            tipo_operacion=tipo,
            datos_anteriores=_limpiar(datos_anteriores),
            datos_nuevos=_limpiar(datos_nuevos),
            ip_origen=_ip_de(request),
        )
    except Exception:
        # La auditoría no debe romper la operación del usuario.
        pass
