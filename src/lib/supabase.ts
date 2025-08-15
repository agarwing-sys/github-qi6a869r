import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour TypeScript
export type Profile = {
  id: string;
  user_id: string;
  phone_number: string;
  full_name: string;
  role: 'advertiser' | 'broadcaster' | 'admin';
  profile_picture?: string;
  region?: string;
  city?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  language: string;
  interests?: string[];
  is_active: boolean;
  is_verified: boolean;
  referral_code: string;
  referred_by?: string;
  created_at: string;
  updated_at: string;
};

export type Campaign = {
  id: string;
  advertiser_id: string;
  title: string;
  description?: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  budget: number;
  cost_per_view: number;
  target_views: number;
  current_views: number;
  target_gender?: string;
  target_age_min?: number;
  target_age_max?: number;
  target_cities?: string[];
  target_languages?: string[];
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
  admin_approved: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
};

export type CampaignApplication = {
  id: string;
  campaign_id: string;
  broadcaster_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  applied_at: string;
  accepted_at?: string;
  completed_at?: string;
};

export type Proof = {
  id: string;
  application_id: string;
  broadcaster_id: string;
  campaign_id: string;
  screenshot_url: string;
  upload_date: string;
  validation_status: 'pending' | 'approved' | 'rejected';
  validated_by?: string;
  validated_at?: string;
  rejection_reason?: string;
  estimated_views?: number;
  created_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  wallet_id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'earning' | 'referral_bonus';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  reference?: string;
  campaign_id?: string;
  proof_id?: string;
  payment_method?: string;
  created_at: string;
  processed_at?: string;
};