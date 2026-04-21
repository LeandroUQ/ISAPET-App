from abc import ABC, abstractmethod

# Interfaz base
class PlanStrategy(ABC):
    @abstractmethod
    def puede_acceder_servicios(self) -> bool:
        pass

    @abstractmethod
    def limite_mascotas(self) -> int:
        pass

# Implementaciones concretas
class BasicoStrategy(PlanStrategy):
    def puede_acceder_servicios(self): return True
    def limite_mascotas(self): return 1

class PremiumStrategy(PlanStrategy):
    def puede_acceder_servicios(self): return True
    def limite_mascotas(self): return 5

class CanceladoStrategy(PlanStrategy):
    def puede_acceder_servicios(self): return False
    def limite_mascotas(self): return 0