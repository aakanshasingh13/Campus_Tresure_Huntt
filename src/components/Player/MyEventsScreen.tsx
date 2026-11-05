import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  Play,
  Award,
  AlertCircle,
  Compass,
  ShieldAlert,
} from 'lucide-react-native';
import { TreasureEvent, UserProfile } from '../../types';
import { isEventStartedByOrganizer } from '../../utils/eventStatusHelper';

interface MyEventsScreenProps {
  user: UserProfile;
  events: TreasureEvent[];
  joinedEventIds: string[];
  eliminatedEventIds?: string[];
  onOpenGame: (event: TreasureEvent) => void;
  onOpenPostEvent: (event: TreasureEvent) => void;
  onOpenEventDetails: (event: TreasureEvent) => void;
  onBrowseEvents: () => void;
}

export const MyEventsScreen: React.FC<MyEventsScreenProps> = ({
  user,
  events,
  joinedEventIds,
  eliminatedEventIds = [],
  onOpenGame,
  onOpenPostEvent,
  onOpenEventDetails,
  onBrowseEvents,
}) => {
  const [now, setNow] = useState(Date.now());

  // Ticking timer for real-time countdown calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter for events the player has actually joined
  const joinedEvents = events.filter((evt) => Boolean(evt && evt.id && joinedEventIds.includes(evt.id)));

  // Compute countdown string
  const getCountdownString = (dateStr: string, timeStr: string): string => {
    try {
      const targetTime = new Date(`${dateStr}T${timeStr || '14:00'}:00`).getTime();
      const diffMs = targetTime - now;

      if (isNaN(diffMs) || diffMs <= 0) {
        return 'Starting any moment';
      }

      const diffSecs = Math.floor(diffMs / 1000);
      const days = Math.floor(diffSecs / 86400);
      const hours = Math.floor((diffSecs % 86400) / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const seconds = diffSecs % 60;

      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      }
      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      }
      return `${minutes}m ${seconds}s`;
    } catch (e) {
      return '2h 15m';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.headerCard}>
        <View style={styles.headerIconCircle}>
          <ShieldCheck size={22} color="#fbbf24" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Registered Hunts</Text>
          <Text style={styles.headerSub}>
            Track your upcoming schedules, live active game sessions, and solved quest archives.
          </Text>
        </View>
      </View>

      {/* List or Empty State */}
      {joinedEvents.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Compass size={32} color="#64748b" />
          </View>
          <Text style={styles.emptyTitle}>You haven't joined any events yet.</Text>
          <Text style={styles.emptyDesc}>
            Explore the events catalog, register your team, and get ready to crack campus puzzles!
          </Text>
          <TouchableOpacity onPress={onBrowseEvents} style={styles.browseBtn} activeOpacity={0.8}>
            <Text style={styles.browseBtnText}>Browse Available Events</Text>
            <ChevronRight size={15} color="#0f172a" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.eventsList}>
          {joinedEvents.map((evt, idx) => {
            const isLive = isEventStartedByOrganizer(evt);
            const isClosed = evt.status === 'completed';
            const isUpcoming = !isLive && !isClosed;
            const countdown = getCountdownString(evt.date, evt.time);

            const isEliminated = Boolean(evt?.id && eliminatedEventIds.includes(evt.id));

            const handleCardPress = () => {
              if (isEliminated) {
                alert(`Access Denied: You have been disqualified and eliminated from "${evt.title}" due to anti-cheat fair play violations. You cannot participate in this event again.`);
                return;
              }
              if (isLive) {
                onOpenGame(evt);
              } else if (isClosed) {
                onOpenPostEvent(evt);
              } else {
                onOpenEventDetails(evt);
              }
            };

            return (
              <TouchableOpacity
                key={evt.id}
                onPress={handleCardPress}
                style={[
                  styles.joinedEventCard,
                  isLive && !isEliminated && styles.liveCardHighlight,
                  isEliminated && styles.eliminatedCardHighlight,
                ]}
                {...({ className: `quest-interactive-card stagger-card-${(idx % 4) + 1}` } as any)}
                activeOpacity={0.85}
              >
                {/* Status Strip & Top Bar */}
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {evt.title}
                    </Text>
                    <View style={styles.venueRow}>
                      <MapPin size={11} color="#fbbf24" />
                      <Text style={styles.venueText} numberOfLines={1}>
                        {evt.startLocation} • {evt.campusName || evt.campusType}
                      </Text>
                    </View>
                  </View>

                  {/* Status Indicator */}
                  {isEliminated ? (
                    <View style={styles.disqualifiedBadge}>
                      <ShieldAlert size={11} color="#ef4444" />
                      <Text style={styles.disqualifiedBadgeText}>Disqualified</Text>
                    </View>
                  ) : isLive ? (
                    <View style={styles.liveBadge}>
                      <View style={styles.pulseDot} />
                      <Text style={styles.liveBadgeText}>Live Now</Text>
                    </View>
                  ) : isUpcoming ? (
                    <View style={styles.upcomingBadge}>
                      <Clock size={11} color="#fde047" />
                      <Text style={styles.upcomingBadgeText}>Registered</Text>
                    </View>
                  ) : (
                    <View style={styles.closedBadge}>
                      <Award size={11} color="#94a3b8" />
                      <Text style={styles.closedBadgeText}>Completed</Text>
                    </View>
                  )}
                </View>

                {/* COUNTDOWN OR LIVE ACTION CALLOUT (Requirement #3) */}
                {isEliminated ? (
                  <View style={styles.disqualifiedCallout}>
                    <ShieldAlert size={16} color="#ef4444" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.disqualifiedCalloutTitle}>ELIMINATED & BARRED</Text>
                      <Text style={styles.disqualifiedCalloutSub}>
                        Anti-cheat violation (2 strikes) incurred. Re-entry barred.
                      </Text>
                    </View>
                  </View>
                ) : isUpcoming ? (
                  <View style={styles.countdownCallout}>
                    <View style={styles.countdownIconBox}>
                      <Clock size={16} color="#fbbf24" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.countdownLabel}>Starts in</Text>
                      <Text style={styles.countdownValue}>{countdown}</Text>
                    </View>
                    <View style={styles.schedulePill}>
                      <Text style={styles.scheduleText}>{evt.date} @ {evt.time}</Text>
                    </View>
                  </View>
                ) : null}

                {isLive && !isEliminated && (
                  <View style={styles.liveGameCallout} {...({ className: 'btn-splash-primary' } as any)}>
                    <View style={styles.liveCalloutLeft}>
                      <Play size={18} color="#ffffff" fill="#ffffff" />
                      <View>
                        <Text style={styles.liveGameTitle}>Start Event</Text>
                        <Text style={styles.liveGameSub}>Event is ready! Click to solve clues one by one</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#ffffff" />
                  </View>
                )}

                {isClosed && (
                  <View style={styles.completedCallout}>
                    <Award size={15} color="#fbbf24" />
                    <Text style={styles.completedCalloutText}>Hunt finished. Tap to view final rankings & feedback.</Text>
                    <ChevronRight size={14} color="#fbbf24" />
                  </View>
                )}

                {/* Bottom Meta Details */}
                <View style={styles.cardFooterRow}>
                  <View style={styles.footerItem}>
                    <Sparkles size={11} color="#fbbf24" />
                    <Text style={styles.footerItemText}>{evt.clues ? evt.clues.length : 0} Checkpoints</Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Text style={styles.footerItemText}>PIN: {evt.code || '849201'}</Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Text style={styles.detailsLinkText}>View Specs →</Text>
                  </View>
                </View>
              </TouchableOpacity>
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
    gap: 14,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },

  /* Empty state */
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 12.5,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
    marginBottom: 8,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#b45309',
    borderWidth: 1.5,
    borderColor: '#fde047',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  browseBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#ffffff',
  },

  /* Events list */
  eventsList: {
    gap: 14,
  },
  joinedEventCard: {
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
  liveCardHighlight: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  eventTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  venueText: {
    fontSize: 12,
    color: '#cbd5e1',
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
  },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  },

  /* Countdown callout (Requirement #3) */
  countdownCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  countdownIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  schedulePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scheduleText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },

  /* Live Game Callout (Requirement #3) */
  liveGameCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#b45309',
    borderWidth: 1.5,
    borderColor: '#fde047',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  liveCalloutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  liveGameTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  liveGameSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fef08a',
  },

  completedCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 10,
  },
  completedCalloutText: {
    flex: 1,
    fontSize: 11.5,
    color: '#cbd5e1',
  },

  /* Card footer */
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerItemText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  detailsLinkText: {
    fontSize: 11.5,
    color: '#38bdf8',
    fontWeight: '700',
  },
  eliminatedCardHighlight: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(30, 15, 20, 0.85)',
  },
  disqualifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  disqualifiedBadgeText: {
    color: '#f87171',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  disqualifiedCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
    padding: 10,
    borderRadius: 10,
  },
  disqualifiedCalloutTitle: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  disqualifiedCalloutSub: {
    color: '#fca5a5',
    fontSize: 11,
    lineHeight: 15,
  },
});
