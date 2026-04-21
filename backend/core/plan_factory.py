from abc import ABC, abstractmethod

class PlanMascota(ABC):
    @abstractmethod
    def obtener_cobertura(self) -> str: pass

    @abstractmethod
    def obtener_precio(self) -> float: pass

class PlanBasico(PlanMascota):
    def obtener_cobertura(self): return "Consultas generales"
    def obtener_precio(self): return 35000.0

class PlanPremium(PlanMascota):
    def obtener_cobertura(self): return "Consultas y cirugías"
    def obtener_precio(self): return 80000.0

class PlanFactory:
    @staticmethod
    def crear_plan(tipo_plan: str) -> PlanMascota:
        tipo = tipo_plan.lower()
        if tipo == "basico": return PlanBasico()
        elif tipo == "premium": return PlanPremium()
        else: raise ValueError(f"El plan '{tipo_plan}' no existe.")