// "use client"
// import React, { useState, useEffect } from 'react';
// import { RefreshCw, CheckCircle, XCircle, Clock, Database, Wifi, WifiOff } from 'lucide-react';

// const SyncStatusPage = () => {
//   const [syncStatus, setSyncStatus] = useState({
//     isLoading: false,
//     lastSyncTime: null,
//     overallProgress: 0,
//     connectionStatus: 'checking',
//     entities: [
//       { name: 'Warehouses', synced: 0, total: 0, progress: 0, status: 'idle' },
//       { name: 'Users', synced: 0, total: 0, progress: 0, status: 'idle' },
//       { name: 'Products', synced: 0, total: 0, progress: 0, status: 'idle' },
//       { name: 'Customers', synced: 0, total: 0, progress: 0, status: 'idle' },
//       { name: 'Suppliers', synced: 0, total: 0, progress: 0, status: 'idle' },
//       { name: 'Sales', synced: 0, total: 0, progress: 0, status: 'idle' },
//       { name: 'Purchases', synced: 0, total: 0, progress: 0, status: 'idle' },
//       { name: 'Sale Items', synced: 0, total: 0, progress: 0, status: 'idle' },
//       { name: 'Purchase Items', synced: 0, total: 0, progress: 0, status: 'idle' },
//       { name: 'Payment Methods', synced: 0, total: 0, progress: 0, status: 'idle' },
//       { name: 'Balance Payments', synced: 0, total: 0, progress: 0, status: 'idle' }
//     ]
//   });

//   const [isSyncing, setIsSyncing] = useState(false);
//   const [error, setError] = useState(null);

//   // Fetch sync status from your API
//   const fetchSyncStatus = async () => {
//     try {
//       // Replace with your actual API endpoint
//       const response = await fetch('/api/sync-status');
//       if (!response.ok) throw new Error('Failed to fetch sync status');
      
//       const data = await response.json();
      
//       // Calculate overall progress
//       const totalProgress = data.entities.reduce((sum, entity) => sum + entity.progress, 0);
//       const overallProgress = Math.round(totalProgress / data.entities.length);
      
//       setSyncStatus({
//         ...data,
//         overallProgress,
//         connectionStatus: 'connected'
//       });
//     } catch (err) {
//       console.error('Error fetching sync status:', err);
//       setSyncStatus(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      
//       // For demo purposes, using mock data
//       const mockData = {
//         isLoading: false,
//         lastSyncTime: new Date().toISOString(),
//         overallProgress: 75,
//         connectionStatus: 'connected',
//         entities: [
//           { name: 'Warehouses', synced: 5, total: 5, progress: 100, status: 'completed' },
//           { name: 'Users', synced: 12, total: 12, progress: 100, status: 'completed' },
//           { name: 'Products', synced: 85, total: 100, progress: 85, status: 'syncing' },
//           { name: 'Customers', synced: 45, total: 50, progress: 90, status: 'completed' },
//           { name: 'Suppliers', synced: 8, total: 10, progress: 80, status: 'completed' },
//           { name: 'Sales', synced: 120, total: 150, progress: 80, status: 'syncing' },
//           { name: 'Purchases', synced: 30, total: 40, progress: 75, status: 'completed' },
//           { name: 'Sale Items', synced: 200, total: 300, progress: 67, status: 'pending' },
//           { name: 'Purchase Items', synced: 80, total: 120, progress: 67, status: 'pending' },
//           { name: 'Payment Methods', synced: 15, total: 20, progress: 75, status: 'completed' },
//           { name: 'Balance Payments', synced: 0, total: 10, progress: 0, status: 'pending' }
//         ]
//       };
//       setSyncStatus(mockData);
//     }
//   };

//   // Trigger sync
//   const handleSync = async () => {
//     setIsSyncing(true);
//     setError(null);
    
//     try {
//       const response = await fetch('/api/syncNew', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({})
//       });
      
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Sync failed');
//       }
      
//       const result = await response.json();
//       console.log('Sync successful:', result);
      
//       // Refresh status after sync
//       await fetchSyncStatus();
//     } catch (err) {
//       console.error('Sync error:', err);
//       setError(err.message);
//     } finally {
//       setIsSyncing(false);
//     }
//   };

//   useEffect(() => {
//     fetchSyncStatus();
//     // Refresh status every 30 seconds
//     const interval = setInterval(fetchSyncStatus, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'completed':
//         return <CheckCircle className="w-5 h-5 text-green-500" />;
//       case 'syncing':
//         return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
//       case 'error':
//         return <XCircle className="w-5 h-5 text-red-500" />;
//       default:
//         return <Clock className="w-5 h-5 text-gray-400" />;
//     }
//   };

