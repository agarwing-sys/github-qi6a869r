import React, { useState, useEffect } from 'react';
import { SupabaseOptimized } from '../../lib/supabaseOptimized';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabaseQuery';
import { useDebounce } from '../../hooks/useDebounce';
import { Users, Search, Shield, Ban, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { LoadingSpinner, LoadingTable } from '../UI/LoadingSpinner';
import { Pagination } from '../UI/Pagination';
import { ErrorBoundary } from '../UI/ErrorBoundary';

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'advertiser' | 'broadcaster' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Requête optimisée avec pagination et filtres
  const { data: usersData, loading, refetch } = useSupabaseQuery(
    `users_${currentPage}_${roleFilter}_${statusFilter}_${debouncedSearch}`,
    () => SupabaseOptimized.getUsers({
      page: currentPage,
      limit: 20,
      role: roleFilter === 'all' ? undefined : roleFilter,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      search: debouncedSearch || undefined
    }),
    { staleTime: 2 * 60 * 1000 } // Cache 2 minutes
  );

  // Mutations pour les actions utilisateur
  const { mutate: toggleUserStatus, loading: toggling } = useSupabaseMutation(
    async ({ userId, currentStatus }: { userId: string; currentStatus: boolean }) => {
      return await supabase
        .from('profiles')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    },
    {
      onSuccess: () => refetch(),
      invalidateQueries: ['users_']
    }
  );

  const { mutate: deleteUser, loading: deleting } = useSupabaseMutation(
    async (userId: string) => {
      return await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
    },
    {
      onSuccess: () => refetch(),
      invalidateQueries: ['users_']
    }
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(currentStatus ? 'Suspendre cet utilisateur ?' : 'Réactiver cet utilisateur ?')) {
      return;
    }

    try {
      await toggleUserStatus({ userId, currentStatus });
      alert(currentStatus ? 'Utilisateur suspendu' : 'Utilisateur réactivé');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ? Cette action est irréversible.')) {
      return;
    }

    try {
      await deleteUser(userId);
      alert('Utilisateur supprimé définitivement');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'advertiser': return 'bg-blue-100 text-blue-800';
      case 'broadcaster': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'advertiser': return 'Annonceur';
      case 'broadcaster': return 'Diffuseur';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  if (loading) {
    return (
      <LoadingTable rows={10} cols={6} />
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600">
            {usersData?.count || 0} utilisateur(s) au total
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, téléphone, code..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les rôles</option>
                <option value="advertiser">Annonceurs</option>
                <option value="broadcaster">Diffuseurs</option>
                <option value="admin">Administrateurs</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Suspendus</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Utilisateur</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Rôle</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Localisation</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Statut</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Inscription</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersData?.data.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-600">{user.phone_number}</div>
                        <div className="text-xs text-gray-500">Code: {user.referral_code}</div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">
                        {user.city}, {user.region}
                      </div>
                      {user.age && (
                        <div className="text-xs text-gray-500">{user.age} ans</div>
                      )}
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {user.is_active ? (
                          <span className="inline-flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">Actif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-600">
                            <XCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">Suspendu</span>
                          </span>
                        )}
                        {user.is_verified && (
                          <Shield className="w-4 h-4 text-blue-600" title="Vérifié" />
                        )}
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                          disabled={toggling || user.role === 'admin'}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            user.is_active
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={user.is_active ? 'Suspendre' : 'Réactiver'}
                        >
                          {toggling ? (
                            <LoadingSpinner size="sm" />
                          ) : user.is_active ? (
                            <Ban className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleting || user.role === 'admin'}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Supprimer définitivement"
                        >
                          {deleting ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

          {(!usersData?.data || usersData.data.length === 0) && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun utilisateur trouvé
              </h3>
              <p className="text-gray-600">
                Aucun utilisateur ne correspond aux critères de recherche.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {usersData && usersData.totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={usersData.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}