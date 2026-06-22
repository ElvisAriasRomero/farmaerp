"""Permisos basados en la Matriz de Casos de Uso (Administrador / Empleado / Cliente).

Cada accion HTTP se mapea a una operacion CRUD:
    GET/HEAD/OPTIONS -> "R"   (Read)
    POST             -> "C"   (Create)
    PUT/PATCH        -> "U"   (Update)
    DELETE           -> "D"   (Delete)

Cada vista declara su matriz de permisos con el atributo `permisos`, p.ej.:

    class ProductoViewSet(viewsets.ModelViewSet):
        permission_classes = [MatrizPermisos]
        permisos = {
            "administrador": "CRUD",
            "empleado": "CRU",
            "cliente": "R",
        }

El actor se determina asi:
    - is_superuser o empleado con rol "Administrador" -> "administrador"
    - tipo == "empleado"                              -> "empleado"
    - tipo == "cliente"                               -> "cliente"
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS

ROL_ADMIN = "Administrador"

MAPA_METODO_OPERACION = {
    "GET": "R",
    "HEAD": "R",
    "OPTIONS": "R",
    "POST": "C",
    "PUT": "U",
    "PATCH": "U",
    "DELETE": "D",
}


def obtener_actor(user) -> str | None:
    """Devuelve 'administrador', 'empleado', 'cliente' o None."""
    if not (user and user.is_authenticated):
        return None
    if user.is_superuser:
        return "administrador"
    empleado = getattr(user, "empleado", None)
    if empleado is not None:
        if getattr(empleado.rol, "nombre_rol", None) == ROL_ADMIN:
            return "administrador"
        return "empleado"
    if getattr(user, "tipo", None) == "cliente":
        return "cliente"
    if getattr(user, "tipo", None) == "empleado":
        return "empleado"
    return None


class MatrizPermisos(BasePermission):
    """Aplica la matriz `permisos` declarada en la vista."""

    message = "No tienes permiso para realizar esta accion."

    def has_permission(self, request, view):
        actor = obtener_actor(request.user)
        if actor is None:
            return False
        if actor == "administrador":
            return True  # CRUD total sobre todo
        permisos = getattr(view, "permisos", {})
        operaciones = permisos.get(actor, "")
        operacion = MAPA_METODO_OPERACION.get(request.method, "")
        return operacion in operaciones

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class EsAdministrador(BasePermission):
    """Solo administradores (superuser o rol Administrador)."""

    message = "Requiere rol Administrador."

    def has_permission(self, request, view):
        return obtener_actor(request.user) == "administrador"


class EsEmpleadoOAdmin(BasePermission):
    """Empleados o administradores (para analitica y dashboard)."""

    message = "Requiere ser empleado o administrador."

    def has_permission(self, request, view):
        return obtener_actor(request.user) in ("empleado", "administrador")


class SoloLecturaParaCliente(BasePermission):
    """Cliente solo lectura; empleado/admin escritura."""

    def has_permission(self, request, view):
        actor = obtener_actor(request.user)
        if actor is None:
            return False
        if request.method in SAFE_METHODS:
            return True
        return actor in ("empleado", "administrador")
