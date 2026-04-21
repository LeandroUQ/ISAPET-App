from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

# Configuración de SQLite (creará un archivo llamado isapet.db)
SQLALCHEMY_DATABASE_URL = "sqlite:///./isapet.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# --- MODELOS DE TABLAS ---

class UsuarioDB(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    cedula = Column(String, unique=True, index=True)
    plan = Column(String)
    estado = Column(String, default="Activo")  # Preparado para el módulo de pagos

    # Relación: Un usuario puede tener muchas mascotas.
    # cascade="all, delete-orphan" asegura que si borras al dueño, se borran sus mascotas.
    mascotas = relationship("MascotaDB", back_populates="dueno", cascade="all, delete-orphan")


class MascotaDB(Base):
    __tablename__ = "mascotas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    tipo = Column(String)  # Perro, Gato, etc.
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))

    # Relación inversa hacia el dueño
    dueno = relationship("UsuarioDB", back_populates="mascotas")


class AtencionDB(Base):
    __tablename__ = "atenciones"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(String)
    motivo = Column(String) # Ej: Consulta general, Vacuna, Cirugía
    veterinaria = Column(String) # Nombre de la clínica
    mascota_id = Column(Integer, ForeignKey("mascotas.id"))

    # Relación inversa (opcional, por si luego queremos ver el historial desde la mascota)
    mascota = relationship("MascotaDB", backref="atenciones")
