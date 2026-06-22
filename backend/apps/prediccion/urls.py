from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("demandas-historicas", views.DemandasHistoricasViewSet)
router.register("predicciones", views.DatosPrediccionViewSet)
router.register("compras-sugeridas", views.CompraSugeridaViewSet)

urlpatterns = [
    # Prediccion
    path("prediccion/producto/<int:id_producto>/", views.PredecirProductoView.as_view()),
    path("prediccion/entrenar/", views.entrenar_modelos),
    path("prediccion/generar/", views.generar_predicciones),
    path("prediccion/sugerencias/generar/", views.generar_sugerencias),
    path("prediccion/pipeline/", views.ejecutar_pipeline),
    # Dashboard / analitica
    path("dashboard/", views.DashboardView.as_view()),
    path("analitica/kpis/", views.kpis),
    path("analitica/ventas-diarias/", views.ventas_diarias),
    path("analitica/ventas-mensuales/", views.ventas_mensuales),
    path("analitica/top-productos/", views.top_productos),
    path("analitica/rentabilidad/", views.rentabilidad),
    path("analitica/alertas-stock/", views.alertas_stock),
    path("", include(router.urls)),
]
