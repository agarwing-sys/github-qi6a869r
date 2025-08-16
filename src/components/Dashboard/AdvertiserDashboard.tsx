import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseOptimized } from '../../lib/supabaseOptimized';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { TrendingUp, Target, DollarSign, Eye, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSpinner, LoadingCard } from '../UI/LoadingSpinner';
import { ErrorBoundary } from '../UI/ErrorBoundary';

export function AdvertiserDashboard() {
  const { profile } = useAuth();

  // Requêtes optimisées avec cache
  const { data: campaigns, loading: campaignsLoading } = useSupabaseQuery(
    `campaigns_${profile?.id}`,
    () => SupabaseOptimized.getCampaigns(profile?.id, { limit: 5 }),
    { enabled: !!profile }
  );

  const { data: stats, loading: statsLoading } = useSupabaseQuery(
    `stats_${profile?.id}_advertiser`,
    () => SupabaseOptimized.getStats(profile?.id, 'advertiser'),
    { enabled: !!profile, staleTime: 2 * 60 * 1000 } // Cache 2 minutes
  );

  const loading = campaignsLoading || statsLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'pending': return 'En attente';
      case 'completed': return 'Terminé';
      case 'paused': return 'En pause';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  if (loading && !campaigns && !stats) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-gray-600">Bienvenue, {profile?.full_name}</p>
          </div>
          <Link
            to="/campaigns/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle campagne
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Campagnes</p>
                {statsLoading ? (
                  <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalCampaigns || 0}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Campagnes Actives</p>
                {statsLoading ? (
                  <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeCampaigns || 0}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Vues</p>
                {statsLoading ? (
                  <div className="h-8 bg-gray-200 rounded w-20 animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{(stats?.totalViews || 0).toLocaleString()}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Solde</p>
                {statsLoading ? (
                  <div className="h-8 bg-gray-200 rounded w-24 animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats?.balance || 0).toFixed(2)} €
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Campagnes récentes</h2>
              <Link
                to="/campaigns"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Voir tout
              </Link>
            </div>
          </div>

          <div className="p-6">
            {campaignsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <LoadingCard key={i} />
                ))}
              </div>
            ) : !campaigns?.data || campaigns.data.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune campagne
                </h3>
                <p className="text-gray-600 mb-6">
                  Créez votre première campagne pour commencer à toucher votre audience.
                </p>
                <Link
                  to="/campaigns/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Créer une campagne
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.data.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{campaign.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {campaign.current_views} / {campaign.target_views} vues
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          campaign.status
                        )}`}
                      >
                        {getStatusText(campaign.status)}
                      </span>
                      
                      <span className="text-sm font-medium text-gray-900">
                        {campaign.budget.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Alimenter votre portefeuille</h3>
            <p className="text-blue-100 mb-4">
              Ajoutez des fonds pour lancer vos prochaines campagnes.
            </p>
            <Link
              to="/wallet"
              className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Ajouter des fonds
            </Link>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Parrainez et gagnez</h3>
            <p className="text-green-100 mb-4">
              Invitez des diffuseurs et recevez des bonus.
            </p>
            <Link
              to="/referrals"
              className="inline-flex items-center px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors"
            >
              Mes parrainages
            </Link>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}