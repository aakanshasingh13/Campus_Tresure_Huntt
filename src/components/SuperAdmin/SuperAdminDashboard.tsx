import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Shield,
  Crown,
  Users,
  Compass,
  CreditCard,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  MapPin,
  Calendar,
  Trash2,
  KeyRound,
  TrendingUp,
  Server,
  Check,
  X,
  Eye,
  Sparkles,
} from 'lucide-react-native';
import { UserProfile } from '../../types';
import { CampusBackground } from '../CampusBackground';
import { apiFetch } from '../../lib/apiFetch';

interface SuperAdminDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

interface AdminUserRecord {
  id: string;
  role: 'player' | 'organizer' | 'superadmin';
  username: string;
  email: string;
  phone: string;
  campusType: string;
  campusName: string;
  score: number;
  badges: string[];
  gamesWon: number;
  gamesLost: number;
  hintsUsed: number;
  isVerified: boolean;
  approvalStatus: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  lastLogin: string;
}

interface AdminEventRecord {
  id: string;
  code: string;
  title: string;
  campusType: string;
  campusName: string;
  city?: string;
  date: string;
  time: string;
  description: string;
  startLocation: string;
  status: 'upcoming' | 'active' | 'completed';
  organizerName: string;
  organizerEmail: string;
  difficulty?: string;
  duration?: string;
  isPaid?: boolean;
  registrationFee?: number;
  currency?: string;
  registeredCount?: number;
  paymentsCount?: number;
  totalRevenue?: number;
}

interface RegistrationRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  campusName: string;
  userId: string;
  username: string;
  teamName: string;
  pinEntered: string;
  status: string;
  paymentStatus: string;
  utrNumber?: string;
  paymentId?: string;
  orderId?: string;
  transactionId?: string;
  paymentMode?: 'sandbox' | 'real';
  isSimulated?: boolean;
  verificationSource?: string;
  amount?: number;
  currency?: string;
  registeredAt: string;
}

interface PaymentRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  campusName: string;
  username: string;
  utrNumber: string;
  orderId?: string;
  transactionId?: string;
  paymentMode?: 'sandbox' | 'real';
  isSimulated?: boolean;
  verificationSource?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'verified' | 'rejected' | 'pending';
  createdAt: string;
}

interface PlatformStats {
  totalUsers: number;
  playersCount: number;
  organizersCount: number;
  pendingOrganizersCount: number;
  approvedOrganizersCount: number;
  totalEvents: number;
  activeEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  totalPaymentsCount: number;
  totalRevenue: number;
  campusesCount: number;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'events' | 'payments' | 'system'>('overview');
  
