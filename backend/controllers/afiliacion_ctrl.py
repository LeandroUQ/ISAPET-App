from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.database import SessionLocal, UsuarioDB, MascotaDB, AtencionDB
from fastapi import HTTPException
from services.plan_context import PlanContext  # Importa el contexto
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()


# Dependencia para obtener la sesión de base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------
# SIMULADOR
# ---------------------------------------------------------
@router.get("/simular_plan/{plan}")
def simular_plan(plan: str):
    tarifas = {
        "basico": {"precio": 15000, "cobertura": "Consultas generales y vacunas anuales."},
        "premium": {"precio": 35000, "cobertura": "Cobertura total, cirugías, emergencias y peluquería."}
    }
    if plan not in tarifas:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    return tarifas[plan]


# ---------------------------------------------------------
# AUTENTICACIÓN Y ROLES
# ---------------------------------------------------------
@router.post("/login")
def iniciar_sesion(usuario: str, contrasena: str, db: Session = Depends(get_db)):
    if usuario == "admin" and contrasena == "1234":
        return {"rol": "admin"}

    # NUEVO: Acceso para clínicas veterinarias
    if usuario == "vet" and contrasena == "vet123":
        return {"rol": "veterinaria"}

    afiliado = db.query(UsuarioDB).filter(UsuarioDB.cedula == usuario).first()
    if afiliado and contrasena == afiliado.cedula:
        return {
            "rol": "afiliado",
            "datos": {
                "id": afiliado.id,
                "nombre": afiliado.nombre,
                "plan": afiliado.plan,
                "estado": afiliado.estado,
                "mascotas": [{"id": m.id, "nombre": m.nombre, "tipo": m.tipo} for m in afiliado.mascotas]
            }
        }

    raise HTTPException(status_code=401, detail="Credenciales incorrectas")


# ---------------------------------------------------------
# CRUD DE AFILIADOS Y MASCOTAS
# ---------------------------------------------------------

# CREATE (Crear usuario y su primera mascota)
# 1. Define el esquema de datos (al inicio de tu archivo)
class UsuarioSchema(BaseModel):
    nombre: str
    cedula: str
    tipo_mascota: str
    nombre_mascota: str
    plan: str


# 2. Modifica el endpoint POST /registro
@router.post("/registro")
def registrar_afiliado(datos: UsuarioSchema, db: Session = Depends(get_db)):
    # Ahora accedes a los datos mediante 'datos.campo'
    existe = db.query(UsuarioDB).filter(UsuarioDB.cedula == datos.cedula).first()
    if existe:
        raise HTTPException(status_code=400, detail="La cédula ya está registrada")

    nuevo_usuario = UsuarioDB(nombre=datos.nombre, cedula=datos.cedula, plan=datos.plan, estado="Inactivo")
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    nueva_mascota = MascotaDB(nombre=datos.nombre_mascota, tipo=datos.tipo_mascota, usuario_id=nuevo_usuario.id)
    db.add(nueva_mascota)
    db.commit()

    return {"mensaje": "Afiliación exitosa", "usuario": {"id": nuevo_usuario.id}}


# READ (Listar todos)
@router.get("/usuarios")
def obtener_usuarios(db: Session = Depends(get_db)):
    usuarios = db.query(UsuarioDB).all()
    resultado = []
    for u in usuarios:
        resultado.append({
            "id": u.id,
            "nombre": u.nombre,
            "cedula": u.cedula,
            "plan": u.plan,
            "estado": u.estado,
            "mascotas": [{"id": m.id, "nombre": m.nombre, "tipo": m.tipo} for m in u.mascotas]
        })
    return resultado


# UPDATE (Actualizar usuario y su mascota principal)
class UsuarioUpdate(BaseModel):
    nombre: str
    cedula: str
    plan: str
    nombre_mascota: str  # Los incluimos porque tu lógica actual actualiza la mascota
    tipo_mascota: str

