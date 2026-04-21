from .plan_strategy import BasicoStrategy, PremiumStrategy, CanceladoStrategy

class PlanContext:
    def __init__(self, plan_nombre: str):
        # Mapeamos los planes a sus clases de estrategia
        self._strategies = {
            "basico": BasicoStrategy(),
            "premium": PremiumStrategy(),
            "cancelado": CanceladoStrategy()
        }
        # Si no encuentra el plan, por seguridad, asignamos Cancelado
        self.strategy = self._strategies.get(plan_nombre.lower(), CanceladoStrategy())

    def verificar_acceso(self):
        return self.strategy.puede_acceder_servicios()

    def obtener_limite(self):
        return self.strategy.limite_mascotas()