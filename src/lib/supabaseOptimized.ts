import { supabase } from './supabase';
import type { Profile, Campaign, CampaignApplication, Proof, Wallet, Transaction } from './supabase';

// Types pour la pagination
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalPages: number;
}

// Classe pour optimiser les requêtes Supabase
export class SupabaseOptimized {
  // Méthode générique pour les requêtes paginées
  static async getPaginated<T>(
    tableName: string,
    options: PaginationOptions & {
      select?: string;
      filters?: Record<string, any>;
      search?: { column: string; value: string };
    } = {}
  ): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
      select = '*',
      filters = {},
      search
    } = options;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from(tableName)
      .select(select, { count: 'exact' })
      .range(from, to)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Appliquer les filtres
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    // Appliquer la recherche
    if (search && search.value) {
      query = query.ilike(search.column, `%${search.value}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      data: data || [],
      count: count || 0,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      totalPages
    };
  }

  // Campagnes avec filtres optimisés
  static async getCampaigns(
    advertiserId?: string,
    options: PaginationOptions & {
      status?: string;
      adminApproved?: boolean;
      search?: string;
    } = {}
  ): Promise<PaginatedResult<Campaign>> {
    const filters: Record<string, any> = {};
    
    if (advertiserId) filters.advertiser_id = advertiserId;
    if (options.status) filters.status = options.status;
    if (options.adminApproved !== undefined) filters.admin_approved = options.adminApproved;

    return this.getPaginated<Campaign>('campaigns', {
      ...options,
      filters,
      search: options.search ? { column: 'title', value: options.search } : undefined
    });
  }

  // Applications avec jointures optimisées
  static async getCampaignApplications(
    broadcasterId?: string,
    options: PaginationOptions & {
      status?: string;
      campaignId?: string;
    } = {}
  ): Promise<PaginatedResult<CampaignApplication & { campaign: Campaign }>> {
    const filters: Record<string, any> = {};
    
    if (broadcasterId) filters.broadcaster_id = broadcasterId;
    if (options.status) filters.status = options.status;
    if (options.campaignId) filters.campaign_id = options.campaignId;

    return this.getPaginated<CampaignApplication & { campaign: Campaign }>('campaign_applications', {
      ...options,
      select: `
        *,
        campaign:campaigns(*)
      `,
      filters
    });
  }

  // Preuves avec validation optimisée
  static async getProofs(
    options: PaginationOptions & {
      validationStatus?: string;
      broadcasterId?: string;
      campaignId?: string;
    } = {}
  ): Promise<PaginatedResult<Proof & { campaign: Campaign; broadcaster: Profile }>> {
    const filters: Record<string, any> = {};
    
    if (options.validationStatus) filters.validation_status = options.validationStatus;
    if (options.broadcasterId) filters.broadcaster_id = options.broadcasterId;
    if (options.campaignId) filters.campaign_id = options.campaignId;

    return this.getPaginated<Proof & { campaign: Campaign; broadcaster: Profile }>('proofs', {
      ...options,
      select: `
        *,
        campaign:campaigns(*),
        broadcaster:profiles!proofs_broadcaster_id_fkey(*)
      `,
      filters
    });
  }

  // Transactions optimisées
  static async getTransactions(
    userId?: string,
    options: PaginationOptions & {
      type?: string;
      status?: string;
    } = {}
  ): Promise<PaginatedResult<Transaction>> {
    const filters: Record<string, any> = {};
    
    if (userId) filters.user_id = userId;
    if (options.type) filters.type = options.type;
    if (options.status) filters.status = options.status;

    return this.getPaginated<Transaction>('transactions', {
      ...options,
      filters
    });
  }

  // Utilisateurs avec filtres avancés
  static async getUsers(
    options: PaginationOptions & {
      role?: string;
      isActive?: boolean;
      search?: string;
    } = {}
  ): Promise<PaginatedResult<Profile>> {
    const filters: Record<string, any> = {};
    
    if (options.role) filters.role = options.role;
    if (options.isActive !== undefined) filters.is_active = options.isActive;

    return this.getPaginated<Profile>('profiles', {
      ...options,
      filters,
      search: options.search ? { column: 'full_name', value: options.search } : undefined
    });
  }

  // Statistiques optimisées avec cache
  static async getStats(userId?: string, role?: string) {
    const cacheKey = `stats_${userId}_${role}`;
    
    // Vérifier le cache (5 minutes)
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data;
      }
    }

    let stats = {};

    if (role === 'advertiser' && userId) {
      const [campaignsResult, walletResult] = await Promise.all([
        supabase
          .from('campaigns')
          .select('status, current_views, budget')
          .eq('advertiser_id', userId),
        supabase
          .from('wallets')
          .select('balance, total_spent')
          .eq('user_id', userId)
          .single()
      ]);

      const campaigns = campaignsResult.data || [];
      stats = {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalViews: campaigns.reduce((sum, c) => sum + c.current_views, 0),
        totalSpent: walletResult.data?.total_spent || 0,
        balance: walletResult.data?.balance || 0
      };
    } else if (role === 'broadcaster' && userId) {
      const [applicationsResult, walletResult] = await Promise.all([
        supabase
          .from('campaign_applications')
          .select('status')
          .eq('broadcaster_id', userId),
        supabase
          .from('wallets')
          .select('balance, total_earned')
          .eq('user_id', userId)
          .single()
      ]);

      const applications = applicationsResult.data || [];
      stats = {
        totalApplications: applications.length,
        activeApplications: applications.filter(a => a.status === 'accepted').length,
        completedApplications: applications.filter(a => a.status === 'completed').length,
        totalEarnings: walletResult.data?.total_earned || 0,
        balance: walletResult.data?.balance || 0
      };
    } else if (role === 'admin') {
      const [usersResult, campaignsResult, proofsResult] = await Promise.all([
        supabase.from('profiles').select('role', { count: 'exact', head: true }),
        supabase.from('campaigns').select('status', { count: 'exact', head: true }),
        supabase.from('proofs').select('validation_status', { count: 'exact', head: true })
      ]);

      stats = {
        totalUsers: usersResult.count || 0,
        totalCampaigns: campaignsResult.count || 0,
        pendingProofs: proofsResult.count || 0
      };
    }

    // Mettre en cache
    sessionStorage.setItem(cacheKey, JSON.stringify({
      data: stats,
      timestamp: Date.now()
    }));

    return stats;
  }

  // Invalidation du cache
  static invalidateCache(pattern?: string) {
    if (pattern) {
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes(pattern)) {
          sessionStorage.removeItem(key);
        }
      });
    } else {
      sessionStorage.clear();
    }
  }
}