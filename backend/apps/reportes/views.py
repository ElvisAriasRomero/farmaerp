from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from core.mixins import AuditoriaMixin

from core.permissions import EsAdministrador
from .models import ReporteGenerado
from .serializers import ReporteGeneradoSerializer
from .exporters import generar_archivo


class ReporteGeneradoViewSet(AuditoriaMixin, viewsets.ModelViewSet):
    """CU22 - Exportar reporte PDF/Excel - solo Administrador."""
    queryset = ReporteGenerado.objects.select_related("empleado").all().order_by("-id_reporte")
    serializer_class = ReporteGeneradoSerializer
    permission_classes = [EsAdministrador]
    filterset_fields = ["tipo", "formato", "empleado"]

    @action(detail=True, methods=["get"])
    def descargar(self, request, pk=None):
        """Genera y descarga el archivo real (PDF/Excel) con datos del período."""
        reporte = self.get_object()
        contenido, nombre, content_type = generar_archivo(reporte)
        resp = HttpResponse(contenido, content_type=content_type)
        resp["Content-Disposition"] = f'attachment; filename="{nombre}"'
        resp["Access-Control-Expose-Headers"] = "Content-Disposition"
        return resp
