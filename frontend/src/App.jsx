import {useState} from 'react'
import {Toaster, toast} from 'react-hot-toast';

function App() {
    const [vistaActiva, setVistaActiva] = useState('login')

    // Estados de datos
    const [credenciales, setCredenciales] = useState({usuario: '', contrasena: ''})
    const [errorLogin, setErrorLogin] = useState(null)
    const [datosAfiliado, setDatosAfiliado] = useState(null)
    const [listaUsuarios, setListaUsuarios] = useState([])

    // Estados para el Historial Clínico
    const [listaAtenciones, setListaAtenciones] = useState([])
    const [pestanaAdmin, setPestanaAdmin] = useState('afiliados')

    // NUEVO: Estados Simulador de Planes
    const [planSeleccionado, setPlanSeleccionado] = useState('basico')
    const [datosPlan, setDatosPlan] = useState(null)

    // Estados de CRUD y formularios
    const [formData, setFormData] = useState({
        nombre: '',
        cedula: '',
        tipo_mascota: 'perro',
        nombre_mascota: '',
        plan: 'basico'
    })
    const [modoEdicion, setModoEdicion] = useState(false)
    const [idEdicion, setIdEdicion] = useState(null)

    // Estados Panel Veterinaria
    const [busquedaCedula, setBusquedaCedula] = useState('')
    const [clienteEncontrado, setClienteEncontrado] = useState(null)
    const [errorBusqueda, setErrorBusqueda] = useState(null)

    // Estados para AGREGAR MASCOTAS EXTRA
    const [showModalMascota, setShowModalMascota] = useState(false)
    const [idUsuarioParaMascota, setIdUsuarioParaMascota] = useState(null)
    const [nuevaMascota, setNuevaMascota] = useState({nombre: '', tipo: 'perro'})

    // Estados para pagos del afiliado
    const [procesandoPago, setProcesandoPago] = useState(false)
    const [mostrarOpcionesPlan, setMostrarOpcionesPlan] = useState(false)

    // --- FUNCIONES API ---

    // NUEVO: Función para consultar el simulador
    const handleSimularPlan = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/simular_plan/${planSeleccionado}`)
            if (res.ok) {
                const data = await res.json()
                setDatosPlan(data)
            }
        } catch (err) {
            console.error("Error al simular plan", err)
        }
    }

    const fetchUsuarios = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/v1/usuarios')
            const data = await res.json()
            setListaUsuarios(data)
        } catch (err) {
            console.error(err)
        }
    }

    const fetchAtenciones = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/v1/atenciones')
            const data = await res.json()
            setListaAtenciones(data)
        } catch (err) {
            console.error(err)
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/login?usuario=${credenciales.usuario}&contrasena=${credenciales.contrasena}`, {method: 'POST'})
            if (!res.ok) throw new Error("Acceso denegado")
            const data = await res.json()

            if (data.rol === 'admin') {
                fetchUsuarios()
                fetchAtenciones()
                setVistaActiva('panel_admin')
            } else if (data.rol === 'veterinaria') {
                setVistaActiva('panel_veterinaria')
                setClienteEncontrado(null)
                setBusquedaCedula('')
            } else {
                setDatosAfiliado(data.datos)
                setVistaActiva('panel_afiliado')
            }
        } catch (err) {
            setErrorLogin(err.message)
        }
    }

    const handlePagarMensualidad = async () => {
        setProcesandoPago(true)
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/usuarios/${datosAfiliado.id}/pagar`, {method: 'POST'})
            if (res.ok) {
                setDatosAfiliado({...datosAfiliado, estado: 'Activo'})
                toast.success("¡Pago procesado con éxito!"); // Feedback visual
            } else {
                throw new Error("Error en el servidor");
            }
        } catch (err) {
            toast.error("Hubo un problema al procesar el pago.");
        } finally {
            setProcesandoPago(false)
        }
    }

    const handleGuardarUsuario = async (e) => {
        e.preventDefault()
        try {
            const method = modoEdicion ? 'PUT' : 'POST'
            const url = modoEdicion
                ? `http://127.0.0.1:8000/api/v1/usuarios/${idEdicion}`
                : `http://127.0.0.1:8000/api/v1/registro`

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json' // ESTO ES VITAL
                },
                body: JSON.stringify(formData) // Enviamos el JSON
            })

            if (res.ok) {
                toast.success(modoEdicion ? "¡Usuario actualizado!" : "¡Registro exitoso!")
                setFormData({nombre: '', cedula: '', tipo_mascota: 'perro', nombre_mascota: '', plan: 'basico'})
                setModoEdicion(false)
                setIdEdicion(null)
                fetchUsuarios()
            } else {
                const errorData = await res.json()
                console.log("Error detallado:", errorData) // <-- Agrega este console.log
                toast.error(errorData.detail || "Error al guardar el usuario")
            }
        } catch (err) {
            toast.error("Error de conexión al guardar")
        }
    }


    const handleAddExtraPet = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/usuarios/${idUsuarioParaMascota}/mascotas?nombre=${nuevaMascota.nombre}&tipo=${nuevaMascota.tipo}`, {method: 'POST'})

            if (res.ok) {
                setShowModalMascota(false)
                setNuevaMascota({nombre: '', tipo: 'perro'})
                fetchUsuarios()
                toast.success("Mascota agregada correctamente");
            } else {
                // El backend responde con un error 403 si falla la regla de negocio
                const errorData = await res.json();
                toast.error(errorData.detail || "No se pudo agregar la mascota");
            }
        } catch (err) {
            toast.error("Error de conexión");
        }
    }

    const handleEliminar = async (id) => {
        if (window.confirm("¿Eliminar afiliado y sus mascotas?")) {
            await fetch(`http://127.0.0.1:8000/api/v1/usuarios/${id}`, {method: 'DELETE'})
            fetchUsuarios()
        }
    }

    const handleBuscarCliente = async (e) => {
        e.preventDefault()
        setErrorBusqueda(null)
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/veterinaria/buscar/${busquedaCedula}`)
            if (!res.ok) throw new Error("Cliente no registrado o cédula incorrecta")
            const data = await res.json()
            setClienteEncontrado(data)
        } catch (err) {
            setClienteEncontrado(null)
            setErrorBusqueda(err.message)
        }
    }

    const handleRegistrarAtencion = async (mascotaId, nombreMascota) => {
        const motivo = window.prompt(`¿Qué procedimiento se le realizará a ${nombreMascota}? (Ej: Consulta, Vacuna)`)
        if (!motivo) return

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/veterinaria/atencion?mascota_id=${mascotaId}&motivo=${motivo}`, {method: 'POST'})
            if (res.ok) {
                toast.success(`✅ Atención registrada para ${nombreMascota}`)
            }
        } catch (err) {
            console.error("Error al registrar", err)
        }
    }

    const handleCambiarPlan = async (nuevoPlan) => {
        // ... confirmación previa ...
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/usuarios/${datosAfiliado.id}/plan?nuevo_plan=${nuevoPlan}`, {method: 'PUT'})
            if (res.ok) {
                setDatosAfiliado({...datosAfiliado, plan: nuevoPlan, estado: 'Inactivo'})
                setMostrarOpcionesPlan(false)
                // AQUÍ LA MEJORA:
                toast.success(`Plan cambiado a ${nuevoPlan.toUpperCase()} correctamente`);
            }
        } catch (err) {
            toast.error("Hubo un error al actualizar el plan, intenta de nuevo.");
        }
    }

    // --- VISTAS ---
    return (
        <>
            <Toaster position="top-right" reverseOrder={false}/>
            {vistaActiva === 'login' && (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                    <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Tarjeta de Login */}
                        <div className="bg-white p-10 rounded-3xl shadow-xl border flex flex-col justify-center">
                            <h1 className="text-4xl font-black text-blue-700 text-center mb-8">ISAPET</h1>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <input type="text" placeholder="Usuario (Cédula)"
                                       className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-100"
                                       value={credenciales.usuario}
                                       onChange={(e) => setCredenciales({...credenciales, usuario: e.target.value})}/>
                                <input type="password" placeholder="Contraseña"
                                       className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-100"
                                       value={credenciales.contrasena}
                                       onChange={(e) => setCredenciales({
                                           ...credenciales,
                                           contrasena: e.target.value
                                       })}/>
                                <button
                                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 shadow-lg transition-all">Ingresar
                                    al Portal
                                </button>
                                {errorLogin && <p className="text-red-500 text-center font-bold mt-4">{errorLogin}</p>}
                            </form>
                        </div>

                        {/* Tarjeta de Simulador (NUEVA) */}
                        <div
                            className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-3xl shadow-xl text-white flex flex-col justify-center">
                            <h2 className="text-2xl font-black mb-2">Simulador de Planes</h2>
                            <p className="text-blue-200 text-sm mb-8">Descubre los beneficios y tarifas para tu mascota
                                antes de
                                afiliarte.</p>

                            <form onSubmit={handleSimularPlan} className="space-y-4">
                                <select
                                    className="w-full p-4 bg-white/10 text-white rounded-xl outline-none border border-blue-400 focus:ring-2 ring-white/50 backdrop-blur-sm [&>option]:text-slate-800"
                                    value={planSeleccionado}
                                    onChange={(e) => {
                                        setPlanSeleccionado(e.target.value)
                                        setDatosPlan(null) // Limpiamos el resultado anterior al cambiar
                                    }}
                                >
                                    <option value="basico">Plan Básico</option>
                                    <option value="premium">Plan Premium</option>
                                </select>
                                <button
                                    className="w-full bg-white text-blue-700 font-bold py-4 rounded-xl hover:bg-blue-50 shadow-lg transition-all">
                                    Consultar Beneficios
                                </button>
                            </form>

                            {/* Resultados de la Simulación */}
                            {datosPlan && (
                                <div
                                    className="mt-8 p-6 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm animate-in fade-in zoom-in-95">
                                    <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-1">Costo
                                        Mensual</p>
                                    <p className="text-3xl font-black mb-4">
                                        ${datosPlan.precio.toLocaleString('es-CO')}
                                    </p>
                                    <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-1">Cobertura
                                        Incluida</p>
                                    <p className="text-sm font-medium text-white/90 leading-relaxed">
                                        {datosPlan.cobertura}
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}

            {vistaActiva === 'panel_veterinaria' && (
                <div className="min-h-screen bg-slate-50 p-6 md:p-12">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <header
                            className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <div>
                                <h2 className="text-2xl font-black text-emerald-600">Portal Clínico</h2>
                                <p className="text-sm text-slate-400 font-bold">Recepción y Validación de Pacientes</p>
                            </div>
                            <button onClick={() => {
                                setVistaActiva('login');
                                setCredenciales({usuario: '', contrasena: ''})
                            }} className="text-slate-400 font-bold hover:text-red-500">Salir
                            </button>
                        </header>

                        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 text-center">
                            <h3 className="text-xl font-bold mb-4 text-slate-700">Buscar Afiliado</h3>
                            <form onSubmit={handleBuscarCliente} className="flex gap-4 max-w-md mx-auto">
                                <input type="text" placeholder="Ingresa la cédula del dueño..."
                                       className="flex-1 p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-emerald-100"
                                       value={busquedaCedula} onChange={(e) => setBusquedaCedula(e.target.value)}
                                       required/>
                                <button type="submit"
                                        className="bg-emerald-500 text-white font-bold px-8 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all">Buscar
                                </button>
                            </form>
                            {errorBusqueda && <p className="text-red-500 font-bold mt-4">{errorBusqueda}</p>}
                        </div>

                        {clienteEncontrado && (
                            <div
                                className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800">{clienteEncontrado.nombre}</h3>
                                        <p className="text-slate-500">C.C. {clienteEncontrado.cedula}</p>
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={`inline-block px-4 py-2 rounded-xl text-sm font-black tracking-widest uppercase mb-1 ${clienteEncontrado.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {clienteEncontrado.estado}
                                        </span>
                                        <p className="font-bold text-slate-400">PLAN {clienteEncontrado.plan.toUpperCase()}</p>
                                    </div>
                                </div>

                                <h4 className="font-bold text-slate-400 uppercase text-sm mb-4">Mascotas
                                    Registradas</h4>
                                <div className="space-y-3">
                                    {clienteEncontrado.mascotas.length === 0 ? (
                                        <p className="text-slate-500 italic">No hay mascotas registradas.</p>
                                    ) : (
                                        clienteEncontrado.mascotas.map(m => (
                                            <div key={m.id}
                                                 className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div>
                                                    <p className="font-bold text-slate-700 text-lg capitalize">{m.nombre}</p>
                                                    <p className="text-xs font-bold text-slate-400 uppercase">{m.tipo}</p>
                                                </div>
                                                <button onClick={() => handleRegistrarAtencion(m.id, m.nombre)}
                                                        disabled={clienteEncontrado.estado !== 'Activo'}
                                                        className={`font-bold px-6 py-3 rounded-xl transition-all ${clienteEncontrado.estado === 'Activo' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                                    Registrar Atención
                                                </button>
                                            </div>
                                        )))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {vistaActiva === 'panel_admin' && (
                <div className="min-h-screen bg-slate-50 p-6 md:p-12 relative">

                    {showModalMascota && (
                        <div
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm">
                                <h3 className="text-xl font-bold mb-4">Añadir Mascota</h3>
                                <form onSubmit={handleAddExtraPet} className="space-y-4">
                                    <input required type="text" placeholder="Nombre de la mascota"
                                           className="w-full p-3 bg-slate-50 rounded-xl outline-none"
                                           value={nuevaMascota.nombre}
                                           onChange={(e) => setNuevaMascota({
                                               ...nuevaMascota,
                                               nombre: e.target.value
                                           })}/>
                                    <select className="w-full p-3 bg-slate-50 rounded-xl" value={nuevaMascota.tipo}
                                            onChange={(e) => setNuevaMascota({...nuevaMascota, tipo: e.target.value})}>
                                        <option value="perro">Perro</option>
                                        <option value="gato">Gato</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                    <div className="flex gap-2 pt-2">
                                        <button type="submit"
                                                className="flex-1 bg-green-500 text-white font-bold py-3 rounded-xl">Guardar
                                        </button>
                                        <button type="button" onClick={() => setShowModalMascota(false)}
                                                className="flex-1 bg-slate-100 text-slate-500 font-bold py-3 rounded-xl">Cerrar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="max-w-6xl mx-auto space-y-6">
                        <header className="flex justify-between items-center">
                            <h2 className="text-2xl font-black text-blue-700 uppercase">Panel de Control</h2>
                            <button onClick={() => setVistaActiva('login')}
                                    className="text-slate-400 font-bold hover:text-red-500">Salir
                            </button>
                        </header>

                        <div className="flex gap-4 border-b border-slate-200 pb-2">
                            <button onClick={() => {
                                setPestanaAdmin('afiliados');
                                fetchUsuarios();
                            }}
                                    className={`font-bold pb-2 border-b-4 transition-all ${pestanaAdmin === 'afiliados' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                Gestión de Afiliados
                            </button>
                            <button onClick={() => {
                                setPestanaAdmin('historial');
                                fetchAtenciones();
                            }}
                                    className={`font-bold pb-2 border-b-4 transition-all ${pestanaAdmin === 'historial' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                Registro Clínico
                            </button>
                        </div>

                        {pestanaAdmin === 'afiliados' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                                <div className="bg-white p-8 rounded-3xl shadow-lg border h-fit">
                                    <h3 className="font-bold text-lg mb-6">{modoEdicion ? 'Editar Cliente' : 'Nuevo Registro'}</h3>
                                    <form onSubmit={handleGuardarUsuario} className="space-y-4">
                                        <input required type="text" placeholder="Nombre Dueño"
                                               className="w-full p-3 bg-slate-50 rounded-xl outline-none"
                                               value={formData.nombre}
                                               onChange={(e) => setFormData({...formData, nombre: e.target.value})}/>
                                        <input required type="text" placeholder="Cédula"
                                               className="w-full p-3 bg-slate-50 rounded-xl outline-none"
                                               value={formData.cedula}
                                               onChange={(e) => setFormData({...formData, cedula: e.target.value})}/>
                                        <>
                                            <input required type="text" placeholder="Nombre Mascota"
                                                   className="w-full p-3 bg-slate-50 rounded-xl outline-none"
                                                   value={formData.nombre_mascota} onChange={(e) => setFormData({
                                                ...formData,
                                                nombre_mascota: e.target.value
                                            })}/>
                                            <select className="w-full p-3 bg-slate-50 rounded-xl"
                                                    value={formData.tipo_mascota} onChange={(e) => setFormData({
                                                ...formData,
                                                tipo_mascota: e.target.value
                                            })}>
                                                <option value="perro">Perro</option>
                                                <option value="gato">Gato</option>
                                            </select>
                                        </>

                                        <select className="w-full p-3 bg-slate-50 rounded-xl" value={formData.plan}
                                                onChange={(e) => setFormData({...formData, plan: e.target.value})}>
                                            <option value="basico">Plan Básico</option>
                                            <option value="premium">Plan Premium</option>
                                        </select>
                                        <button
                                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg ${modoEdicion ? 'bg-amber-500' : 'bg-blue-600'}`}>
                                            {modoEdicion ? 'Actualizar Datos' : 'Registrar Afiliado'}
                                        </button>
                                        {modoEdicion && (
                                            <button type="button" onClick={() => {
                                                setModoEdicion(false)
                                                setIdEdicion(null)
                                                setFormData({
                                                    nombre: '',
                                                    cedula: '',
                                                    tipo_mascota: 'perro',
                                                    nombre_mascota: '',
                                                    plan: 'basico'
                                                })
                                            }}
                                                    className="w-full py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">
                                                Cancelar Edición
                                            </button>
                                        )}
                                    </form>
                                </div>

                                <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg border overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase">
                                            <tr>
                                                <th className="p-6">Cliente</th>
                                                <th className="p-6">Mascotas</th>
                                                <th className="p-6">Plan</th>
                                                <th className="p-6 text-center">Acciones</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                            {listaUsuarios.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-6">
                                                        <p className="font-bold text-slate-700">{u.nombre}</p>
                                                        <p className="text-xs text-slate-400">{u.cedula}</p>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {u.mascotas.map(m => (
                                                                <span key={m.id}
                                                                      className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold border border-blue-100 uppercase">
                                                                    {m.nombre} ({m.tipo})
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <button onClick={() => {
                                                            setIdUsuarioParaMascota(u.id);
                                                            setShowModalMascota(true);
                                                        }}
                                                                className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-md font-bold border border-green-100 hover:bg-green-100">
                                                            + Añadir Mascota
                                                        </button>
                                                    </td>
                                                    <td className="p-6">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-bold ${u.plan === 'premium' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                                                            {u.plan}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 flex justify-center gap-3">
                                                        <button onClick={() => {
                                                            setModoEdicion(true);
                                                            setIdEdicion(u.id);

                                                            // Extraemos los datos de la mascota si tiene, o ponemos unos por defecto
                                                            const mascotaPrincipal = u.mascotas.length > 0 ? u.mascotas[0] : {
                                                                nombre: '',
                                                                tipo: 'perro'
                                                            };

                                                            setFormData({
                                                                nombre: u.nombre,
                                                                cedula: u.cedula,
                                                                nombre_mascota: mascotaPrincipal.nombre,
                                                                tipo_mascota: mascotaPrincipal.tipo,
                                                                plan: u.plan
                                                            })
                                                        }} className="text-slate-400 hover:text-amber-500">✏️
                                                        </button>
                                                        <button onClick={() => handleEliminar(u.id)}
                                                                className="text-slate-400 hover:text-red-500">🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {pestanaAdmin === 'historial' && (
                            <div className="bg-white rounded-3xl shadow-lg border overflow-hidden mt-4">
                                <div
                                    className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700 text-lg">Historial de Atenciones
                                        Veterinarias</h3>
                                    <span
                                        className="text-xs bg-white border px-3 py-1 rounded-full font-bold text-slate-500">Total: {listaAtenciones.length}</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-white text-slate-400 text-xs font-bold uppercase border-b">
                                        <tr>
                                            <th className="p-6">Fecha y Hora</th>
                                            <th className="p-6">Mascota / Dueño</th>
                                            <th className="p-6">Procedimiento</th>
                                            <th className="p-6">Clínica</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                        {listaAtenciones.length === 0 ? (
                                            <tr>
                                                <td colSpan="4"
                                                    className="text-center p-10 text-slate-400 font-medium">Aún no
                                                    hay atenciones registradas.
                                                </td>
                                            </tr>
                                        ) : (
                                            listaAtenciones.map(atencion => (
                                                <tr key={atencion.id} className="hover:bg-slate-50/50">
                                                    <td className="p-6">
                                                        <p className="font-bold text-slate-700">{atencion.fecha.split(' ')[0]}</p>
                                                        <p className="text-xs text-slate-400">{atencion.fecha.split(' ')[1]}</p>
                                                    </td>
                                                    <td className="p-6">
                                                        <p className="font-bold text-blue-700 capitalize">{atencion.mascota}
                                                            <span
                                                                className="text-[10px] text-slate-400 uppercase">({atencion.tipo_mascota})</span>
                                                        </p>
                                                        <p className="text-xs text-slate-500">De: {atencion.dueno} (CC: {atencion.cedula})</p>
                                                    </td>
                                                    <td className="p-6">
                                                        <span
                                                            className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md text-sm font-bold border border-emerald-100">
                                                            {atencion.motivo}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-sm text-slate-500 font-medium">
                                                        🏥 {atencion.veterinaria}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {vistaActiva === 'panel_afiliado' && (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="bg-white p-10 rounded-3xl shadow-xl max-w-sm w-full text-center border">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">¡Hola, {datosAfiliado.nombre}!</h2>
                        <div className="space-y-3 text-left">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tus Mascotas</p>
                            {datosAfiliado.mascotas.map((m, i) => (
                                <div key={i}
                                     className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border">
                                    <span className="font-bold text-slate-700 capitalize">{m.nombre}</span>
                                    <span
                                        className="text-[10px] bg-white px-2 py-1 rounded-lg border text-slate-400 uppercase font-bold">{m.tipo}</span>
                                </div>
                            ))}

                            {/* --- TARJETA MODIFICADA --- */}
                            <div
                                className={`mt-6 p-6 rounded-2xl text-white shadow-lg transition-colors ${datosAfiliado.estado === 'Activo' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-slate-700 shadow-slate-200'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[10px] font-bold text-white/70 uppercase">Estado de
                                        Afiliación</p>
                                    <span
                                        className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${datosAfiliado.estado === 'Activo' ? 'bg-white text-emerald-600' : 'bg-red-500 text-white'}`}>
                                        {datosAfiliado.estado || 'Inactivo'}
                                    </span>
                                </div>

                                {/* 1. Muestra "SIN PLAN" si canceló, o el nombre del plan */}
                                <p className="text-2xl font-black tracking-tighter mb-1">
                                    {datosAfiliado.plan === 'cancelado' ? 'SIN PLAN' : `PLAN ${datosAfiliado.plan.toUpperCase()}`}
                                </p>

                                {/* 2. Menú desplegable para cambiar o cancelar */}
                                {mostrarOpcionesPlan ? (
                                    <div className="flex flex-col gap-2 mt-4 mb-4 animate-in fade-in zoom-in">
                                        <p className="text-xs font-bold text-white/70 mb-1">Selecciona una opción:</p>
                                        <div className="flex gap-2">
                                            {datosAfiliado.plan !== 'basico' &&
                                                <button onClick={() => handleCambiarPlan('basico')}
                                                        className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-lg text-sm font-bold transition-colors">Básico</button>}
                                            {datosAfiliado.plan !== 'premium' &&
                                                <button onClick={() => handleCambiarPlan('premium')}
                                                        className="flex-1 bg-purple-500 hover:bg-purple-400 py-2 rounded-lg text-sm font-bold shadow-md transition-colors">Premium</button>}
                                        </div>
                                        <button onClick={() => handleCambiarPlan('cancelado')}
                                                className="w-full bg-red-500/20 text-red-100 hover:bg-red-500 border border-red-400/30 py-2 rounded-lg text-sm font-bold transition-colors mt-1">
                                            Cancelar Suscripción
                                        </button>
                                        <button onClick={() => setMostrarOpcionesPlan(false)}
                                                className="text-xs text-white/50 hover:text-white mt-2 underline">Ocultar
                                            opciones
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => setMostrarOpcionesPlan(true)}
                                            className="text-xs underline text-white/70 hover:text-white block mb-4">
                                        Modificar mi plan
                                    </button>
                                )}

                                {/* 3. El botón de pago desaparece si el plan está 'cancelado' */}
                                {datosAfiliado.estado !== 'Activo' && datosAfiliado.plan !== 'cancelado' && (
                                    <button
                                        onClick={handlePagarMensualidad}
                                        disabled={procesandoPago}
                                        className={`w-full py-3 rounded-xl font-bold flex justify-center items-center transition-all mt-4 ${procesandoPago ? 'bg-slate-600 text-slate-300' : 'bg-blue-500 hover:bg-blue-400 text-white shadow-md'}`}
                                    >
                                        {procesandoPago ? '⏳ Procesando...' : '💳 Pagar Mensualidad'}
                                    </button>
                                )}
                            </div>
                            {/* --- FIN TARJETA MODIFICADA --- */}


                        </div>
                        <button onClick={() => {
                            setVistaActiva('login');
                            setDatosPlan(null);
                        }} className="mt-10 text-slate-300 font-bold hover:text-red-400 transition-colors">Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

export default App