//   const getProgressBarColor = (progress) => {
//     if (progress === 100) return 'bg-green-500';
//     if (progress >= 75) return 'bg-blue-500';
//     if (progress >= 50) return 'bg-yellow-500';
//     if (progress >= 25) return 'bg-orange-500';
//     return 'bg-red-500';
//   };

//   const formatLastSyncTime = (time) => {
//     if (!time) return 'Never';
//     const date = new Date(time);
//     return date.toLocaleString();
//   };

//   return (
//     <div className="min-h-screen p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
//           <div className="flex justify-between items-center mb-4">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">Sync Status Dashboard</h1>
//               <p className="text-gray-600 mt-2">Monitor warehouse data synchronization</p>
//             </div>
//             <button
//               onClick={handleSync}
//               disabled={isSyncing}
//               className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
//                 isSyncing 
//                   ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
//                   : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
//               }`}
//             >
//               <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
//               {isSyncing ? 'Syncing...' : 'Start Sync'}
//             </button>
//           </div>

//           {/* Connection Status & Last Sync */}
//           <div className="flex gap-6 text-sm">
//             <div className="flex items-center gap-2">
//               {syncStatus.connectionStatus === 'connected' ? (
//                 <Wifi className="w-5 h-5 text-green-500" />
//               ) : (
//                 <WifiOff className="w-5 h-5 text-red-500" />
//               )}
//               <span className="text-gray-600">
//                 Status: <span className={`font-medium ${
//                   syncStatus.connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'
//                 }`}>
//                   {syncStatus.connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
//                 </span>
//               </span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Clock className="w-5 h-5 text-gray-400" />
//               <span className="text-gray-600">
//                 Last Sync: <span className="font-medium">{formatLastSyncTime(syncStatus.lastSyncTime)}</span>
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Error Alert */}
//         {error && (
//           <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
//             <div className="flex items-center gap-2">
//               <XCircle className="w-5 h-5 text-red-600" />
//               <p className="text-red-800">{error}</p>
//             </div>
//           </div>
//         )}

//         {/* Overall Progress */}
//         <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
//           <div className="flex items-center justify-between mb-3">
//             <h2 className="text-xl font-semibold text-gray-800">Overall Progress</h2>
//             <span className="text-3xl font-bold text-blue-600">{syncStatus.overallProgress}%</span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
//             <div 
//               className={`h-full ${getProgressBarColor(syncStatus.overallProgress)} transition-all duration-500 ease-out`}
//               style={{ width: `${syncStatus.overallProgress}%` }}
//             />
//           </div>
//         </div>

//         {/* Entity Status Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {syncStatus.entities.map((entity, index) => (
//             <div key={index} className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex items-center gap-2">
//                   <Database className="w-5 h-5 text-gray-400" />
//                   <h3 className="font-medium text-gray-900">{entity.name}</h3>
//                 </div>
//                 {getStatusIcon(entity.status)}
//               </div>
              
//               <div className="space-y-3">
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-600">Progress</span>
//                   <span className="font-semibold text-gray-900">{entity.progress}%</span>
//                 </div>
                
//                 <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
//                   <div 
//                     className={`h-full ${getProgressBarColor(entity.progress)} transition-all duration-500 ease-out`}
//                     style={{ width: `${entity.progress}%` }}
//                   />
//                 </div>
                
//                 <div className="flex justify-between text-xs text-gray-500">
//                   <span>Synced: {entity.synced}</span>
//                   <span>Total: {entity.total}</span>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Legend */}
//         <div className="mt-8 bg-white rounded-lg shadow-sm p-4">
//           <h3 className="text-sm font-medium text-gray-700 mb-3">Status Legend</h3>
//           <div className="flex flex-wrap gap-6 text-sm">
//             <div className="flex items-center gap-2">
//               <CheckCircle className="w-4 h-4 text-green-500" />
//               <span className="text-gray-600">Completed</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <RefreshCw className="w-4 h-4 text-blue-500" />
//               <span className="text-gray-600">Syncing</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Clock className="w-4 h-4 text-gray-400" />
//               <span className="text-gray-600">Pending</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <XCircle className="w-4 h-4 text-red-500" />
//               <span className="text-gray-600">Error</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SyncStatusPage;


export default function Sync(){
  return(
    <h1>Welcome</h1>
  )
}