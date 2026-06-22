"""Mixins de acceso a datos a nivel de propiedad (object-level).

Permiten que un usuario de tipo 'cliente' solo vea y modifique sus propios
registros, mientras que empleados y administradores ven todo.
"""
from core.permissions import obtener_actor


class FiltrarPorClienteMixin:
    """Restringe el queryset al cliente autenticado.

    La vista debe declarar `lookup_cliente`, el lookup ORM que relaciona el
    modelo con el cliente. Ejemplos:
        - Carrito:        "cliente"
        - DetalleCarrito: "carrito__cliente"
        - Venta:          "cliente"
        - Factura:        "venta__cliente"
        - Pago:           "factura__venta__cliente"

    Si `lookup_cliente` es None, se filtra por la PK del propio Cliente
    (caso del ClienteViewSet).
    """

    lookup_cliente = "cliente"

    def get_queryset(self):
        qs = super().get_queryset()
        actor = obtener_actor(self.request.user)
        if actor != "cliente":
            return qs
        cliente = getattr(self.request.user, "cliente", None)
        if cliente is None:
            return qs.none()
        if self.lookup_cliente is None:
            return qs.filter(pk=cliente.pk)
        return qs.filter(**{self.lookup_cliente: cliente})


class AuditoriaMixin:
    """Registra automáticamente en la bitácora las operaciones de escritura
    (crear / actualizar / eliminar) de un ModelViewSet.

    La tabla afectada se toma de `model._meta.db_table`.
    """

    def _tabla(self, instance):
        return instance._meta.db_table

    def perform_create(self, serializer):
        from apps.auditoria.services import registrar_bitacora
        instance = serializer.save()
        registrar_bitacora(
            self.request,
            tabla=self._tabla(instance),
            tipo="INSERT",
            datos_nuevos=serializer.data,
        )
        return instance

    def perform_update(self, serializer):
        from apps.auditoria.services import registrar_bitacora
        anteriores = None
        try:
            anteriores = self.get_serializer(serializer.instance).data
        except Exception:
            anteriores = None
        instance = serializer.save()
        registrar_bitacora(
            self.request,
            tabla=self._tabla(instance),
            tipo="UPDATE",
            datos_anteriores=anteriores,
            datos_nuevos=serializer.data,
        )
        return instance

    def perform_destroy(self, instance):
        from apps.auditoria.services import registrar_bitacora
        tabla = self._tabla(instance)
        try:
            anteriores = self.get_serializer(instance).data
        except Exception:
            anteriores = None
        registrar_bitacora(
            self.request,
            tabla=tabla,
            tipo="DELETE",
            datos_anteriores=anteriores,
        )
        instance.delete()
