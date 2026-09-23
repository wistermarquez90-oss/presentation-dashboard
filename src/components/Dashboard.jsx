import React, { useState, useMemo } from 'react';
import { 
  ScatterChart, Scatter, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, ZAxis, Legend,
  ComposedChart, Bar
} from 'recharts';
import { Package, TrendingUp, AlertTriangle, CalendarDays, Search, BarChart3 } from 'lucide-react';

// Importación de datos (Solo usamos la Matriz y la Estacionalidad por SKU)
import inventario from '../data/matriz_abc_xyz.json';
import estacionalidadPorSku from '../data/estacionalidad_por_sku.json';

export default function Dashboard() {
  const [filtroMatriz, setFiltroMatriz] = useState('Todos');
  const [busquedaProducto, setBusquedaProducto] = useState('');

  // 1. Filtrado de datos (Por Matriz o Por Búsqueda)
  const datosFiltrados = useMemo(() => {
    let filtrados = inventario;
    
    if (filtroMatriz !== 'Todos') {
      filtrados = filtrados.filter(item => item.Clasificacion_Matriz === filtroMatriz);
    }
    
    if (busquedaProducto) {
      filtrados = filtrados.filter(item => 
        item.SKU.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        item.Producto.toLowerCase().includes(busquedaProducto.toLowerCase())
      );
    }
    
    return filtrados;
  }, [filtroMatriz, busquedaProducto]);

  // 2. Estacionalidad Dinámica (Se recalcula según lo que estés viendo en la tabla)
  const datosEstacionalidad = useMemo(() => {
    const skusFiltrados = datosFiltrados.map(i => i.SKU);
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return meses.map(mes => {
      const registrosMes = estacionalidadPorSku.filter(item => 
        item.Mes === mes && skusFiltrados.includes(item.SKU)
      );
      return {
        Mes: mes,
        '2025': Math.round(registrosMes.reduce((sum, item) => sum + (item['2025'] || 0), 0)),
        '2026': Math.round(registrosMes.reduce((sum, item) => sum + (item['2026'] || 0), 0))
      };
    });
  }, [datosFiltrados]);

  // 3. Generar Datos para Gráfico de Pareto (Top 30 productos de la vista actual)
  const datosPareto = useMemo(() => {
    return datosFiltrados.slice(0, 30).map(item => ({
      SKU: item.SKU,
      Producto: item.Producto,
      Ingresos: item.Ingresos,
      AcumuladoPct: parseFloat((item.Ingresos_Cum_Pct * 100).toFixed(1))
    }));
  }, [datosFiltrados]);

  // KPIs dinámicos
  const totalIngresos = datosFiltrados.reduce((acc, curr) => acc + curr.Ingresos, 0);
  const riesgoQuiebre = datosFiltrados.filter(item => item.Dias_Cobertura < 7 && item.Clase_ABC === 'A').length;
  
  const cuadrantes = ['AX', 'AY', 'AZ', 'BX', 'BY', 'BZ', 'CX', 'CY', 'CZ'];

  // Tooltips Personalizados
  const CustomTooltipMatriz = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm z-50 relative">
          <p className="font-bold text-slate-800">{data.SKU}</p>
          <p className="text-slate-500 max-w-[200px] truncate">{data.Producto}</p>
          <p className="mt-2 text-emerald-600">Ingresos: ${(data.Ingresos).toLocaleString()}</p>
          <p className="text-blue-600">CV (Volatilidad): {data.CV}</p>
          <p className="text-amber-600 font-semibold">Clasificación: {data.Clasificacion_Matriz}</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipPareto = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm z-50 relative">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          <p className="text-slate-500 max-w-[200px] truncate mb-2">{payload[0].payload.Producto}</p>
          <p style={{ color: '#0ea5e9' }} className="font-medium">Ingresos: ${payload[0].value.toLocaleString('es-MX')}</p>
          <p style={{ color: '#f97316' }} className="font-medium">Acumulado General: {payload[1]?.value}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipLinea = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm z-50 relative">
          <p className="font-bold text-slate-800 mb-2">Mes: {label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: ${entry.value.toLocaleString('es-MX')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">

      {/* Buscador de Productos */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar un producto específico por SKU o Nombre..."
          className="w-full outline-none text-slate-700 placeholder-slate-400 bg-transparent"
          value={busquedaProducto}
          onChange={(e) => {
            setBusquedaProducto(e.target.value);
            setFiltroMatriz('Todos');
          }}
        />
        {busquedaProducto && (
          <button onClick={() => setBusquedaProducto('')} className="text-xs text-slate-400 hover:text-slate-700 font-medium bg-slate-100 px-3 py-1 rounded">Limpiar Búsqueda</button>
        )}
      </div>
      
      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Ingresos (Selección)</p>
            <p className="text-2xl font-bold text-slate-900">${totalIngresos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Package size={24} /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">SKUs Mostrados</p>
            <p className="text-2xl font-bold text-slate-900">{datosFiltrados.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Riesgo Stock (Clase A)</p>
            <p className="text-2xl font-bold text-slate-900">{riesgoQuiebre}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Estacionalidad */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full">
          <div className="flex items-center space-x-2 mb-4">
            <CalendarDays className="text-slate-500" size={20} />
            <h2 className="text-lg font-bold text-slate-800">
              {datosFiltrados.length === 1 ? `Estacionalidad: ${datosFiltrados[0].SKU}` : 
               filtroMatriz !== 'Todos' ? `Estacionalidad Cuadrante ${filtroMatriz}` : 'Estacionalidad General de Ventas'}
            </h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosEstacionalidad} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} vertical={false} />
                <XAxis dataKey="Mes" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltipLinea />} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line type="monotone" dataKey="2025" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="2026" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica de Pareto */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="text-slate-500" size={20} />
            <h2 className="text-lg font-bold text-slate-800">Diagrama de Pareto (Top 30 Seleccionados)</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={datosPareto} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} vertical={false} />
                <XAxis dataKey="SKU" tick={false} axisLine={false} />
                <YAxis yAxisId="left" tickFormatter={(val) => `$${val/1000}k`} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val}%`} tick={{ fill: '#f97316', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <RechartsTooltip content={<CustomTooltipPareto />} />
                <Bar yAxisId="left" dataKey="Ingresos" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="AcumuladoPct" stroke="#f97316" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo: Matriz Botones */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold mb-2">Filtro ABC-XYZ</h2>
          <p className="text-sm text-slate-500 mb-6 flex-grow">Aísla productos interactuando con los cuadrantes de inventario.</p>
          <div className="grid grid-cols-3 gap-2">
            {cuadrantes.map(c => {
              const count = inventario.filter(i => i.Clasificacion_Matriz === c).length;
              const isSelected = filtroMatriz === c;
              
              let bgColor = 'bg-slate-100 text-slate-700';
              if(c.includes('A')) bgColor = 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
              if(c === 'CZ') bgColor = 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100';

              return (
                <button 
                  key={c}
                  onClick={() => { setFiltroMatriz(isSelected ? 'Todos' : c); setBusquedaProducto(''); }}
                  className={`p-2 rounded-lg border text-center transition-all ${bgColor} ${isSelected ? 'ring-2 ring-slate-800 shadow-md scale-105 font-bold' : 'opacity-90'}`}
                >
                  <div className="text-base">{c}</div>
                  <div className="text-[10px] font-medium mt-0.5">{count} items</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel Derecho: Gráfico de Dispersión */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Dispersión de Portafolio ({filtroMatriz})</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                <XAxis type="number" dataKey="CV" name="Volatilidad (CV)" domain={[0, 'dataMax']} label={{ value: 'Volatilidad (Riesgo)', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#64748b' }} tick={{ fontSize: 12 }} />
                <YAxis type="number" dataKey="Ingresos" name="Ingresos" domain={[0, 'dataMax']} label={{ value: 'Ingresos MXN', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 12 }} />
                <ZAxis type="number" dataKey="Media_Periodo" range={[50, 400]} />
                <RechartsTooltip content={<CustomTooltipMatriz />} />
                <Scatter name="SKUs" data={datosFiltrados} fill="#8b5cf6" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Tabla Dinámica CON SCROLL y TODOS los resultados */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mt-6 flex flex-col h-[500px]">
        <div className="p-6 border-b border-slate-200 flex-shrink-0 flex justify-between items-center">
          <h2 className="text-lg font-bold">Listado de Artículos {filtroMatriz !== 'Todos' && `(${filtroMatriz})`}</h2>
          <span className="text-sm text-slate-500">{datosFiltrados.length} resultados</span>
        </div>
        <div className="overflow-auto flex-grow relative">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-semibold">SKU / Producto</th>
                <th className="px-6 py-4 font-semibold text-center">Clase</th>
                <th className="px-6 py-4 font-semibold text-right">Ingresos (MXN)</th>
                <th className="px-6 py-4 font-semibold text-right">Stock Act.</th>
                <th className="px-6 py-4 font-semibold text-right">Días Cobertura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {datosFiltrados.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <p className="font-mono text-xs text-slate-500">{item.SKU}</p>
                    <p className="font-medium text-slate-900 truncate max-w-xs" title={item.Producto}>{item.Producto}</p>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      item.Clasificacion_Matriz.includes('A') ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                      item.Clasificacion_Matriz.includes('C') ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {item.Clasificacion_Matriz}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-emerald-600 font-medium">${item.Ingresos.toLocaleString('es-MX')}</td>
                  <td className="px-6 py-3 text-right font-medium text-slate-700">{item.Stock}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`${item.Dias_Cobertura < 7 ? 'text-red-600 font-bold bg-red-50 px-2 py-1 rounded' : 'text-slate-600'}`}>
                      {item.Dias_Cobertura === 999 ? '∞' : item.Dias_Cobertura} días
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}