  // Data States
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [usersList, setUsersList] = useState<AdminUserRecord[]>([]);
  const [eventsList, setEventsList] = useState<AdminEventRecord[]>([]);
  const [registrationsList, setRegistrationsList] = useState<RegistrationRecord[]>([]);
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & Searches
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'pending' | 'organizer' | 'player'>('all');
  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  // Selected User Modal for detail view
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await apiFetch('/api/admin/stats');
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }

      // 2. Fetch Users
      const usersRes = await apiFetch('/api/admin/users');
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsersList(uData.users || []);
      }

      // 3. Fetch Events
      const eventsRes = await apiFetch('/api/admin/events');
      if (eventsRes.ok) {
        const eData = await eventsRes.json();
        setEventsList(eData.events || []);
      }

      // 4. Fetch Registrations
      const regsRes = await apiFetch('/api/admin/registrations');
      if (regsRes.ok) {
        const rData = await regsRes.json();
        setRegistrationsList(rData.registrations || []);
      }

      // 5. Fetch Payments
      const paysRes = await apiFetch('/api/admin/payments');
      if (paysRes.ok) {
        const pData = await paysRes.json();
        setPaymentsList(pData.payments || []);
      }
    } catch (err) {
      console.error('[SuperAdmin fetch error]:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Organizer Approval Action
  const handleOrganizerApproval = async (userId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const res = await apiFetch(`/api/admin/organizers/${userId}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, approvalStatus: newStatus } : u))
        );
        showToast(
          newStatus === 'approved'
            ? 'Organizer account approved! Privileges active.'
            : 'Organizer account rejected.'
        );
        fetchAllData();
      } else {
        showToast(data.error || 'Failed to update approval status.');
      }
    } catch (err: any) {
      showToast('Network error while updating approval.');
    }
  };

  // User Deletion Action
  const handleDeleteUser = async (targetUser: AdminUserRecord) => {
    if (targetUser.role === 'superadmin') {
      showToast('Super Admin accounts cannot be deleted!');
      return;
    }

    if (!confirm(`Are you sure you want to delete account "${targetUser.username}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/users/${targetUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsersList((prev) => prev.filter((u) => u.id !== targetUser.id));
        showToast(`Account "${targetUser.username}" deleted.`);
        if (selectedUser?.id === targetUser.id) setSelectedUser(null);
        fetchAllData();
      } else {
        showToast(data.error || 'Failed to delete user.');
      }
    } catch (err) {
      showToast('Error deleting user.');
    }
  };

  // Event Status Update
  const handleUpdateEventStatus = async (eventId: string, newStatus: 'upcoming' | 'active' | 'completed') => {
    try {
      const res = await apiFetch(`/api/admin/events/${eventId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEventsList((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, status: newStatus } : e))
        );
        showToast(`Event status updated to "${newStatus}".`);
      } else {
        showToast(data.error || 'Failed to update status.');
      }
    } catch (err) {
      showToast('Error updating event status.');
    }
  };

  // Event Deletion
  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete event "${title}" platform-wide?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEventsList((prev) => prev.filter((e) => e.id !== eventId));
        showToast(`Event "${title}" deleted.`);
        fetchAllData();
      } else {
        showToast(data.error || 'Failed to delete event.');
      }
    } catch (err) {
      showToast('Error deleting event.');
    }
  };

  // Payment Verification Toggle
  const handleVerifyPayment = async (paymentId: string, status: 'verified' | 'rejected') => {
    try {
      const res = await apiFetch(`/api/admin/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPaymentsList((prev) =>
          prev.map((p) => (p.id === paymentId ? { ...p, status } : p))
        );
        showToast(`Payment marked as ${status}.`);
      } else {
        showToast('Failed to update payment status.');
      }
    } catch (err) {
      showToast('Error updating payment.');
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.campusName && u.campusName.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.phone && u.phone.includes(userSearch));

    if (!matchesSearch) return false;

    if (userRoleFilter === 'pending') {
      return u.role === 'organizer' && u.approvalStatus === 'pending';
    }
    if (userRoleFilter === 'organizer') {
      return u.role === 'organizer';
    }
    if (userRoleFilter === 'player') {
      return u.role === 'player';
    }
    return true;
  });

  // Filtered Events
  const filteredEvents = eventsList.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.campusName.toLowerCase().includes(eventSearch.toLowerCase()) ||
      (e.city && e.city.toLowerCase().includes(eventSearch.toLowerCase())) ||
      e.code.includes(eventSearch);

    if (!matchesSearch) return false;

    if (eventStatusFilter !== 'all' && e.status !== eventStatusFilter) {
      return false;
    }
    return true;
  });

  const pendingCount = usersList.filter(
    (u) => u.role === 'organizer' && u.approvalStatus === 'pending'
  ).length;

  return (
    <CampusBackground dimAmount="medium">
      <View style={styles.container}>
        {/* Top Super Admin Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeSuperAdmin}>
              <Crown size={15} color="#fef08a" />
              <Text style={styles.badgeSuperAdminText}>SUPER ADMIN</Text>
            </View>
            <View>
              <Text style={styles.adminTitle}>Campus Quest Command</Text>
              <View style={styles.serverStatusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.serverStatusText}>Database Master • Root Authority</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={fetchAllData}
              activeOpacity={0.7}
              style={styles.headerIconBtn}
              title="Refresh Data"
            >
              <RefreshCw size={15} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onLogout}
              activeOpacity={0.8}
              style={styles.logoutBtn}
            >
              <LogOut size={14} color="#fca5a5" />
              <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Global Toast Banner */}
        {toastMessage && (
          <View style={styles.toastBanner}>
            <Sparkles size={14} color="#38bdf8" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* Main Tab Bar */}
        <View style={styles.navTabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('overview')}
            style={[styles.navTab, activeTab === 'overview' && styles.navTabActive]}
          >
            <TrendingUp size={14} color={activeTab === 'overview' ? '#f43f5e' : '#94a3b8'} />
            <Text style={[styles.navTabText, activeTab === 'overview' && styles.navTabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('users')}
            style={[styles.navTab, activeTab === 'users' && styles.navTabActive]}
          >
            <Users size={14} color={activeTab === 'users' ? '#f43f5e' : '#94a3b8'} />
            <Text style={[styles.navTabText, activeTab === 'users' && styles.navTabTextActive]}>
              Users & Approvals
            </Text>
            {pendingCount > 0 && (
              <View style={styles.navBadgePulse}>
                <Text style={styles.navBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('events')}
            style={[styles.navTab, activeTab === 'events' && styles.navTabActive]}
          >
            <Compass size={14} color={activeTab === 'events' ? '#f43f5e' : '#94a3b8'} />
            <Text style={[styles.navTabText, activeTab === 'events' && styles.navTabTextActive]}>
              All Events
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('payments')}
            style={[styles.navTab, activeTab === 'payments' && styles.navTabActive]}
          >
            <CreditCard size={14} color={activeTab === 'payments' ? '#f43f5e' : '#94a3b8'} />
            <Text style={[styles.navTabText, activeTab === 'payments' && styles.navTabTextActive]}>
              Ledger & UPI
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('system')}
            style={[styles.navTab, activeTab === 'system' && styles.navTabActive]}
          >
            <Server size={14} color={activeTab === 'system' ? '#f43f5e' : '#94a3b8'} />
            <Text style={[styles.navTabText, activeTab === 'system' && styles.navTabTextActive]}>
              System
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Dashboard Body */}
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {isLoading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#f43f5e" />
              <Text style={styles.loadingText}>Syncing Platform Records...</Text>
            </View>
          )}

          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {!isLoading && activeTab === 'overview' && (
            <View style={styles.tabContent}>
              {/* Attention Banner if Pending Organizers exist */}
              {pendingCount > 0 && (
                <View style={styles.pendingAlertBox}>
                  <AlertTriangle size={20} color="#fbbf24" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingAlertTitle}>
                      {pendingCount} Organizer Account{pendingCount > 1 ? 's' : ''} Awaiting Review
                    </Text>
                    <Text style={styles.pendingAlertDesc}>
                      New campus organizers have requested privileges. Review to approve or reject them.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setUserRoleFilter('pending');
                      setActiveTab('users');
                    }}
                    style={styles.reviewBtn}
                  >
                    <Text style={styles.reviewBtnText}>Review Now</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* High-level Metric Cards Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                    <Users size={18} color="#818cf8" />
                  </View>
                  <Text style={styles.metricValue}>{stats?.totalUsers || usersList.length}</Text>
                  <Text style={styles.metricLabel}>Total Accounts</Text>
                  <Text style={styles.metricSub}>{stats?.playersCount || 0} Players • {stats?.organizersCount || 0} Organizers</Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(234, 179, 8, 0.2)' }]}>
                    <Crown size={18} color="#facc15" />
                  </View>
                  <Text style={styles.metricValue}>{stats?.approvedOrganizersCount || 0}</Text>
                  <Text style={styles.metricLabel}>Approved Organizers</Text>
                  <Text style={styles.metricSub}>{pendingCount} Pending Verification</Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Compass size={18} color="#34d399" />
                  </View>
                  <Text style={styles.metricValue}>{stats?.totalEvents || eventsList.length}</Text>
                  <Text style={styles.metricLabel}>Total Hunts</Text>
                  <Text style={styles.metricSub}>{stats?.activeEvents || 0} Active • Across {stats?.campusesCount || 2} Campuses</Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(244, 63, 94, 0.2)' }]}>
                    <CreditCard size={18} color="#fb7185" />
                  </View>
                  <Text style={styles.metricValue}>₹{stats?.totalRevenue || 0}</Text>
                  <Text style={styles.metricLabel}>Platform Volume</Text>
                  <Text style={styles.metricSub}>{registrationsList.length} Registrations • {paymentsList.length} Verified Payments</Text>
                </View>
              </View>

              {/* Quick Actions Panel */}
              <View style={styles.panelCard}>
                <Text style={styles.panelTitle}>Platform Highlights & Quick Jump</Text>
                <View style={styles.quickActionsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setUserRoleFilter('organizer');
                      setActiveTab('users');
                    }}
                    style={styles.quickActionBtn}
                  >
                    <Crown size={16} color="#c084fc" />
                    <Text style={styles.quickActionText}>Manage Organizers</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setUserRoleFilter('player');
                      setActiveTab('users');
                    }}
                    style={styles.quickActionBtn}
                  >
                    <Users size={16} color="#60a5fa" />
                    <Text style={styles.quickActionText}>Player Directory</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveTab('events')}
                    style={styles.quickActionBtn}
                  >
                    <Compass size={16} color="#4ade80" />
                    <Text style={styles.quickActionText}>Global Hunts Map</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveTab('payments')}
                    style={styles.quickActionBtn}
                  >
                    <CreditCard size={16} color="#f472b6" />
                    <Text style={styles.quickActionText}>Payment Records</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: USERS & ORGANIZER APPROVALS */}
          {!isLoading && activeTab === 'users' && (
            <View style={styles.tabContent}>
              {/* Search & Filter Toolbar */}
              <View style={styles.toolbarRow}>
                <View style={styles.searchBox}>
                  <Search size={15} color="#64748b" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by username, email, phone, or campus..."
                    placeholderTextColor="#64748b"
                    value={userSearch}
                    onChangeText={setUserSearch}
                  />
                  {userSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setUserSearch('')}>
                      <X size={14} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Role Filter Pills */}
                <View style={styles.filterPills}>
                  <TouchableOpacity
                    onPress={() => setUserRoleFilter('all')}
                    style={[styles.filterPill, userRoleFilter === 'all' && styles.filterPillActive]}
                  >
                    <Text style={[styles.filterPillText, userRoleFilter === 'all' && styles.filterPillTextActive]}>
                      All ({usersList.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setUserRoleFilter('pending')}
                    style={[styles.filterPill, userRoleFilter === 'pending' && styles.filterPillWarningActive]}
                  >
                    <Text style={[styles.filterPillText, userRoleFilter === 'pending' && styles.filterPillTextActive]}>
                      Pending Review ({pendingCount})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setUserRoleFilter('organizer')}
                    style={[styles.filterPill, userRoleFilter === 'organizer' && styles.filterPillActive]}
                  >
                    <Text style={[styles.filterPillText, userRoleFilter === 'organizer' && styles.filterPillTextActive]}>
                      Organizers
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setUserRoleFilter('player')}
                    style={[styles.filterPill, userRoleFilter === 'player' && styles.filterPillActive]}
                  >
                    <Text style={[styles.filterPillText, userRoleFilter === 'player' && styles.filterPillTextActive]}>
                      Players
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Users List Table / Cards */}
              <View style={styles.usersListContainer}>
                {filteredUsers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Users size={32} color="#475569" />
                    <Text style={styles.emptyStateText}>No accounts found matching your query.</Text>
                  </View>
                ) : (
                  filteredUsers.map((u) => {
                    const isSuperAdmin = u.role === 'superadmin';
                    const isOrganizer = u.role === 'organizer';
                    const isPending = isOrganizer && u.approvalStatus === 'pending';
                    const isApproved = u.approvalStatus === 'approved';
                    const isRejected = u.approvalStatus === 'rejected';

                    return (
                      <View key={u.id} style={[styles.userCard, isPending && styles.userCardPending]}>
                        <View style={styles.userCardHeader}>
                          <View style={styles.userRoleBadgeRow}>
                            {/* Role Badge */}
                            <View
                              style={[
                                styles.roleTag,
                                isSuperAdmin && styles.roleTagAdmin,
                                isOrganizer && styles.roleTagOrg,
                                u.role === 'player' && styles.roleTagPlayer,
                              ]}
                            >
                              <Text style={styles.roleTagText}>
                                {isSuperAdmin ? '🛡️ Super Admin' : isOrganizer ? '👑 Organizer' : '🏃 Player'}
                              </Text>
                            </View>

                            {/* Organizer Approval Status Badge */}
                            {isOrganizer && (
                              <View
                                style={[
                                  styles.approvalBadge,
                                  isApproved && styles.approvalBadgeApproved,
                                  isPending && styles.approvalBadgePending,
                                  isRejected && styles.approvalBadgeRejected,
                                ]}
                              >
                                <Text style={styles.approvalBadgeText}>
                                  {isApproved ? 'Approved' : isPending ? 'Pending Review' : 'Rejected'}
                                </Text>
                              </View>
                            )}

                            {u.isVerified && (
                              <View style={styles.verifiedBadge}>
                                <CheckCircle2 size={11} color="#34d399" />
                                <Text style={styles.verifiedBadgeText}>Verified</Text>
                              </View>
                            )}
                          </View>

                          {/* Action Buttons for Super Admin */}
                          <View style={styles.userActionsRow}>
                            {/* Approve / Reject Buttons for Organizers */}
                            {isOrganizer && (
                              <View style={styles.approvalActionButtons}>
                                {u.approvalStatus !== 'approved' && (
                                  <TouchableOpacity
                                    onPress={() => handleOrganizerApproval(u.id, 'approved')}
                                    style={styles.approveBtn}
                                    title="Approve Organizer"
                                  >
                                    <Check size={13} color="#ffffff" />
                                    <Text style={styles.approveBtnText}>Approve</Text>
                                  </TouchableOpacity>
                                )}

                                {u.approvalStatus !== 'rejected' && (
                                  <TouchableOpacity
                                    onPress={() => handleOrganizerApproval(u.id, 'rejected')}
                                    style={styles.rejectBtn}
                                    title="Reject Organizer"
                                  >
                                    <X size={13} color="#ffffff" />
                                    <Text style={styles.rejectBtnText}>Reject</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            )}

                            {/* View Full Profile Info */}
                            <TouchableOpacity
                              onPress={() => setSelectedUser(u)}
                              style={styles.iconActionBtn}
                              title="View Details"
                            >
                              <Eye size={14} color="#94a3b8" />
                            </TouchableOpacity>

                            {/* Delete User (Prevent deleting Super Admin) */}
                            {!isSuperAdmin && (
                              <TouchableOpacity
                                onPress={() => handleDeleteUser(u)}
                                style={styles.deleteUserBtn}
                                title="Delete User"
                              >
                                <Trash2 size={14} color="#f87171" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>

                        {/* Account Details Row */}
                        <View style={styles.userCardBody}>
                          <Text style={styles.userCardUsername}>{u.username}</Text>
                          <Text style={styles.userCardContact}>
                            📧 {u.email || 'No email provided'} • 📱 {u.phone || 'No phone'}
                          </Text>
                          <View style={styles.userCardMetaRow}>
                            <Text style={styles.userCardMeta}>🏫 {u.campusName} ({u.campusType})</Text>
                            <Text style={styles.userCardMeta}>⭐ Score: {u.score} pts</Text>
                            <Text style={styles.userCardMeta}>🕒 Last active: {u.lastLogin}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          )}

          {/* TAB 3: ALL EVENTS ACROSS CAMPUSES & CITIES */}
          {!isLoading && activeTab === 'events' && (
            <View style={styles.tabContent}>
              <View style={styles.toolbarRow}>
                <View style={styles.searchBox}>
                  <Search size={15} color="#64748b" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search hunts by title, campus, city, or PIN..."
                    placeholderTextColor="#64748b"
                    value={eventSearch}
                    onChangeText={setEventSearch}
                  />
                  {eventSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setEventSearch('')}>
                      <X size={14} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.filterPills}>
                  {(['all', 'active', 'upcoming', 'completed'] as const).map((st) => (
                    <TouchableOpacity
                      key={st}
                      onPress={() => setEventStatusFilter(st)}
                      style={[styles.filterPill, eventStatusFilter === st && styles.filterPillActive]}
                    >
                      <Text style={[styles.filterPillText, eventStatusFilter === st && styles.filterPillTextActive]}>
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.eventsGrid}>
                {filteredEvents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Compass size={32} color="#475569" />
                    <Text style={styles.emptyStateText}>No events match your criteria.</Text>
                  </View>
                ) : (
                  filteredEvents.map((evt) => (
                    <View key={evt.id} style={styles.eventCard}>
                      <View style={styles.eventCardHeader}>
                        <View style={styles.eventCodePill}>
                          <KeyRound size={12} color="#facc15" />
                          <Text style={styles.eventCodeText}>PIN: {evt.code}</Text>
                        </View>
                        <View
                          style={[
                            styles.eventStatusBadge,
                            evt.status === 'active' && styles.eventStatusActive,
                            evt.status === 'upcoming' && styles.eventStatusUpcoming,
                            evt.status === 'completed' && styles.eventStatusCompleted,
                          ]}
                        >
                          <Text style={styles.eventStatusText}>{evt.status.toUpperCase()}</Text>
                        </View>
                      </View>

                      <Text style={styles.eventTitle}>{evt.title}</Text>
                      <Text style={styles.eventDesc} numberOfLines={2}>{evt.description}</Text>

                      <View style={styles.eventDetailsBox}>
                        <View style={styles.eventDetailLine}>
                          <MapPin size={13} color="#94a3b8" />
                          <Text style={styles.eventDetailText}>{evt.campusName} • {evt.city || 'Campus Wide'}</Text>
                        </View>
                        <View style={styles.eventDetailLine}>
                          <Calendar size={13} color="#94a3b8" />
                          <Text style={styles.eventDetailText}>{evt.date} at {evt.time}</Text>
                        </View>
                        <View style={styles.eventDetailLine}>
                          <Crown size={13} color="#94a3b8" />
                          <Text style={styles.eventDetailText}>Organizer: {evt.organizerName}</Text>
                        </View>
                        <View style={styles.eventDetailLine}>
                          <Users size={13} color="#94a3b8" />
                          <Text style={styles.eventDetailText}>
                            {evt.registeredCount || 0} Registered Players • {evt.isPaid ? `Fee: ₹${evt.registrationFee}` : 'Free'}
                          </Text>
                        </View>
                      </View>

                      {/* Super Admin Control Actions for Event */}
                      <View style={styles.eventAdminActions}>
                        <View style={styles.statusToggleGroup}>
                          <Text style={styles.statusToggleLabel}>Status:</Text>
                          {(['upcoming', 'active', 'completed'] as const).map((s) => (
                            <TouchableOpacity
                              key={s}
                              onPress={() => handleUpdateEventStatus(evt.id, s)}
                              style={[
                                styles.statusBtn,
                                evt.status === s && styles.statusBtnCurrent,
                              ]}
                            >
                              <Text style={[styles.statusBtnText, evt.status === s && styles.statusBtnTextCurrent]}>
                                {s}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <TouchableOpacity
                          onPress={() => handleDeleteEvent(evt.id, evt.title)}
                          style={styles.deleteEventBtn}
                          title="Delete Event"
                        >
                          <Trash2 size={13} color="#f87171" />
                          <Text style={styles.deleteEventBtnText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* TAB 4: REGISTRATIONS & PAYMENT RECORDS */}
          {!isLoading && activeTab === 'payments' && (
            <View style={styles.tabContent}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Event Registrations & Payment Ledger</Text>
                  <Text style={styles.sectionSubtitle}>
                    Real-time participant admissions, 6-digit PIN tracking, and UPI UTR verification
                  </Text>
                </View>
              </View>

              {/* Payments & Registrations List */}
              <View style={styles.recordsList}>
                {registrationsList.length === 0 ? (
                  <View style={styles.emptyState}>
                    <CreditCard size={32} color="#475569" />
                    <Text style={styles.emptyStateText}>No registrations recorded yet.</Text>
                  </View>
                ) : (
                  registrationsList.map((reg) => {
                    const matchingPay = paymentsList.find(
                      (p) =>
                        (reg.paymentId && p.id === reg.paymentId) ||
                        (reg.transactionId && p.transactionId === reg.transactionId) ||
                        (p.eventId === reg.eventId && p.username === reg.username)
                    );
                    const isSandboxPayment = reg.paymentMode === 'sandbox' || reg.isSimulated === true;
                    const isAutoConfirmedSandbox =
                      reg.verificationSource === 'sandbox-instant' ||
                      matchingPay?.verificationSource === 'sandbox-instant';

                    return (
                      <View key={reg.id} style={styles.recordCard}>
                        <View style={styles.recordHeader}>
                          <View>
                            <Text style={styles.recordPlayerName}>
                              👤 {reg.username} <Text style={styles.recordTeam}>({reg.teamName})</Text>
                            </Text>
                            <Text style={styles.recordEventName}>🏆 {reg.eventTitle} • {reg.campusName}</Text>
                          </View>

                          <View style={styles.recordStatusStack}>
                            {isSandboxPayment ? (
                              <View style={styles.sandboxLedgerBadge}>
                                <Text style={styles.sandboxLedgerText}>
                                  {isAutoConfirmedSandbox ? 'SANDBOX · AUTO-CONFIRMED' : 'SANDBOX · SIMULATED'}
                                </Text>
                              </View>
                            ) : null}
                            <View style={styles.recordStatusBadge}>
                              <Text style={styles.recordStatusText}>{reg.paymentStatus.toUpperCase()}</Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.recordBody}>
                          <View style={styles.recordMetaItem}>
                            <Text style={styles.recordMetaLabel}>PIN Code</Text>
                            <Text style={styles.recordMetaValue}>{reg.pinEntered || 'Verified'}</Text>
                          </View>

                          <View style={styles.recordMetaItem}>
                            <Text style={styles.recordMetaLabel}>Fee Amount</Text>
                            <Text style={styles.recordMetaValue}>₹{reg.amount || 0}</Text>
                          </View>

                          <View style={styles.recordMetaItem}>
                            <Text style={styles.recordMetaLabel}>
                              {reg.paymentMode === 'sandbox' || reg.isSimulated ? 'SIM Txn ID' : 'UTR Reference'}
                            </Text>
                            <Text style={styles.recordMetaValue}>
                              {reg.paymentMode === 'sandbox' || reg.isSimulated
                                ? (reg.transactionId || 'N/A')
                                : (reg.utrNumber || matchingPay?.utrNumber || 'N/A')}
                            </Text>
                          </View>

                          <View style={styles.recordMetaItem}>
                            <Text style={styles.recordMetaLabel}>Registered</Text>
                            <Text style={styles.recordMetaValue}>
                              {new Date(reg.registeredAt).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>

                        {/* Payment Verification Actions if Payment Exists */}
                        {matchingPay && !isAutoConfirmedSandbox && (
                          <View style={styles.recordActionsRow}>
                            <Text style={styles.matchingPayMethod}>Payment: {matchingPay.paymentMethod}</Text>
                            <View style={styles.verifyBtnsRow}>
                              <TouchableOpacity
                                onPress={() => handleVerifyPayment(matchingPay.id, 'verified')}
                                style={[
                                  styles.payActionBtn,
                                  matchingPay.status === 'verified' && styles.payActionBtnActive,
                                ]}
                              >
                                <Check size={12} color="#ffffff" />
                                <Text style={styles.payActionBtnText}>Verified</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleVerifyPayment(matchingPay.id, 'rejected')}
                                style={[
                                  styles.payActionBtnDanger,
                                  matchingPay.status === 'rejected' && styles.payActionBtnDangerActive,
                                ]}
                              >
                                <X size={12} color="#ffffff" />
                                <Text style={styles.payActionBtnText}>Reject</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        {matchingPay && isAutoConfirmedSandbox && (
                          <View style={styles.recordActionsRow}>
                            <Text style={styles.matchingPayMethod}>
                              Payment: {matchingPay.paymentMethod || 'Sandbox Simulation'}
                            </Text>
                            <View style={styles.sandboxAutoNote}>
                              <CheckCircle2 size={12} color="#34d399" />
                              <Text style={styles.sandboxAutoText}>AUTO-CONFIRMED · NO ADMIN ACTION</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          )}

          {/* TAB 5: SYSTEM HEALTH & SECURITY AUDIT */}
          {!isLoading && activeTab === 'system' && (
            <View style={styles.tabContent}>
              <View style={styles.systemCard}>
                <Text style={styles.systemCardTitle}>🛡️ Security & Access Control Policies</Text>
                
                <View style={styles.policyRow}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.policyTitle}>No Super Admin Self-Registration</Text>
                    <Text style={styles.policyDesc}>
                      Super Admin credentials reside strictly in the database seed. Public registration of Super Admin is permanently disabled.
                    </Text>
                  </View>
                </View>

                <View style={styles.policyRow}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.policyTitle}>Frontend Password Privacy Shield</Text>
                    <Text style={styles.policyDesc}>
                      Super Admin credentials are never hardcoded in client-side code. Authentication executes securely via the server backend.
                    </Text>
                  </View>
                </View>

                <View style={styles.policyRow}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.policyTitle}>Organizer Gatekeeper Verification</Text>
                    <Text style={styles.policyDesc}>
                      All organizer accounts require Super Admin approval prior to publishing campus hunts.
                    </Text>
                  </View>
                </View>

                <View style={styles.policyRow}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.policyTitle}>Anti-Enumeration Login Safeguards</Text>
                    <Text style={styles.policyDesc}>
                      Uniform credential challenge responses prevent unauthorized parties from harvesting player phone numbers or emails.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.systemCard}>
                <Text style={styles.systemCardTitle}>⚡ Server & Database Architecture</Text>
                <View style={styles.sysInfoRow}>
                  <Text style={styles.sysInfoLabel}>Environment:</Text>
                  <Text style={styles.sysInfoValue}>Development / Node.js Full-Stack</Text>
                </View>
                <View style={styles.sysInfoRow}>
                  <Text style={styles.sysInfoLabel}>Authentication Engine:</Text>
                  <Text style={styles.sysInfoValue}>Dual-Engine (Server Fast Memory + Supabase Auth)</Text>
                </View>
                <View style={styles.sysInfoRow}>
                  <Text style={styles.sysInfoLabel}>Database Resilience:</Text>
                  <Text style={styles.sysInfoValue}>Active (accountsDb, eventsDb, registrationsDb, paymentsDb)</Text>
                </View>
                <View style={styles.sysInfoRow}>
                  <Text style={styles.sysInfoLabel}>Super Admin Identity:</Text>
                  <Text style={styles.sysInfoValue}>{user.username} ({user.email})</Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>

        {/* User Detail Modal */}
        {selectedUser && (
          <Modal
            transparent
            animationType="fade"
            visible={Boolean(selectedUser)}
            onRequestClose={() => setSelectedUser(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>{selectedUser.username}</Text>
                    <Text style={styles.modalSubtitle}>Role: {selectedUser.role.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedUser(null)}
                    style={styles.modalCloseBtn}
                  >
                    <X size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Account ID:</Text>
                    <Text style={styles.modalDetailVal}>{selectedUser.id}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Email:</Text>
                    <Text style={styles.modalDetailVal}>{selectedUser.email}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Phone:</Text>
                    <Text style={styles.modalDetailVal}>{selectedUser.phone || 'None'}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Campus:</Text>
                    <Text style={styles.modalDetailVal}>{selectedUser.campusName} ({selectedUser.campusType})</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Approval Status:</Text>
                    <Text style={styles.modalDetailVal}>{selectedUser.approvalStatus || 'approved'}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Score & Stats:</Text>
                    <Text style={styles.modalDetailVal}>{selectedUser.score} pts • {selectedUser.gamesWon} Wins</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Last Login:</Text>
                    <Text style={styles.modalDetailVal}>{selectedUser.lastLogin}</Text>
                  </View>

                  {/* Organizer Approval Actions in Modal */}
                  {selectedUser.role === 'organizer' && (
                    <View style={styles.modalActionButtons}>
                      <TouchableOpacity
                        onPress={() => {
                          handleOrganizerApproval(selectedUser.id, 'approved');
                          setSelectedUser((prev) => prev ? { ...prev, approvalStatus: 'approved' } : null);
                        }}
                        style={[styles.modalApproveBtn, selectedUser.approvalStatus === 'approved' && { opacity: 0.5 }]}
                      >
                        <Check size={14} color="#ffffff" />
                        <Text style={styles.modalBtnText}>Approve Account</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          handleOrganizerApproval(selectedUser.id, 'rejected');
                          setSelectedUser((prev) => prev ? { ...prev, approvalStatus: 'rejected' } : null);
                        }}
                        style={[styles.modalRejectBtn, selectedUser.approvalStatus === 'rejected' && { opacity: 0.5 }]}
                      >
                        <X size={14} color="#ffffff" />
                        <Text style={styles.modalBtnText}>Reject Account</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </CampusBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 3,
  },
  badgeSuperAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#f87171',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeSuperAdminText: {
    color: '#fef08a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  adminTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  serverStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  serverStatusText: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '800',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
  },
  toastText: {
    color: '#e0f2fe',
    fontSize: 12,
    fontWeight: '700',
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 4,
  },
  navTabActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: '#f43f5e',
  },
  navTabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94a3b8',
  },
  navTabTextActive: {
    color: '#f43f5e',
    fontWeight: '800',
  },
  navBadgePulse: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 3,
  },
  navBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabContent: {
    gap: 14,
  },
  pendingAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
    borderWidth: 1.5,
    padding: 12,
    borderRadius: 12,
  },
  pendingAlertTitle: {
    color: '#fef3c7',
    fontSize: 13,
    fontWeight: '800',
  },
  pendingAlertDesc: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  reviewBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewBtnText: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '900',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 12,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  metricSub: {
    color: '#64748b',
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 4,
  },
  panelCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
  },
  panelTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickActionText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '700',
  },
  toolbarRow: {
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  filterPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterPill: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterPillActive: {
    backgroundColor: '#4338ca',
    borderColor: '#818cf8',
  },
  filterPillWarningActive: {
    backgroundColor: '#b45309',
    borderColor: '#fbbf24',
  },
  filterPillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  usersListContainer: {
    gap: 10,
  },
  userCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  userCardPending: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(45, 30, 15, 0.85)',
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRoleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTagAdmin: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  roleTagOrg: {
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
  },
  roleTagPlayer: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f8fafc',
  },
  approvalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  approvalBadgeApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  approvalBadgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  approvalBadgeRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  approvalBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#f8fafc',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#34d399',
  },
  userActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  approvalActionButtons: {
    flexDirection: 'row',
    gap: 5,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rejectBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  iconActionBtn: {
    padding: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  deleteUserBtn: {
    padding: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  userCardBody: {
    gap: 3,
  },
  userCardUsername: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  userCardContact: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  userCardMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  userCardMeta: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  eventsGrid: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eventCodeText: {
    color: '#fef08a',
    fontSize: 10,
    fontWeight: '900',
  },
  eventStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eventStatusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  eventStatusUpcoming: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  eventStatusCompleted: {
    backgroundColor: 'rgba(100, 116, 139, 0.25)',
  },
  eventStatusText: {
    color: '#f8fafc',
    fontSize: 9.5,
    fontWeight: '800',
  },
  eventTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  eventDesc: {
    color: '#94a3b8',
    fontSize: 11.5,
  },
  eventDetailsBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  eventDetailLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDetailText: {
    color: '#cbd5e1',
    fontSize: 10.5,
    fontWeight: '600',
  },
  eventAdminActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  statusToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusToggleLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    marginRight: 2,
  },
  statusBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: '#475569',
  },
  statusBtnCurrent: {
    backgroundColor: '#4338ca',
    borderColor: '#818cf8',
  },
  statusBtnText: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '700',
  },
  statusBtnTextCurrent: {
    color: '#ffffff',
  },
  deleteEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deleteEventBtnText: {
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  recordsList: {
    gap: 10,
  },
  recordCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordPlayerName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  recordTeam: {
    color: '#818cf8',
    fontWeight: '700',
  },
  recordEventName: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  recordStatusStack: {
    alignItems: 'flex-end',
    gap: 4,
  },
  recordStatusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recordStatusText: {
    color: '#34d399',
    fontSize: 9.5,
    fontWeight: '800',
  },
  sandboxLedgerBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sandboxLedgerText: {
    color: '#fbbf24',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  recordBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 8,
    borderRadius: 8,
  },
  recordMetaItem: {
    alignItems: 'center',
  },
  recordMetaLabel: {
    color: '#64748b',
    fontSize: 9.5,
    fontWeight: '700',
  },
  recordMetaValue: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  recordActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  matchingPayMethod: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  sandboxAutoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sandboxAutoText: {
    color: '#34d399',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  verifyBtnsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  payActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  payActionBtnActive: {
    backgroundColor: '#059669',
  },
  payActionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  payActionBtnDangerActive: {
    backgroundColor: '#dc2626',
  },
  payActionBtnText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
  },
  systemCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  systemCardTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  policyTitle: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  policyDesc: {
    color: '#94a3b8',
    fontSize: 10.5,
    marginTop: 2,
  },
  sysInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  sysInfoLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  sysInfoValue: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalBody: {
    padding: 14,
    maxHeight: 400,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalDetailLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  modalDetailVal: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '800',
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  modalApproveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 8,
  },
  modalRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#dc2626',
    paddingVertical: 9,
    borderRadius: 8,
  },
  modalBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
});
