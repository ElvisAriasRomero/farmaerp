from rest_framework import viewsets

from core.mixins import AuditoriaMixin
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import MatrizPermisos, obtener_actor
from core.mixins import FiltrarPorClienteMixin
from .models import Venta, DetalleVenta
from .serializers import VentaSerializer, DetalleVentaSerializer
from .services import (
    cancelar_venta, crear_venta, confirmar_venta,
    crear_reserva, cobrar_reserva, entregar_reserva,
)


class VentaViewSet(AuditoriaMixin, FiltrarPorClienteMixin, viewsets.ModelViewSet):
    """CU14 - Gestionar venta."""
    queryset = Venta.objects.select_related("cliente", "empleado").prefetch_related("detalles").all().order_by("-id_venta")
    serializer_class = VentaSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "CRU", "cliente": "CRU"}
    lookup_cliente = "cliente"
    filterset_fields = ["estado", "cliente", "empleado", "origen"]

    @action(detail=True, methods=["post"])
    def cancelar(self, request, pk=None):
        venta = self.get_object()
        cancelar_venta(venta)
        return Response(self.get_serializer(venta).data)

    @action(detail=True, methods=["post"])
    def confirmar(self, request, pk=None):
        """Confirma la venta: registra el pago y emite factura si se pidió."""
        from django.core.exceptions import ValidationError
        venta = self.get_object()
        data = request.data
        try:
            confirmar_venta(
                venta,
                metodo_pago=data.get("metodo_pago", "efectivo"),
                monto=data.get("monto"),
                con_factura=bool(data.get("con_factura")),
                nit_ci=data.get("nit_ci"),
                razon_social=data.get("razon_social"),
            )
        except ValidationError as exc:
            msg = exc.messages[0] if getattr(exc, "messages", None) else str(exc)
            return Response({"detail": msg}, status=400)
        venta.refresh_from_db()
        return Response(self.get_serializer(venta).data)

    @action(detail=True, methods=["post"])
    def cobrar(self, request, pk=None):
        """Cobra una reserva en la farmacia (registra el pago, entra a caja)."""
        from django.core.exceptions import ValidationError
        venta = self.get_object()
        data = request.data
        try:
            cobrar_reserva(
                venta,
                metodo_pago=data.get("metodo_pago", "efectivo"),
                monto=data.get("monto"),
                con_factura=bool(data.get("con_factura")),
                nit_ci=data.get("nit_ci"),
                razon_social=data.get("razon_social"),
            )
        except ValidationError as exc:
            msg = exc.messages[0] if getattr(exc, "messages", None) else str(exc)
            return Response({"detail": msg}, status=400)
        venta.refresh_from_db()
        return Response(self.get_serializer(venta).data)

    @action(detail=True, methods=["post"])
    def entregar(self, request, pk=None):
        """Marca la reserva como entregada (el cliente retiró)."""
        from django.core.exceptions import ValidationError
        venta = self.get_object()
        try:
            entregar_reserva(venta)
        except ValidationError as exc:
            msg = exc.messages[0] if getattr(exc, "messages", None) else str(exc)
            return Response({"detail": msg}, status=400)
        venta.refresh_from_db()
        return Response(self.get_serializer(venta).data)


class DetalleVentaViewSet(AuditoriaMixin, FiltrarPorClienteMixin, viewsets.ModelViewSet):
    """CU15 - Registrar detalle de venta."""
    queryset = DetalleVenta.objects.select_related("producto", "venta").all()
    serializer_class = DetalleVentaSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "CRU"}
    lookup_cliente = "venta__cliente"
    filterset_fields = ["venta", "producto"]


class CheckoutView(APIView):
    """Checkout de la tienda online.

    El cliente autenticado confirma su carrito y se genera una venta
    (sin empleado, ya que es una compra en línea) descontando stock.

    Body esperado: {"items": [{"producto": <id>, "cantidad": <n>}, ...]}
    El precio se toma del precio_venta actual de cada producto.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.productos.models import Producto

        if obtener_actor(request.user) != "cliente":
            return Response(
                {"detail": "Solo los clientes pueden realizar compras en línea."},
                status=403,
            )
        cliente = getattr(request.user, "cliente", None)
        if cliente is None:
            return Response(
                {"detail": "Tu cuenta no tiene un perfil de cliente asociado."},
                status=400,
            )

        items = request.data.get("items", [])
        if not items:
            return Response({"detail": "El carrito está vacío."}, status=400)

        detalles = []
        for it in items:
            try:
                producto = Producto.objects.get(pk=it.get("producto"))
                cantidad = int(it.get("cantidad", 0))
            except (Producto.DoesNotExist, TypeError, ValueError):
                return Response(
                    {"detail": "Hay un producto inválido en el carrito."},
                    status=400,
                )
            if cantidad <= 0:
                return Response(
                    {"detail": "Las cantidades deben ser mayores a cero."},
                    status=400,
                )
            detalles.append({
                "producto": producto,
                "cantidad": cantidad,
                "precio_unitario": producto.precio_venta,
            })

        from django.core.exceptions import ValidationError

        metodo_pago = request.data.get("metodo_pago", "farmacia")
        if metodo_pago not in ("qr", "farmacia"):
            metodo_pago = "farmacia"

        try:
            venta = crear_reserva(
                cliente, detalles,
                metodo_pago=metodo_pago,
                con_factura=bool(request.data.get("con_factura")),
                nit_ci=request.data.get("nit_ci"),
                razon_social=request.data.get("razon_social"),
            )
        except ValidationError as exc:
            mensaje = exc.messages[0] if getattr(exc, "messages", None) else str(exc)
            return Response({"detail": mensaje}, status=400)

        return Response(VentaSerializer(venta).data, status=201)