# 2. Modifica el endpoint PUT
@router.put("/usuarios/{usuario_id}")
def actualizar_usuario(usuario_id: int, datos: UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Actualizar datos del dueño usando 'datos.campo'
    usuario.nombre = datos.nombre
    usuario.cedula = datos.cedula
    usuario.plan = datos.plan

    # Actualizar la primera mascota
    if usuario.mascotas:
        mascota_principal = usuario.mascotas[0]
        mascota_principal.nombre = datos.nombre_mascota
        mascota_principal.tipo = datos.tipo_mascota
    else:
        nueva_mascota = MascotaDB(
            nombre=datos.nombre_mascota,
            tipo=datos.tipo_mascota,
            usuario_id=usuario.id
        )
        db.add(nueva_mascota)

    db.commit()
    return {"mensaje": "Usuario actualizado correctamente"}

# DELETE (Eliminar usuario)
@router.delete("/usuarios/{usuario_id}")
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Al eliminar al usuario, SQLAlchemy eliminará automáticamente sus mascotas gracias al cascade
    db.delete(usuario)
    db.commit()
    return {"mensaje": "Usuario y sus mascotas eliminados correctamente"}


@router.post("/usuarios/{usuario_id}/mascotas")
def agregar_mascota(usuario_id: int, nombre: str, tipo: str, db: Session = Depends(get_db)):
    usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # --- APLICANDO EL PATRÓN ESTRATEGIA ---
    contexto = PlanContext(usuario.plan)

    # 1. Verificamos si el plan permite servicios médicos
    if not contexto.verificar_acceso():
        raise HTTPException(status_code=403, detail="Tu plan actual no permite agregar mascotas.")

    # 2. Verificamos si el usuario ya alcanzó su límite de mascotas según su plan
    # (Suponiendo que usuario.mascotas es la lista relacionada en SQLAlchemy)
    if len(usuario.mascotas) >= contexto.obtener_limite():
        raise HTTPException(
            status_code=403,
            detail=f"Has alcanzado el límite de {contexto.obtener_limite()} mascotas para tu plan actual."
        )

    nueva_mascota = MascotaDB(nombre=nombre, tipo=tipo, usuario_id=usuario_id)
    db.add(nueva_mascota)
    db.commit()
    db.refresh(nueva_mascota)
    return {"mensaje": "Mascota agregada con éxito", "id": nueva_mascota.id}


@router.get("/veterinaria/buscar/{cedula}")
def buscar_cliente(cedula: str, db: Session = Depends(get_db)):
    cliente = db.query(UsuarioDB).filter(UsuarioDB.cedula == cedula).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return {
        "id": cliente.id,
        "nombre": cliente.nombre,
        "cedula": cliente.cedula,
        "plan": cliente.plan,
        "estado": cliente.estado,
        "mascotas": [{"id": m.id, "nombre": m.nombre, "tipo": m.tipo} for m in cliente.mascotas]
    }


@router.post("/veterinaria/atencion")
def registrar_atencion(mascota_id: int, motivo: str, db: Session = Depends(get_db)):
    fecha_actual = datetime.now().strftime("%Y-%m-%d %H:%M")

    nueva_atencion = AtencionDB(
        fecha=fecha_actual,
        motivo=motivo,
        veterinaria="Clínica ISAPET Central",  # En el futuro esto puede ser dinámico según quién inicie sesión
        mascota_id=mascota_id
    )
    db.add(nueva_atencion)
    db.commit()

    return {"mensaje": "Atención registrada exitosamente"}


@router.get("/atenciones")
def obtener_historial_atenciones(db: Session = Depends(get_db)):
    # Obtenemos todas las atenciones registradas
    atenciones = db.query(AtencionDB).all()

    resultado = []
    for a in atenciones:
        resultado.append({
            "id": a.id,
            "fecha": a.fecha,
            "motivo": a.motivo,
            "veterinaria": a.veterinaria,
            "mascota": a.mascota.nombre if a.mascota else "Desconocida",
            "tipo_mascota": a.mascota.tipo if a.mascota else "N/A",
            "dueno": a.mascota.dueno.nombre if a.mascota and a.mascota.dueno else "Desconocido",
            "cedula": a.mascota.dueno.cedula if a.mascota and a.mascota.dueno else "N/A"
        })

    # Invertimos la lista para que las atenciones más recientes salgan de primeras
    return list(reversed(resultado))


@router.post("/usuarios/{usuario_id}/pagar")
def procesar_pago(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario.estado = "Activo"
    db.commit()

    return {"mensaje": "Pago exitoso"}


@router.put("/usuarios/{usuario_id}/plan")
def cambiar_plan(usuario_id: int, nuevo_plan: str, db: Session = Depends(get_db)):
    usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario.plan = nuevo_plan
    usuario.estado = "Inactivo"  # Al cambiar o cancelar, se inactiva el servicio
    db.commit()

    return {"mensaje": "Plan actualizado correctamente"}
