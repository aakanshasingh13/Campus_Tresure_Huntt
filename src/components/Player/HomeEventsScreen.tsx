import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Tag,
  Compass,
  AlertCircle,
  PlusCircle,
  Play,
  Bell,
  Lock,
  Unlock,
  Flame,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react-native';
import { TreasureEvent, UserProfile } from '../../types';

interface HomeEventsScreenProps {
  user: UserProfile;
  events: TreasureEvent[];
  joinedEventIds: string[];
  onSelectEvent: (event: TreasureEvent) => void;
  onQuickJoinEvent?: (event: TreasureEvent) => void;
  onUnregisterEvent?: (eventId: string) => void;
  onGoToMyEvents: () => void;
  onSeedSampleOrganizerEvent?: () => void;
  onLaunchGame?: (event: TreasureEvent) => void;
}

export const HomeEventsScreen: React.FC<HomeEventsScreenProps> = ({
  user,
  events,
  joinedEventIds,
  onSelectEvent,
  onQuickJoinEvent,
  onUnregisterEvent,
  onGoToMyEvents,
  onSeedSampleOrganizerEvent,
  onLaunchGame,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'closed'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Simulation switches for testing day-of-event & ready-to-start states
  const [simulatedDayOfEvent, setSimulatedDayOfEvent] = useState<boolean | null>(null);
  const [simulatedReadyToStart, setSimulatedReadyToStart] = useState<boolean | null>(null);

  const playerName = user.username || 'Explorer';

  // Find registered events
  const registeredEvents = events.filter((evt) => evt && evt.id && joinedEventIds.includes(evt.id));
  const primaryRegistered = registeredEvents[0] || null;

  // Determine if today is the day of the registered event
  const isRegisteredEventToday = primaryRegistered ? (() => {
    if (simulatedDayOfEvent !== null) return simulatedDayOfEvent;
    if (primaryRegistered.status === 'active') return true;
    if (!primaryRegistered.date) return false;
    try {
      const today = new Date();
      const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (primaryRegistered.date === todayYMD) return true;
      const parsed = new Date(primaryRegistered.date);
      if (!isNaN(parsed.getTime())) {
        return (
          parsed.getFullYear() === today.getFullYear() &&
          parsed.getMonth() === today.getMonth() &&
          parsed.getDate() === today.getDate()
        );
      }
    } catch (e) {}
    return false;
  })() : false;

  const isRegisteredEventReady = primaryRegistered ? (
    simulatedReadyToStart !== null
      ? simulatedReadyToStart
      : primaryRegistered.status === 'active' || isRegisteredEventToday
  ) : false;

  // Filter events based on search and selected filter chips
  const filteredEvents = events.filter((evt) => {
    if (!evt || !evt.id) return false;
    // Search query matching title, location, or campus
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = evt.title?.toLowerCase().includes(q);
      const matchLoc = evt.startLocation?.toLowerCase().includes(q) || evt.campusName?.toLowerCase().includes(q);
      const matchDesc = evt.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchLoc && !matchDesc) return false;
    }

    // Status filter
    if (statusFilter === 'live' && evt.status !== 'active') return false;
    if (statusFilter === 'upcoming' && evt.status !== 'upcoming') return false;
    if (statusFilter === 'closed' && evt.status !== 'completed') return false;

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      const diff = (evt.difficulty || 'Medium').toLowerCase();
      if (diff !== difficultyFilter.toLowerCase()) return false;
    }

    return true;
  });

  const getStatusBadge = (status: TreasureEvent['status']) => {
    if (status === 'active') {
      return (
        <View style={styles.liveBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveBadgeText}>Live Now</Text>
        </View>
      );
    }
    if (status === 'upcoming') {
      return (
        <View style={styles.upcomingBadge}>
          <Clock size={11} color="#fde047" />
          <Text style={styles.upcomingBadgeText}>Upcoming</Text>
        </View>
      );
    }
    return (
      <View style={styles.closedBadge}>
        <Text style={styles.closedBadgeText}>Closed</Text>
      </View>
    );
  };

  const getDifficultyColor = (diff?: string) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return { bg: 'rgba(251, 191, 36, 0.12)', text: '#fde68a', border: 'rgba(251, 191, 36, 0.35)' };
      case 'hard':
      case 'expert':
      case 'master':
        return { bg: 'rgba(180, 83, 9, 0.28)', text: '#fcd34d', border: '#d97706' };
      case 'medium':
      default:
        return { bg: 'rgba(245, 158, 11, 0.18)', text: '#fbbf24', border: '#f59e0b' };
    }
  };

  const getPriceLabel = (evt: TreasureEvent) => {
    if (evt.isPaid && evt.registrationFee && evt.registrationFee > 0) {
      return `${evt.currency || '₹'}${evt.registrationFee}`;
    }
    return 'Free';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Welcome Line: "Welcome, [Player Name]" */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeSubtitle}>Player Operations Center</Text>
            <Text style={styles.welcomeTitle}>
              Welcome, <Text style={styles.welcomeName}>{playerName}</Text>
            </Text>
          </View>
          {joinedEventIds.length > 0 && (
            <TouchableOpacity
              onPress={onGoToMyEvents}
              style={styles.myEventsQuickBtn}
              {...({ className: 'btn-splash-secondary' } as any)}
              activeOpacity={0.7}
            >
              <ShieldCheck size={14} color="#fbbf24" />
              <Text style={styles.myEventsQuickBtnText}>
                My Events ({joinedEventIds.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.welcomeCaption}>
          Discover live organizer quests, crack secret codes, and compete on campus leaderboards.
        </Text>
      </View>

      {/* ======================================================== */}
      {/* REGISTERED EVENT HERO / BIG "Start Event" MESSAGE        */}
      {/* On the day of the event when ready to start, shows the   */}
      {/* BIG "Start Event" message right on the main page!        */}
      {/* ======================================================== */}
      {primaryRegistered && (
        <View style={styles.registeredSectionWrapper}>
          {isRegisteredEventToday && isRegisteredEventReady ? (
            /* BIG "Start Event" MESSAGE ON MAIN PAGE */
            <View style={styles.bigStartEventCard}>
              <View style={styles.bigStartHeaderRow}>
                <View style={styles.bigStartLiveBadge}>
                  <View style={styles.bigPulseDot} />
                  <Text style={styles.bigStartLiveBadgeText}>
                    TODAY IS EVENT DAY • READY TO START!
                  </Text>
                </View>
                <View style={styles.liveTagPill}>
                  <Flame size={12} color="#fbbf24" />
                  <Text style={styles.liveTagText}>HUNT LIVE</Text>
                </View>
              </View>

              <Text style={styles.bigEventHeading}>{primaryRegistered.title}</Text>
              <Text style={styles.bigEventSubheading}>
                The hunt has been signaled ready by the organizer! Click below to enter the live game.
                Clues are revealed <Text style={{ color: '#fbbf24', fontWeight: '800' }}>one by one</Text> which
                you must solve correctly to unlock each subsequent checkpoint.
              </Text>

              {/* Quick Specs Chips */}
              <View style={styles.bigStartSpecsRow}>
                <View style={styles.bigStartSpecItem}>
                  <MapPin size={13} color="#38bdf8" />
                  <Text style={styles.bigStartSpecText}>
                    {primaryRegistered.startLocation || 'Campus Quad'}
                  </Text>
                </View>
                <View style={styles.bigStartSpecItem}>
                  <Sparkles size={13} color="#fbbf24" />
                  <Text style={styles.bigStartSpecText}>
                    {primaryRegistered.clues?.length || 0} Sequential Checkpoints
                  </Text>
                </View>
                <View style={styles.bigStartSpecItem}>
                  <Clock size={13} color="#38bdf8" />
                  <Text style={styles.bigStartSpecText}>{primaryRegistered.duration || '2h'}</Text>
                </View>
              </View>

              {/* THE BIG "Start Event" ACTION BUTTON */}
              <TouchableOpacity
                onPress={() => {
                  if (onLaunchGame) {
                    onLaunchGame(primaryRegistered);
                  } else {
                    onSelectEvent(primaryRegistered);
                  }
                }}
                style={styles.bigStartEventMainBtn}
                activeOpacity={0.85}
              >
                <Play size={24} color="#0f172a" fill="#0f172a" />
                <Text style={styles.bigStartEventMainBtnText}>Start Event</Text>
              </TouchableOpacity>

              {/* Footer controls & links */}
              <View style={styles.bigStartFooterRow}>
                <TouchableOpacity
                  onPress={() => onSelectEvent(primaryRegistered)}
                  style={styles.bigStartDetailsLink}
                >
                  <Text style={styles.bigStartDetailsLinkText}>View Event Briefing & Rules →</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSimulatedDayOfEvent(false);
                    setSimulatedReadyToStart(false);
                  }}
                  style={styles.simulationResetBtn}
                >
                  <Text style={styles.simulationResetText}>Test Before-Day View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* REGISTERED EVENT PRE-EVENT BRIEFING (Before event day) */
            <View style={styles.regBriefingCard}>
              <View style={styles.regBriefingHeader}>
                <View style={styles.regBadgePill}>
                  <CheckCircle2 size={13} color="#10b981" />
                  <Text style={styles.regBadgeText}>Your Registered Event</Text>
                </View>

                {/* Tester Simulation Toggle */}
                <TouchableOpacity
                  onPress={() => {
                    setSimulatedDayOfEvent(true);
                    setSimulatedReadyToStart(true);
                  }}
                  style={styles.simulateDayToggleBtn}
                  activeOpacity={0.7}
                >
                  <Sparkles size={12} color="#fbbf24" />
                  <Text style={styles.simulateDayToggleText}>Simulate: Event Day & Ready</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.regBriefingTitle}>{primaryRegistered.title}</Text>
              <Text style={styles.regBriefingSub}>
                Sandbox payment confirmed. You are successfully registered for this event!
              </Text>

              {/* Immediate Event Alerts & Notifications (provided right after registration) */}
              <View style={styles.regAlertsBox}>
                <View style={styles.regAlertsHeader}>
                  <Bell size={13} color="#fbbf24" />
                  <Text style={styles.regAlertsTitle}>
                    Event Alerts & Notifications (Active)
                  </Text>
                </View>
                <Text style={styles.regAlertsText}>
                  • Start Venue: Report at {primaryRegistered.startLocation || 'Central Campus'} 15m prior to {primaryRegistered.time || '14:00'}.
                </Text>
                <Text style={styles.regAlertsText}>
                  • Registration: Payment confirmed. Team slot secured.
                </Text>
              </View>

              {/* Clues and Hints Status Notice: Locked until event day */}
              <View style={styles.regCluesLockedNotice}>
                <Lock size={14} color="#fbbf24" />
                <Text style={styles.regCluesLockedText}>
                  Clues & hints will only be provided on the day of the event ({primaryRegistered.date || 'Event Day'}).
                  The big "Start Event" message will activate automatically when ready to start.
                </Text>
              </View>

              {/* Open Full Event Details */}
              <TouchableOpacity
                onPress={() => onSelectEvent(primaryRegistered)}
                style={styles.openRegDetailsBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.openRegDetailsBtnText}>
                  View Registered Event Details & Alerts
                </Text>
                <ArrowRight size={14} color="#0f172a" />
              </TouchableOpacity>

              {/* Reset Registration (Allows re-testing the registration flow) */}
              {onUnregisterEvent && (
                <TouchableOpacity
                  onPress={() => onUnregisterEvent(primaryRegistered.id)}
                  style={{ alignSelf: 'center', paddingTop: 6 }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 11, color: '#f87171', fontWeight: '600' }}>
                    Reset Registration to Re-test Joining Flow
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* 2. Search & Filter Header */}
      {events.length > 0 && (
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Search size={16} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search event name, location or campus..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.clearSearchText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <TouchableOpacity
              onPress={() => setStatusFilter('all')}
              style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
                All ({events.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusFilter('live')}
              style={[styles.filterChip, statusFilter === 'live' && styles.filterChipActive]}
            >
              <View style={styles.chipDotLive} />
              <Text style={[styles.filterChipText, statusFilter === 'live' && styles.filterChipTextActive]}>
                Live Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusFilter('upcoming')}
              style={[styles.filterChip, statusFilter === 'upcoming' && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, statusFilter === 'upcoming' && styles.filterChipTextActive]}>
                Upcoming
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusFilter('closed')}
              style={[styles.filterChip, statusFilter === 'closed' && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, statusFilter === 'closed' && styles.filterChipTextActive]}>
                Closed
              </Text>
            </TouchableOpacity>

            {/* Difficulty Separator */}
            <View style={styles.chipDivider} />

            {['Easy', 'Medium', 'Hard'].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                onPress={() => setDifficultyFilter(difficultyFilter === lvl ? 'all' : lvl)}
                style={[styles.filterChip, difficultyFilter === lvl && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, difficultyFilter === lvl && styles.filterChipTextActive]}>
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 3. Event List or Empty State */}
      {events.length === 0 ? (
        // EXACT REQUIREMENT: If no events exist, show centered text: "No event is currently going on."
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Compass size={36} color="#64748b" />
          </View>
          <Text style={styles.emptyCenteredText}>No event is currently going on.</Text>
          <Text style={styles.emptySubtext}>
            Check back later when organizers launch new campus treasure hunts, or create an event in Organizer mode!
          </Text>

          {onSeedSampleOrganizerEvent && (
            <TouchableOpacity
              onPress={onSeedSampleOrganizerEvent}
              style={styles.seedDemoBtn}
              activeOpacity={0.8}
            >
              <Sparkles size={14} color="#0f172a" />
              <Text style={styles.seedDemoBtnText}>Publish Sample Organizer Event</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : filteredEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AlertCircle size={32} color="#64748b" />
          <Text style={styles.emptyCenteredText}>No matching events found</Text>
          <Text style={styles.emptySubtext}>Try changing your search terms or clearing your filters.</Text>
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setDifficultyFilter('all');
            }}
            style={styles.resetFilterBtn}
          >
            <Text style={styles.resetFilterBtnText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.eventCardsList}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeaderTitle}>Active & Upcoming Quests</Text>
            <Text style={styles.listHeaderCount}>{filteredEvents.length} available</Text>
          </View>

          {filteredEvents.map((evt, evtIdx) => {
            const isJoined = joinedEventIds.includes(evt.id);
            const price = getPriceLabel(evt);
            const diffStyle = getDifficultyColor(evt.difficulty);
            const clueCount = evt.clues ? evt.clues.length : 0;

            return (
              <View
                key={evt.id}
                style={styles.eventCard}
                {...({ className: `quest-interactive-card stagger-card-${(evtIdx % 4) + 1}` } as any)}
              >
                {/* Top Row: Event Name & Status Tag */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {evt.title}
                  </Text>
                  {getStatusBadge(evt.status)}
                </View>

                {/* Subtitle / Location */}
                <View style={styles.cardCampusRow}>
                  <MapPin size={12} color="#fbbf24" />
                  <Text style={styles.cardCampusText} numberOfLines={1}>
                    {evt.startLocation || 'Main Campus'} • {evt.campusName || evt.campusType}
                  </Text>
                </View>

                {/* Tags Bar: Price, Level, Checkpoints, Join/Joined Indicator */}
                <View style={styles.tagsContainer}>
                  {/* Price Tag */}
                  <View style={[styles.tagPill, price === 'Free' ? styles.freePill : styles.paidPill]}>
                    <Tag size={11} color={price === 'Free' ? '#fde68a' : '#fbbf24'} />
                    <Text style={[styles.tagText, price === 'Free' ? styles.freeText : styles.paidText]}>
                      {price}
                    </Text>
                  </View>

                  {/* Level Tag (Easy / Medium / Hard) */}
                  <View
                    style={[
                      styles.tagPill,
                      { backgroundColor: diffStyle.bg, borderColor: diffStyle.border, borderWidth: 1 },
                    ]}
                  >
                    <Zap size={11} color={diffStyle.text} />
                    <Text style={[styles.tagText, { color: diffStyle.text }]}>
                      {evt.difficulty || 'Medium'}
                    </Text>
                  </View>

                  {/* Checkpoints Count */}
                  <View style={styles.tagPillMuted}>
                    <Sparkles size={11} color="#fbbf24" />
                    <Text style={styles.tagTextMuted}>{clueCount} Clues</Text>
                  </View>

                  {/* Join / Joined Indicator */}
                  {isJoined ? (
                    <View style={styles.joinedBadge}>
                      <ShieldCheck size={12} color="#fbbf24" />
                      <Text style={styles.joinedBadgeText}>Joined ✓</Text>
                    </View>
                  ) : (
                    <View style={styles.notJoinedBadge}>
                      <Text style={styles.notJoinedBadgeText}>Not Joined</Text>
                    </View>
                  )}
                </View>

                {/* Date & Time Row */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Calendar size={12} color="#cbd5e1" />
                    <Text style={styles.metaText}>{evt.date || 'TBD'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={12} color="#cbd5e1" />
                    <Text style={styles.metaText}>{evt.time || '14:00'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.organizerByText}>By {evt.organizerName || 'Guild'}</Text>
                  </View>
                </View>

                {/* Action Buttons Row: Event Details & Register Button */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    onPress={() => onSelectEvent(evt)}
                    style={[styles.detailsBtn, !isJoined && styles.registerPrimaryBtn]}
                    {...({ className: 'btn-splash-primary' } as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.detailsBtnText}>
                      {isJoined ? 'Event Details' : `Register (${price})`}
                    </Text>
                    <ChevronRight size={14} color="#ffffff" />
                  </TouchableOpacity>

                  {isJoined ? (
                    <View style={styles.registeredCardBadge}>
                      <ShieldCheck size={13} color="#10b981" />
                      <Text style={styles.registeredCardBadgeText}>Registered</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => onSelectEvent(evt)}
                      style={styles.quickJoinBtn}
                      {...({ className: 'btn-splash-secondary' } as any)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.quickJoinBtnText}>View & Register</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  /* 1. Welcome Section */
  welcomeSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  welcomeSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  welcomeName: {
    color: '#38bdf8',
  },
  welcomeCaption: {
    fontSize: 12.5,
    color: '#94a3b8',
    lineHeight: 18,
  },
  myEventsQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  myEventsQuickBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#38bdf8',
  },

  /* 2. Filter Section */
  filterSection: {
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#f8fafc',
    padding: 0,
  },
  clearSearchText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterChipTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  chipDotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  chipDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },

  /* 3. Empty State (Centered Text per specification) */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyCenteredText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  emptySubtext: {
    fontSize: 12.5,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 18,
  },
  seedDemoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  seedDemoBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  resetFilterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
  },
  resetFilterBtnText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '600',
  },

  /* 4. Event Cards */
  eventCardsList: {
    gap: 14,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  listHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listHeaderCount: {
    fontSize: 11.5,
    color: '#fbbf24',
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: 'rgba(11, 19, 41, 0.95)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.22)',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16.5,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.2,
  },

  /* Status Badges */
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: '#fbbf24',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fbbf24',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fde047',
    textTransform: 'uppercase',
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  upcomingBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#f1f5f9',
    textTransform: 'uppercase',
  },
  closedBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  closedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },

  cardCampusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardCampusText: {
    fontSize: 12,
    color: '#cbd5e1',
  },

  /* Tags Row */
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freePill: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  paidPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  freeText: {
    color: '#fde68a',
  },
  paidText: {
    color: '#fbbf24',
  },
  tagPillMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagTextMuted: {
    fontSize: 11,
    color: '#e2e8f0',
    fontWeight: '600',
  },

  /* Join/Joined Indicator */
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: '#fbbf24',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  joinedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fde047',
  },
  notJoinedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  notJoinedBadgeText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11.5,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  organizerByText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },

  /* Actions Row */
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 4,
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#b45309',
    borderWidth: 1.5,
    borderColor: '#fde047',
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#ffffff',
  },
  quickJoinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quickJoinBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fde047',
  },
  registerPrimaryBtn: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  registeredCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  registeredCardBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
  },

  /* Registered Event Hero & Big "Start Event" styles */
  registeredSectionWrapper: {
    marginBottom: 8,
  },
  bigStartEventCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#fbbf24',
    gap: 12,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  bigStartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  bigStartLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  bigPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
  },
  bigStartLiveBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fde047',
    letterSpacing: 0.5,
  },
  liveTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fca5a5',
    letterSpacing: 0.5,
  },
  bigEventHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  bigEventSubheading: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  bigStartSpecsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  bigStartSpecItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bigStartSpecText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  bigStartEventMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fbbf24',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 4,
  },
  bigStartEventMainBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bigStartFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  bigStartDetailsLink: {
    paddingVertical: 4,
  },
  bigStartDetailsLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  simulationResetBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  simulationResetText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
  },

  /* Pre-event registered card */
  regBriefingCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    gap: 10,
  },
  regBriefingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  regBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
    textTransform: 'uppercase',
  },
  simulateDayToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  simulateDayToggleText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#fbbf24',
  },
  regBriefingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  regBriefingSub: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  regAlertsBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 10,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  regAlertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  regAlertsTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#fbbf24',
  },
  regAlertsText: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 15,
  },
  regCluesLockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  regCluesLockedText: {
    fontSize: 11,
    color: '#fbbf24',
    lineHeight: 15,
    flex: 1,
  },
  openRegDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fbbf24',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 2,
  },
  openRegDetailsBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
});
