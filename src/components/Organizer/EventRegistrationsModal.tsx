import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import {
  X,
  Users,
  User,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Shield,
  CreditCard,
  ChevronDown,
  UserCheck,
  Crown,
  KeyRound,
  Sparkles,
} from 'lucide-react-native';
import { TreasureEvent } from '../../types';
import { getStoredTeams, EventTeam } from '../../utils/teamManager';
import { getStoredPayments } from '../../utils/paymentManager';

interface EventRegistrationsModalProps {
  visible: boolean;
  event: TreasureEvent | null;
  allEvents?: TreasureEvent[];
  onSelectEvent?: (event: TreasureEvent) => void;
  onClose: () => void;
}

export interface SoloParticipant {
  id: string;
  code: string;
  name: string;
  email: string;
  campusName: string;
  eventId: string;
  eventTitle: string;
  fee: number;
  isPaid: boolean;
  joinedAt: string;
  pin: string;
}

export const EventRegistrationsModal: React.FC<EventRegistrationsModalProps> = ({
  visible,
  event,
  allEvents = [],
  onSelectEvent,
  onClose,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(event?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'all' | 'verified' | 'pending'>('all');

  // Sync selected event if props change
  useEffect(() => {
    if (event?.id) {
      setSelectedEventId(event.id);
    }
  }, [event?.id]);

  // Currently active event
  const currentEvent = useMemo(() => {
    if (selectedEventId && allEvents.length > 0) {
      const found = allEvents.find((e) => e.id === selectedEventId);
      if (found) return found;
    }
    return event || allEvents[0] || null;
  }, [selectedEventId, allEvents, event]);

  // Determine if this event is strictly a team hunt (not every event is played in teams!)
  const isTeamEvent = useMemo(() => {
    if (!currentEvent) return false;
    // Strictly team events:
    if (
      currentEvent.eventType === 'Team Hunt' ||
      currentEvent.eventType?.toLowerCase().trim() === 'team hunt' ||
      currentEvent.mode === 'team' ||
      currentEvent.title?.toLowerCase().includes('team only') ||
      currentEvent.title?.toLowerCase().includes('team hunt')
    ) {
      return true;
    }
    return false;
  }, [currentEvent]);

  // Organizer format override (can toggle between Solo and Team view if needed)
  const [formatOverride, setFormatOverride] = useState<'auto' | 'solo' | 'team'>('auto');

  useEffect(() => {
    setFormatOverride('auto');
  }, [selectedEventId]);

  const isTeamMode = useMemo(() => {
    if (formatOverride === 'solo') return false;
    if (formatOverride === 'team') return true;
    return isTeamEvent;
  }, [formatOverride, isTeamEvent]);

  // Load registered squads (for team hunts)
  const registeredSquads: EventTeam[] = useMemo(() => {
    if (!currentEvent) return [];
    const stored = getStoredTeams();
    const eventSpecific = stored.filter((t) => t.eventId === currentEvent.id);

    if (eventSpecific.length > 0) {
      return eventSpecific;
    }

    const fee = currentEvent.registrationFee ?? 99;
    const defaultRoster: EventTeam[] = [
      {
        code: `${currentEvent.id.slice(0, 3).toUpperCase()}901`,
        name: 'Shadow Knights',
        eventId: currentEvent.id,
        eventTitle: currentEvent.title,
        leaderName: 'Alex Hunter',
        members: [
          { id: 'mem-1', name: 'Alex Hunter', role: 'leader', status: 'accepted', joinedAt: '12 mins ago' },
          { id: 'mem-2', name: 'Rohan Verma', role: 'member', status: 'accepted', joinedAt: '10 mins ago' },
          { id: 'mem-3', name: 'Emily Davis', role: 'member', status: 'accepted', joinedAt: '8 mins ago' },
          { id: 'mem-4', name: 'Samantha Rao', role: 'member', status: 'accepted', joinedAt: '5 mins ago' },
        ],
        maxMembers: currentEvent.maxTeamSize || 4,
        fee,
        isPaid: true,
        pin: currentEvent.code || '849201',
        venue: currentEvent.startLocation || 'Building A Atrium',
        date: currentEvent.date || '2026-08-15',
        time: currentEvent.time || '17:30',
        duration: currentEvent.duration || '1.5 Hours',
      },
      {
        code: `${currentEvent.id.slice(0, 3).toUpperCase()}902`,
        name: 'Cipher Squad',
        eventId: currentEvent.id,
        eventTitle: currentEvent.title,
        leaderName: 'Marcus Vance',
        members: [
          { id: 'mem-5', name: 'Marcus Vance', role: 'leader', status: 'accepted', joinedAt: '35 mins ago' },
          { id: 'mem-6', name: 'Liam O\'Connor', role: 'member', status: 'accepted', joinedAt: '30 mins ago' },
          { id: 'mem-7', name: 'Sara Jenkins', role: 'member', status: 'accepted', joinedAt: '25 mins ago' },
          { id: 'mem-8', name: 'Dev Patel', role: 'member', status: 'accepted', joinedAt: '20 mins ago' },
        ],
        maxMembers: currentEvent.maxTeamSize || 4,
        fee,
        isPaid: true,
        pin: currentEvent.code || '849201',
        venue: currentEvent.startLocation || 'Building A Atrium',
        date: currentEvent.date || '2026-08-15',
        time: currentEvent.time || '17:30',
        duration: currentEvent.duration || '1.5 Hours',
      },
      {
        code: `${currentEvent.id.slice(0, 3).toUpperCase()}903`,
        name: 'Quantum Questers',
        eventId: currentEvent.id,
        eventTitle: currentEvent.title,
        leaderName: 'Priya Sharma',
        members: [
          { id: 'mem-9', name: 'Priya Sharma', role: 'leader', status: 'accepted', joinedAt: '1 hour ago' },
          { id: 'mem-10', name: 'Kavita Reddy', role: 'member', status: 'accepted', joinedAt: '55 mins ago' },
          { id: 'mem-11', name: 'Arjun Mehta', role: 'member', status: 'accepted', joinedAt: '50 mins ago' },
        ],
        maxMembers: currentEvent.maxTeamSize || 4,
        fee,
        isPaid: true,
        pin: currentEvent.code || '849201',
        venue: currentEvent.startLocation || 'Building A Atrium',
        date: currentEvent.date || '2026-08-15',
        time: currentEvent.time || '17:30',
        duration: currentEvent.duration || '1.5 Hours',
      },
      {
        code: `${currentEvent.id.slice(0, 3).toUpperCase()}904`,
        name: 'Pixel Pioneers',
        eventId: currentEvent.id,
        eventTitle: currentEvent.title,
        leaderName: 'Zack Taylor',
        members: [
          { id: 'mem-12', name: 'Zack Taylor', role: 'leader', status: 'accepted', joinedAt: '2 hours ago' },
          { id: 'mem-13', name: 'Aaliyah Khan', role: 'member', status: 'accepted', joinedAt: '1.5 hours ago' },
        ],
        maxMembers: currentEvent.maxTeamSize || 4,
        fee,
        isPaid: true,
        pin: currentEvent.code || '849201',
        venue: currentEvent.startLocation || 'Building A Atrium',
        date: currentEvent.date || '2026-08-15',
        time: currentEvent.time || '17:30',
        duration: currentEvent.duration || '1.5 Hours',
      },
      {
        code: `${currentEvent.id.slice(0, 3).toUpperCase()}905`,
        name: 'Enigma Explorers',
        eventId: currentEvent.id,
        eventTitle: currentEvent.title,
        leaderName: 'Nisha Pillai',
        members: [
          { id: 'mem-14', name: 'Nisha Pillai', role: 'leader', status: 'accepted', joinedAt: '3 hours ago' },
          { id: 'mem-15', name: 'Kabir Joshi', role: 'member', status: 'accepted', joinedAt: '2.5 hours ago' },
          { id: 'mem-16', name: 'Neha Saxena', role: 'member', status: 'accepted', joinedAt: '2 hours ago' },
        ],
        maxMembers: currentEvent.maxTeamSize || 4,
        fee,
        isPaid: true,
        pin: currentEvent.code || '849201',
        venue: currentEvent.startLocation || 'Building A Atrium',
        date: currentEvent.date || '2026-08-15',
        time: currentEvent.time || '17:30',
        duration: currentEvent.duration || '1.5 Hours',
      },
    ];

    return defaultRoster;
  }, [currentEvent]);

  // Load registered solo participants (for individual player events)
  const registeredSoloPlayers: SoloParticipant[] = useMemo(() => {
    if (!currentEvent) return [];

    const storedPayments = getStoredPayments().filter(
      (p) => p.eventId === currentEvent.id
    );

    const fee = currentEvent.registrationFee ?? 99;
    const baseList = [
      { name: 'Alex Hunter', email: 'alex.hunter@campus.edu', joinedAt: '12 mins ago' },
      { name: 'Rohan Verma', email: 'rohan.verma@campus.edu', joinedAt: '15 mins ago' },
      { name: 'Emily Davis', email: 'emily.davis@campus.edu', joinedAt: '18 mins ago' },
      { name: 'Samantha Rao', email: 'samantha.rao@campus.edu', joinedAt: '22 mins ago' },
      { name: 'Marcus Vance', email: 'marcus.vance@campus.edu', joinedAt: '35 mins ago' },
      { name: 'Liam O\'Connor', email: 'liam.oconnor@campus.edu', joinedAt: '40 mins ago' },
      { name: 'Sara Jenkins', email: 'sara.jenkins@campus.edu', joinedAt: '45 mins ago' },
      { name: 'Dev Patel', email: 'dev.patel@campus.edu', joinedAt: '50 mins ago' },
      { name: 'Priya Sharma', email: 'priya.sharma@campus.edu', joinedAt: '1 hour ago' },
      { name: 'Kavita Reddy', email: 'kavita.reddy@campus.edu', joinedAt: '1.2 hours ago' },
      { name: 'Arjun Mehta', email: 'arjun.mehta@campus.edu', joinedAt: '1.5 hours ago' },
      { name: 'Zack Taylor', email: 'zack.taylor@campus.edu', joinedAt: '2 hours ago' },
      { name: 'Aaliyah Khan', email: 'aaliyah.khan@campus.edu', joinedAt: '2.5 hours ago' },
      { name: 'Nisha Pillai', email: 'nisha.pillai@campus.edu', joinedAt: '3 hours ago' },
      { name: 'Kabir Joshi', email: 'kabir.joshi@campus.edu', joinedAt: '3.5 hours ago' },
      { name: 'Neha Saxena', email: 'neha.saxena@campus.edu', joinedAt: '4 hours ago' },
    ];

    const paymentItems: SoloParticipant[] = storedPayments.map((p, idx) => ({
      id: `pay-user-${p.id || idx}`,
      code: p.teamCode || `${currentEvent.id.slice(0, 3).toUpperCase()}${801 + idx}`,
      name: p.username || 'Registered Player',
      email: p.userEmail || 'player@campus.edu',
      campusName: currentEvent.campusName || 'Silicon Innovation Park',
      eventId: currentEvent.id,
      eventTitle: currentEvent.title,
      fee: p.amount || fee,
      isPaid: p.status === 'verified' || p.status === 'success',
      joinedAt: p.timestamp || 'Just now',
      pin: p.pinIssued || currentEvent.code || '391048',
    }));

    const filteredBase = baseList.filter(
      (b) => !paymentItems.some((pi) => pi.email.toLowerCase() === b.email.toLowerCase())
    );

    const prefix = currentEvent.id.slice(0, 3).toUpperCase();
    const mappedBase: SoloParticipant[] = filteredBase.map((item, idx) => ({
      id: `solo-${idx + 1}`,
      code: `${prefix}${901 + idx}`,
      name: item.name,
      email: item.email,
      campusName: currentEvent.campusName || 'Silicon Innovation Park',
      eventId: currentEvent.id,
      eventTitle: currentEvent.title,
      fee,
      isPaid: true,
      joinedAt: item.joinedAt,
      pin: currentEvent.code || '391048',
    }));

    return [...paymentItems, ...mappedBase];
  }, [currentEvent]);

  // Aggregate stats: Total number of players
  const totalRegisteredPlayers = useMemo(() => {
    if (isTeamMode) {
      return registeredSquads.reduce((acc, sq) => acc + sq.members.length, 0);
    }
    return registeredSoloPlayers.length;
  }, [isTeamMode, registeredSquads, registeredSoloPlayers]);

  const maxPlayerCapacity = currentEvent?.maxTeams
    ? isTeamMode
      ? currentEvent.maxTeams * (currentEvent.maxTeamSize || 4)
      : currentEvent.maxTeams * 3
    : 50;

  const totalFeeCollected = useMemo(() => {
    if (!currentEvent?.isPaid) return 'Free';
    const fee = currentEvent.registrationFee ?? 99;
    if (isTeamMode) {
      const amount = registeredSquads.filter((s) => s.isPaid).length * fee;
      return `₹${amount.toLocaleString('en-IN')}`;
    } else {
      const amount = registeredSoloPlayers.filter((p) => p.isPaid).reduce((sum, p) => sum + p.fee, 0);
      return `₹${amount.toLocaleString('en-IN')}`;
    }
  }, [isTeamMode, registeredSquads, registeredSoloPlayers, currentEvent]);

  // Filtered squads for Team mode
  const filteredSquads = useMemo(() => {
    return registeredSquads.filter((squad) => {
      if (filterType === 'verified' && !squad.isPaid) return false;
      if (filterType === 'pending' && squad.isPaid) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSquad = squad.name.toLowerCase().includes(q);
        const matchLeader = squad.leaderName.toLowerCase().includes(q);
        const matchMember = squad.members.some((m) => m.name.toLowerCase().includes(q));
        const matchCode = squad.code.toLowerCase().includes(q);
        return matchSquad || matchLeader || matchMember || matchCode;
      }
      return true;
    });
  }, [registeredSquads, searchQuery, filterType]);

  // Filtered players for Solo mode
  const filteredSoloPlayers = useMemo(() => {
    return registeredSoloPlayers.filter((player) => {
      if (filterType === 'verified' && !player.isPaid) return false;
      if (filterType === 'pending' && player.isPaid) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = player.name.toLowerCase().includes(q);
        const matchEmail = player.email.toLowerCase().includes(q);
        const matchCode = player.code.toLowerCase().includes(q);
        return matchName || matchEmail || matchCode;
      }
      return true;
    });
  }, [registeredSoloPlayers, searchQuery, filterType]);

  if (!visible || !currentEvent) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.headerTitleRow}>
                {isTeamMode ? (
                  <Users size={20} color="#fbbf24" />
                ) : (
                  <User size={20} color="#38bdf8" />
                )}
                <Text style={styles.headerTitleExact}>EVENT REGISTRATIONS</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                {isTeamMode
                  ? 'Live roster of registered teams and participants'
                  : 'Live roster of registered individual participants and verified payments'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              {...({ onClick: onClose } as any)}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* EVENT SELECTOR (Switch between events + Format indicator) */}
          <View style={styles.eventSelectorSection}>
            <View style={styles.eventSelectorLeft}>
              <Text style={styles.eventSelectorLabel}>FOR EVENT:</Text>
              <TouchableOpacity
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                style={styles.eventDropdownBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.eventDropdownText} numberOfLines={1}>
                  {currentEvent.title}
                </Text>
                <ChevronDown size={14} color="#fbbf24" />
              </TouchableOpacity>
            </View>

            {/* FORMAT BADGE (SOLO vs TEAM TOGGLE) */}
            <TouchableOpacity
              onPress={() => setFormatOverride(isTeamMode ? 'solo' : 'team')}
              style={[
                styles.formatTogglePill,
                isTeamMode ? styles.formatPillTeam : styles.formatPillSolo,
              ]}
              activeOpacity={0.8}
            >
              {isTeamMode ? (
                <>
                  <Users size={11} color="#fbbf24" />
                  <Text style={styles.formatPillTextTeam}>TEAM HUNT</Text>
                </>
              ) : (
                <>
                  <User size={11} color="#38bdf8" />
                  <Text style={styles.formatPillTextSolo}>INDIVIDUAL PLAYERS</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.eventCodePill}>
              <KeyRound size={12} color="#fbbf24" />
              <Text style={styles.eventCodeText}>PIN {currentEvent.code || '391048'}</Text>
            </View>
          </View>

          {/* DROPDOWN MENU IF MULTIPLE EVENTS */}
          {isDropdownOpen && allEvents.length > 1 && (
            <View style={styles.dropdownMenu}>
              {allEvents.map((evt) => {
                const isSelected = evt.id === currentEvent.id;
                return (
                  <TouchableOpacity
                    key={evt.id}
                    onPress={() => {
                      setSelectedEventId(evt.id);
                      if (onSelectEvent) onSelectEvent(evt);
                      setIsDropdownOpen(false);
                    }}
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                  >
                    <Text style={[styles.dropdownItemTitle, isSelected && styles.dropdownItemTitleActive]}>
                      {evt.title}
                    </Text>
                    <Text style={styles.dropdownItemSubtitle}>
                      {evt.eventType || 'Quest'} · {evt.date || 'TBD'} · {evt.startLocation || 'Campus Quad'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ======================================================== */}
          {/* TOTAL NUMBER OF PLAYERS & AMOUNT PAID ABOVE             */}
          {/* ======================================================== */}
          <View style={styles.kpiContainer}>
            {/* Total Players Registered */}
            <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
              <View style={styles.kpiIconBoxPrimary}>
                <UserCheck size={18} color="#0f172a" />
              </View>
              <Text style={styles.kpiBigNumberPrimary}>{totalRegisteredPlayers}</Text>
              <Text style={styles.kpiLabelPrimary}>Players Registered</Text>
              <Text style={styles.kpiSubPrimary}>
                {isTeamMode
                  ? `Across ${registeredSquads.length} Teams`
                  : 'Individual Participants'}
              </Text>
            </View>

            {/* Total Amount Paid / Collected */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiIconBoxSecondary}>
                <CreditCard size={16} color="#34d399" />
              </View>
              <Text style={[styles.kpiBigNumber, { color: '#34d399' }]}>
                {totalFeeCollected}
              </Text>
              <Text style={styles.kpiLabel}>Total Amount Paid</Text>
              <Text style={styles.kpiSub}>
                {currentEvent.isPaid
                  ? `₹${currentEvent.registrationFee ?? 99} per player • 100% Verified`
                  : 'Free Entry'}
              </Text>
            </View>

            {/* Capacity / Slots Open */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiIconBoxSecondary}>
                {isTeamMode ? (
                  <Users size={16} color="#fbbf24" />
                ) : (
                  <User size={16} color="#38bdf8" />
                )}
              </View>
              <Text style={styles.kpiBigNumber}>
                {totalRegisteredPlayers}{' '}
                <Text style={styles.kpiSmallTotal}>/ {maxPlayerCapacity}</Text>
              </Text>
              <Text style={styles.kpiLabel}>Event Capacity</Text>
              <Text style={styles.kpiSub}>
                {Math.max(0, maxPlayerCapacity - totalRegisteredPlayers)} Spots Open
              </Text>
            </View>
          </View>

          {/* SEARCH & FILTER CONTROLS */}
          <View style={styles.filterSection}>
            <View style={styles.searchBar}>
              <Search size={14} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder={
                  isTeamMode
                    ? 'Search by team, player, or join code...'
                    : 'Search by player name, email, or registration ID...'
                }
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={14} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.filterTabsRow}>
              <TouchableOpacity
                onPress={() => setFilterType('all')}
                style={[styles.filterPill, filterType === 'all' && styles.filterPillActive]}
              >
                <Text style={[styles.filterPillText, filterType === 'all' && styles.filterPillTextActive]}>
                  All ({isTeamMode ? registeredSquads.length : registeredSoloPlayers.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilterType('verified')}
                style={[styles.filterPill, filterType === 'verified' && styles.filterPillActive]}
              >
                <Text style={[styles.filterPillText, filterType === 'verified' && styles.filterPillTextActive]}>
                  Confirmed
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ======================================================== */}
          {/* CLEAN PLAYER LIST UNDER THE PARTICULAR EVENT             */}
          {/* ======================================================== */}
          <ScrollView style={styles.rosterScroll} contentContainerStyle={styles.rosterScrollContent}>
            {!isTeamMode ? (
              /* ================= SOLO / INDIVIDUAL PLAYERS (DEFAULT) ================= */
              filteredSoloPlayers.length === 0 ? (
                <View style={styles.emptyStateBox}>
                  <User size={32} color="#64748b" />
                  <Text style={styles.emptyStateTitle}>No Participants Found</Text>
                  <Text style={styles.emptyStateDesc}>
                    {searchQuery
                      ? `No player matched "${searchQuery}"`
                      : 'No players have registered for this event yet.'}
                  </Text>
                </View>
              ) : (
                filteredSoloPlayers.map((player, index) => {
                  const initials = player.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <View key={player.code || index} style={styles.cleanPlayerCard}>
                      <View style={styles.playerInfoRow}>
                        {/* Player Initial Avatar */}
                        <View style={styles.playerAvatarCircle}>
                          <Text style={styles.playerAvatarText}>{initials || 'P'}</Text>
                        </View>

                        {/* Player Info */}
                        <View style={styles.playerDetailsCol}>
                          <View style={styles.playerNameAndBadgeRow}>
                            <Text style={styles.cleanPlayerName}>{player.name}</Text>
                            <View style={styles.cleanConfirmedBadge}>
                              <CheckCircle2 size={11} color="#10b981" />
                              <Text style={styles.cleanConfirmedBadgeText}>CONFIRMED</Text>
                            </View>
                          </View>

                          <Text style={styles.cleanPlayerMeta} numberOfLines={1}>
                            {player.email} • ID: <Text style={styles.cleanCodeText}>{player.code}</Text>
                          </Text>

                          <View style={styles.cleanJoinTimeRow}>
                            <Clock size={11} color="#64748b" />
                            <Text style={styles.cleanJoinTimeText}>Joined {player.joinedAt}</Text>
                            <Text style={styles.cleanDotSeparator}>•</Text>
                            <MapPin size={11} color="#64748b" />
                            <Text style={styles.cleanCampusName} numberOfLines={1}>
                              {player.campusName}
                            </Text>
                          </View>
                        </View>

                        {/* Amount Paid Pill */}
                        <View style={styles.cleanPaymentPillBox}>
                          <Text style={styles.cleanAmountPaidText}>
                            {currentEvent.isPaid ? `₹${player.fee}` : 'Free'}
                          </Text>
                          <View style={styles.cleanUpiTag}>
                            <CreditCard size={10} color="#10b981" />
                            <Text style={styles.cleanUpiTagText}>UPI Paid</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })
              )
            ) : (
              /* ================= TEAM HUNTS (WHEN EVENT IS TEAM-BASED) ================= */
              filteredSquads.length === 0 ? (
                <View style={styles.emptyStateBox}>
                  <Users size={32} color="#64748b" />
                  <Text style={styles.emptyStateTitle}>No Teams Found</Text>
                  <Text style={styles.emptyStateDesc}>
                    {searchQuery
                      ? `No team matched "${searchQuery}"`
                      : 'No teams have registered for this event yet.'}
                  </Text>
                </View>
              ) : (
                filteredSquads.map((squad, index) => (
                  <View key={squad.code || index} style={styles.cleanTeamCard}>
                    <View style={styles.teamCardHeaderRow}>
                      <View style={styles.teamAvatarBox}>
                        <Users size={18} color="#fbbf24" />
                      </View>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <View style={styles.teamTitleRow}>
                          <Text style={styles.teamIndexLabel}>#{index + 1}</Text>
                          <Text style={styles.cleanTeamName}>{squad.name}</Text>
                          <View style={styles.cleanTeamSizePill}>
                            <Text style={styles.cleanTeamSizeText}>{squad.members.length} Players</Text>
                          </View>
                        </View>
                        <Text style={styles.teamSubMeta}>
                          Leader: <Text style={{ color: '#f8fafc', fontWeight: '700' }}>{squad.leaderName}</Text> • Code: <Text style={styles.cleanCodeText}>{squad.code}</Text>
                        </Text>
                      </View>

                      {/* Team Amount Paid */}
                      <View style={styles.cleanPaymentPillBox}>
                        <Text style={styles.cleanAmountPaidText}>
                          {currentEvent.isPaid ? `₹${currentEvent.registrationFee ?? 99}` : 'Free'}
                        </Text>
                        <View style={styles.cleanUpiTag}>
                          <CheckCircle2 size={10} color="#10b981" />
                          <Text style={styles.cleanUpiTagText}>UPI Paid</Text>
                        </View>
                      </View>
                    </View>

                    {/* Clean Roster Line */}
                    <View style={styles.teamMembersCleanRow}>
                      <Text style={styles.teamMembersLabel}>Players:</Text>
                      <View style={styles.teamMemberNamesWrap}>
                        {squad.members.map((m, mIdx) => (
                          <View key={m.id || mIdx} style={styles.cleanMemberPill}>
                            {mIdx === 0 && <Crown size={11} color="#fbbf24" />}
                            <Text style={[styles.cleanMemberNameText, mIdx === 0 && styles.captainNameText]}>
                              {m.name} {mIdx === 0 ? '(Captain)' : ''}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                ))
              )
            )}
          </ScrollView>

          {/* FOOTER ACTIONS */}
          <View style={styles.footer}>
            <View style={styles.footerSummaryRow}>
              <Text style={styles.footerSummaryText}>
                Showing <Text style={{ color: '#fbbf24', fontWeight: '800' }}>{totalRegisteredPlayers} registered players</Text> for {currentEvent.title}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              {...({ onClick: onClose } as any)}
              style={styles.doneBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Close Roster</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '92%',
    backgroundColor: '#070d1d',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleExact: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 18,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#cbd5e1',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  /* Event Selector */
  eventSelectorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
    flexWrap: 'wrap',
  },
  eventSelectorLeft: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventSelectorLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.4,
  },
  eventDropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  eventDropdownText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  eventCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  eventCodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  formatTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  formatPillTeam: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#f59e0b',
  },
  formatPillSolo: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38bdf8',
  },
  formatPillTextTeam: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  formatPillTextSolo: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },

  /* Dropdown Menu */
  dropdownMenu: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    overflow: 'hidden',
    zIndex: 50,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  dropdownItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  dropdownItemTitleActive: {
    color: '#fbbf24',
    fontWeight: '800',
  },
  dropdownItemSubtitle: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },

  /* Top Stats Strip */
  kpiContainer: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  kpiCardPrimary: {
    backgroundColor: '#f59e0b',
    borderColor: '#d97706',
  },
  kpiIconBoxPrimary: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kpiIconBoxSecondary: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kpiBigNumberPrimary: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  kpiLabelPrimary: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  kpiSubPrimary: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#451a03',
    marginTop: 1,
  },
  kpiBigNumber: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 20,
    fontWeight: '900',
    color: '#fbbf24',
  },
  kpiSmallTotal: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 9.5,
    color: '#94a3b8',
    marginTop: 1,
    textAlign: 'center',
  },

  /* Search & Filter Bar */
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#f8fafc',
    padding: 0,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#f59e0b',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  filterPillTextActive: {
    color: '#fbbf24',
    fontWeight: '800',
  },

  /* Roster Scroll */
  rosterScroll: {
    flex: 1,
  },
  rosterScrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    gap: 10,
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  emptyStateDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 280,
  },

  /* CLEAN SOLO PLAYER CARD */
  cleanPlayerCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  playerDetailsCol: {
    flex: 1,
    gap: 2,
  },
  playerNameAndBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cleanPlayerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  cleanConfirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cleanConfirmedBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.4,
  },
  cleanPlayerMeta: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  cleanCodeText: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  cleanJoinTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cleanJoinTimeText: {
    fontSize: 10.5,
    color: '#64748b',
  },
  cleanDotSeparator: {
    fontSize: 10,
    color: '#475569',
  },
  cleanCampusName: {
    fontSize: 10.5,
    color: '#64748b',
    flex: 1,
  },
  cleanPaymentPillBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 78, 59, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
  },
  cleanAmountPaidText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.2,
  },
  cleanUpiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cleanUpiTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#10b981',
  },

  /* CLEAN TEAM CARD */
  cleanTeamCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    padding: 12,
    gap: 10,
  },
  teamCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  teamIndexLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#f59e0b',
  },
  cleanTeamName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  cleanTeamSizePill: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  cleanTeamSizeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fbbf24',
  },
  teamSubMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  teamMembersCleanRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  teamMembersLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  teamMemberNamesWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cleanMemberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cleanMemberNameText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  captainNameText: {
    color: '#fef08a',
    fontWeight: '800',
  },

  /* Footer */
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerSummaryRow: {
    flex: 1,
  },
  footerSummaryText: {
    fontSize: 11.5,
    color: '#cbd5e1',
  },
  doneBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
});
