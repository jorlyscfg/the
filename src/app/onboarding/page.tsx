'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/notifications';
import {
  Building2,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { registrarEmpresaYUsuario } from './actions';

export default function OnboardingPage() {
  const router = useRouter();
  const { success, error: showError } = useNotification();
  const [paso, setPaso] = useState(1);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    // Empresa
    nombre_empresa: '',
    razon_social: '',
    rfc: '',
    telefono_empresa: '',
    email_empresa: '',
    sitio_web: '',

    // Sucursal
    nombre_sucursal: '',
    direccion_sucursal: '',
    telefono_sucursal: '',
    email_sucursal: '',

    // Usuario
    nombre_completo: '',
    telefono_usuario: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setGuardando(true);

      const result = await registrarEmpresaYUsuario(formData);

      if (result.success) {
        success('¡Registro Exitoso!', result.message || 'Tu empresa ha sido registrada correctamente.');
        // Redirección inmediata para evitar confusión
        router.replace('/');
      } else {
        showError('Error al registrar', result.error || 'Error desconocido');
        setGuardando(false);
      }
    } catch (err) {
      console.error('Error al registrar:', err);
      showError('Error', 'Ocurrió un error inesperado');
    } finally {
      setGuardando(false);
    }
  };

  const siguientePaso = () => {
    if (paso < 3) setPaso(paso + 1);
  };

  const pasoAnterior = () => {
    if (paso > 1) setPaso(paso - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Bienvenido a TH Empresarial!
          </h1>
          <p className="text-gray-600">
            Completa estos pasos para configurar tu empresa
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${paso >= num
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-500'
                  }`}
              >
                {num}
              </div>
              {num < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${paso > num ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Paso 1: Información de la Empresa */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Información de tu Empresa
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  value={formData.nombre_empresa}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre_empresa: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: TH Reparaciones"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Razón Social
                </label>
                <input
                  type="text"
                  value={formData.razon_social}
                  onChange={(e) =>
                    setFormData({ ...formData, razon_social: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nombre legal de la empresa"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RFC
                  </label>
                  <input
                    type="text"
                    value={formData.rfc}
                    onChange={(e) =>
                      setFormData({ ...formData, rfc: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="XXXX000000XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono_empresa}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono_empresa: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email_empresa}
                    onChange={(e) =>
                      setFormData({ ...formData, email_empresa: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="contacto@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    value={formData.sitio_web}
                    onChange={(e) =>
                      setFormData({ ...formData, sitio_web: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://www.empresa.com"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={siguientePaso}
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Sucursal Principal */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Sucursal Principal
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Sucursal *
                </label>
                <input
                  type="text"
                  value={formData.nombre_sucursal}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre_sucursal: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Matriz, Sucursal Centro, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Dirección
                </label>
                <textarea
                  value={formData.direccion_sucursal}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion_sucursal: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Calle, número, colonia, ciudad..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono_sucursal}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono_sucursal: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email_sucursal}
                    onChange={(e) =>
                      setFormData({ ...formData, email_sucursal: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="sucursal@empresa.com"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={pasoAnterior}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={siguientePaso}
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Información del Usuario */}
          {paso === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Tus Datos</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre_completo}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre_completo: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono_usuario}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono_usuario: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Serás registrado como administrador de la
                  empresa. Podrás agregar más empleados desde el módulo de
                  configuración.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={pasoAnterior}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={guardando}
                >
                  Anterior
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardando ? 'Procesando...' : 'Completar Registro'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
