import React, { useState, useEffect } from 'react';
import { Lock, Image as ImageIcon, Calendar, Hash, LogOut, Trash2 } from 'lucide-react';

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('pending');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [shipmentData, setShipmentData] = useState<any>(null);
  const [savingShipment, setSavingShipment] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
      fetchUploads(token);
      fetchStatus();
      fetchShipmentData();
    }
  }, []);

  const fetchShipmentData = async () => {
    try {
      const res = await fetch(`/api/shipment?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setShipmentData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShipmentChange = (field: string, value: string) => {
    setShipmentData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveShipment = async () => {
    setSavingShipment(true);
    try {
      console.log('Attempting to save shipment data:', shipmentData);
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/shipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify(shipmentData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error en la respuesta del servidor');
      }
      
      alert('Datos guardados correctamente');
      // Small delay before reload to ensure server has processed everything
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Error al guardar los datos: ' + err.message);
    } finally {
      setSavingShipment(false);
    }
  };

  const handleResetShipment = async () => {
    if (!confirm('¿Estás seguro de que quieres restablecer todos los valores por defecto?')) return;
    
    setSavingShipment(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/shipment/reset', {
        method: 'POST',
        headers: {
          'Authorization': token || ''
        }
      });
      const data = await res.json();
      if (data.success) {
        setShipmentData(data.data);
        alert('Datos restablecidos correctamente');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (err) {
      console.error(err);
      alert('Error al restablecer los datos');
    } finally {
      setSavingShipment(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/status?t=${Date.now()}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      setCurrentStatus(data.status || 'pending');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setCurrentStatus(newStatus);
      } else {
        alert('Error al actualizar el estado');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al actualizar el estado');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('adminToken', 'Bearer ' + data.token);
        setIsLoggedIn(true);
        fetchUploads('Bearer ' + data.token);
        fetchStatus();
        fetchShipmentData();
      } else {
        setError(data.error || 'Contraseña incorrecta');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchUploads = async (token: string) => {
    try {
      const res = await fetch('/api/admin/uploads', {
        headers: {
          'Authorization': token,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setUploads(data);
      } else if (res.status === 401) {
        handleLogout();
      } else {
        console.error('Failed to fetch uploads:', await res.text());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setUploads([]);
  };

  const handleDeleteUpload = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comprobante?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/uploads/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token || ''
        }
      });
      
      if (res.ok) {
        setUploads(prev => prev.filter(u => u.id !== id));
      } else {
        alert('Error al eliminar el comprobante');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f0f4ff] flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border-t-4 border-[#1e3a6e]">
          <div className="flex justify-center mb-6">
            <div className="bg-[#1e3a6e] p-4 rounded-full">
              <Lock className="text-[#f5c000]" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-[#1e3a6e] mb-2">Panel de Administración</h1>
          <p className="text-center text-gray-500 mb-8 text-sm">Ingresa tu clave para acceder a los comprobantes</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e] focus:ring-1 focus:ring-[#1e3a6e]"
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#f5c000] text-[#1e3a6e] font-bold py-3 rounded hover:bg-[#e0ad00] transition-colors"
            >
              {loading ? 'Verificando...' : 'Acceder'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4ff] font-sans">
      <header className="bg-[#1e3a6e] text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Lock className="text-[#f5c000]" />
          <h1 className="font-bold text-xl">Admin - Comprobantes Recibidos</h1>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
          <h2 className="text-lg font-bold text-[#1e3a6e] mb-4">Estado del Envío ({shipmentData?.trackingNumber || '6635471299413458'})</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <select 
              value={currentStatus} 
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusUpdating}
              className="p-3 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e] flex-1 font-medium"
            >
              <option value="pending">Pendiente de pago de tasas (Rojo)</option>
              <option value="validating">Pago en proceso de validación (Azul/Cian)</option>
              <option value="verified">PAGO VERIFICADO / EN PROCESO DE DESPACHO (Amarillo/Naranja)</option>
              <option value="transit">En Tránsito (Verde)</option>
            </select>
            {statusUpdating && <span className="text-gray-500 self-center font-medium">Actualizando...</span>}
          </div>
        </div>

        {shipmentData && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
            <h2 className="text-lg font-bold text-[#1e3a6e] mb-4">Datos del Envío</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Número de envío</label>
                <input 
                  type="text" 
                  value={shipmentData.trackingNumber} 
                  onChange={(e) => handleShipmentChange('trackingNumber', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombres & Apellidos</label>
                <input 
                  type="text" 
                  value={shipmentData.name} 
                  onChange={(e) => handleShipmentChange('name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Código Postal</label>
                <input 
                  type="text" 
                  value={shipmentData.postalCode} 
                  onChange={(e) => handleShipmentChange('postalCode', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Dirección</label>
                <input 
                  type="text" 
                  value={shipmentData.address} 
                  onChange={(e) => handleShipmentChange('address', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Contacto</label>
                <input 
                  type="text" 
                  value={shipmentData.contact} 
                  onChange={(e) => handleShipmentChange('contact', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Paquete Verificado</label>
                <input 
                  type="text" 
                  value={shipmentData.packageVerified} 
                  onChange={(e) => handleShipmentChange('packageVerified', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Beneficiario</label>
                <input 
                  type="text" 
                  value={shipmentData.beneficiary} 
                  onChange={(e) => handleShipmentChange('beneficiary', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Concepto</label>
                <input 
                  type="text" 
                  value={shipmentData.concept} 
                  onChange={(e) => handleShipmentChange('concept', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Etiqueta IBAN (ej. IBAN BANCO (BBVA))</label>
                <input 
                  type="text" 
                  value={shipmentData.ibanLabel} 
                  onChange={(e) => handleShipmentChange('ibanLabel', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Número IBAN</label>
                <input 
                  type="text" 
                  value={shipmentData.ibanValue} 
                  onChange={(e) => handleShipmentChange('ibanValue', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Costo servicio de envío seguro</label>
                <input 
                  type="text" 
                  value={shipmentData.shippingCost} 
                  onChange={(e) => handleShipmentChange('shippingCost', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Costo de Paquete</label>
                <input 
                  type="text" 
                  value={shipmentData.packageCost} 
                  onChange={(e) => handleShipmentChange('packageCost', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Importe Total</label>
                <input 
                  type="text" 
                  value={shipmentData.totalAmount} 
                  onChange={(e) => handleShipmentChange('totalAmount', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e3a6e]"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleSaveShipment}
                disabled={savingShipment}
                className="bg-[#1e3a6e] text-white px-6 py-2 rounded font-bold hover:bg-[#152a52] transition-colors disabled:opacity-70"
              >
                {savingShipment ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button 
                onClick={handleResetShipment}
                disabled={savingShipment}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded font-bold hover:bg-gray-300 transition-colors disabled:opacity-70"
              >
                Restablecer Valores por Defecto
              </button>
            </div>
          </div>
        )}

        {uploads.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center text-gray-500">
            <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">No hay comprobantes subidos aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uploads.map((upload) => (
              <div key={upload.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1e3a6e]">
                    <Hash size={16} className="text-[#f5c000]" />
                    {upload.trackingNumber}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar size={12} />
                    {new Date(upload.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-4 flex justify-center bg-gray-100 h-48">
                  {upload.image.startsWith('data:image') ? (
                    <img src={upload.image} alt="Comprobante" className="max-h-full object-contain cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(upload.image)} />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon size={32} className="mb-2" />
                      <span className="text-xs">Archivo no es imagen</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white space-y-2">
                  <a 
                    href={upload.image} 
                    download={`comprobante_${upload.trackingNumber}.png`}
                    className="block w-full text-center bg-[#1e3a6e] text-white py-2 rounded text-sm font-medium hover:bg-[#152a52] transition-colors"
                  >
                    Descargar Comprobante
                  </a>
                  <button 
                    onClick={() => handleDeleteUpload(upload.id)}
                    className="flex items-center justify-center gap-2 w-full text-center bg-red-500 text-white py-2 rounded text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
