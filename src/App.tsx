import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { INITIAL_EVENTS, INITIAL_LEADERBOARD, INITIAL_USER } from './data/mockData';
import { TreasureEvent, UserProfile } from './types';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { MobileContainer } from './components/MobileContainer';
import { OrganizerDashboard } from './components/Organizer/OrganizerDashboard';
import { PlayerDashboard } from './components/Player/PlayerDashboard';
import { SuperAdminDashboard } from './components/SuperAdmin/SuperAdminDashboard';
import { useBackendDiscovery } from './hooks/useBackendDiscovery';
import { apiFetch } from './lib/apiFetch';
import {
  getAuthenticatedSessionUser,
  logoutUserFromSupabase,
} from './lib/supabase';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'login' | 'dashboard'>('splash');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const connection = useBackendDiscovery();
  const [events, setEvents] = useState<TreasureEvent[]>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('campus_organizer_events');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter((e: any) => Boolean(e && e.id));
        }
      }
    } catch (e) {}
    return INITIAL_EVENTS;
  });

  // Fetch server events and merge once the backend is discovered
  useEffect(() => {
    if (connection.status !== 'connected') {
      return;
    }

    let cancelled = false;
    apiFetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) {
          return;
        }
        if (data && Array.isArray(data.events) && data.events.length > 0) {
          setEvents((prev) => {
            const merged = [...data.events];
            for (const pe of prev) {
              if (!merged.some((m) => m.id === pe.id)) {
                merged.push(pe);
              }
            }
            return merged;
          });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [connection.status, connection.baseUrl]);

  // Persist organizer events
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('campus_organizer_events', JSON.stringify(events));
      }
    } catch (e) {}
  }, [events]);

  // Restore authenticated session automatically on load/refresh
  useEffect(() => {
    let isMounted = true;
    getAuthenticatedSessionUser().then((restoredUser) => {
      if (isMounted && restoredUser) {
        setCurrentUser(restoredUser);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartFromSplash = () => {
    setCurrentScreen('login');
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentScreen('dashboard');
  };

  const handleLogout = async () => {
    await logoutUserFromSupabase();
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  const handleUpdateUser = (updatedFields: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('supabase_active_user', JSON.stringify(updated));
        }
      } catch (e) {}
      return updated;
    });
  };

  const handleDeleteAccount = async () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('supabase_active_user');
      }
    } catch (e) {}
    await logoutUserFromSupabase();
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  const handleAddEvent = (newEvent: TreasureEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
  };

  const handleUpdateEvent = (updatedEvent: TreasureEvent) => {
    if (!updatedEvent || !updatedEvent.id) return;
    setEvents((prev) =>
      prev.map((evt) => (evt && evt.id === updatedEvent.id ? updatedEvent : evt))
    );
  };

  const activeEvent = events.find((e) => e && e.status === 'active') || events[0] || null;

  return (
    <MobileContainer>
      {currentScreen === 'splash' && <SplashScreen onStart={handleStartFromSplash} />}

      {currentScreen === 'login' && <LoginScreen onLoginSuccess={handleLoginSuccess} />}

      {currentScreen === 'dashboard' && currentUser && (
        <View style={{ flex: 1 }}>
          {currentUser.role === 'superadmin' ? (
            <SuperAdminDashboard
              user={currentUser}
              onLogout={handleLogout}
            />
          ) : currentUser.role === 'organizer' ? (
            <OrganizerDashboard
              user={currentUser}
              events={events}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onUpdateUser={handleUpdateUser}
              onDeleteAccount={handleDeleteAccount}
              onLogout={handleLogout}
            />
          ) : (
            <PlayerDashboard
              user={currentUser}
              events={events}
              activeEvent={activeEvent}
              leaderboard={INITIAL_LEADERBOARD}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onUpdateUser={handleUpdateUser}
              onDeleteAccount={handleDeleteAccount}
              onLogout={handleLogout}
            />
          )}
        </View>
      )}
    </MobileContainer>
  );
}
