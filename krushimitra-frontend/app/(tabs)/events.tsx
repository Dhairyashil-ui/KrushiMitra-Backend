import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Animated,
  
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Star,
  PlayCircle,
  Trophy,
  TrendingUp,
  Target,
  Wheat,
  Sparkles,
  CheckCircle
} from 'lucide-react-native';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'workshop' | 'webinar' | 'competition' | 'live';
  participants: number;
  status: 'upcoming' | 'live' | 'completed';
  countdown?: {
    days: number;
    hours: number;
    minutes: number;
  };
}

export default function EventsScreen() {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [glowAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Glow animation for live events
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    return () => {
      clearInterval(timer);
      glowLoop.stop();
    };
  }, []);

  const events: Event[] = [
    {
      id: '1',
      title: t('events.smartIrrigation') || 'Smart Irrigation Workshop',
      description: t('events.smartIrrigationDesc') || 'Learn advanced drip irrigation techniques and water conservation methods for modern farming.',
      date: '2024-01-28',
      time: '10:00 AM',
      location: t('events.agriculturalCenter') || 'Agricultural Training Center, Pune',
      type: 'workshop',
      participants: 45,
      status: 'live',
    },
    {
      id: '2',
      title: t('events.cropDiseaseManagement') || 'Crop Disease Management Webinar',
      description: t('events.cropDiseaseDesc') || 'Expert-led session on identifying and treating common crop diseases using AI-powered diagnostics.',
      date: '2024-01-30',
      time: '2:00 PM',
      location: t('events.onlineWebinar') || 'Online Webinar',
      type: 'webinar',
      participants: 120,
      status: 'upcoming',
      countdown: {
        days: 2,
        hours: 14,
        minutes: 35,
      },
    },
    {
      id: '3',
      title: t('events.bestHarvest') || 'Best Harvest Competition',
      description: t('events.bestHarvestDesc') || 'Annual competition to showcase the best crop yields and innovative farming techniques.',
      date: '2024-02-15',
      time: '9:00 AM',
      location: t('events.stateFair') || 'State Agricultural Fair, Mumbai',
      type: 'competition',
      participants: 200,
      status: 'upcoming',
      countdown: {
        days: 18,
        hours: 6,
        minutes: 22,
      },
    },
    {
      id: '4',
      title: t('events.organicFarming') || 'Organic Farming Masterclass',
      description: t('events.organicFarmingDesc') || 'Comprehensive training on organic farming practices, certification process, and market opportunities.',
      date: '2024-01-25',
      time: '11:00 AM',
      location: t('events.ruralCenter') || 'Rural Development Center, Nashik',
      type: 'workshop',
      participants: 78,
      status: 'completed',
    },
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'workshop':
        return <Target size={20} color="#4CAF50" />;
      case 'webinar':
        return <PlayCircle size={20} color="#4CAF50" />;
      case 'competition':
        return <Trophy size={20} color="#FF9800" />;
      default:
        return <Calendar size={20} color="#4CAF50" />;
    }
  };

  const getStatusColor = (status: string): [string, string] => {
    switch (status) {
      case 'live':
        return ['#4CAF50', '#2E7D32'];
      case 'upcoming':
        return ['#4CAF50', '#2E7D32'];
      case 'completed':
        return ['#6B7280', '#4B5563'];
      default:
        return ['#6B7280', '#4B5563'];
    }
  };

  const formatCountdown = (countdown: any) => {
    if (!countdown) return '';
    return `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`;
  };

  const renderEvent = (event: Event) => (
    <TouchableOpacity key={event.id} style={styles.eventCard}>
      <LinearGradient
        colors={['#FFFFFF', '#F1F8E9']}
        style={styles.eventGradient}
      >
        {/* Event Header */}
        <View style={styles.eventHeader}>
          <View style={styles.eventTypeContainer}>
            {getEventIcon(event.type)}
            <Text style={styles.eventType}>{t(`events.${event.type}`)?.toUpperCase() || event.type.toUpperCase()}</Text>
          </View>
          <LinearGradient
            colors={getStatusColor(event.status)}
            style={styles.statusBadge}
          >
            {event.status === 'live' && (
              <Animated.View
                style={[
                  styles.liveIndicator,
                  {
                    opacity: glowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ]}
              />
            )}
            <Text style={styles.statusText}>{t(`events.${event.status}`)?.toUpperCase() || event.status.toUpperCase()}</Text>
          </LinearGradient>
        </View>

        {/* Event Content */}
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDescription}>{event.description}</Text>

        {/* Event Details */}
        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.detailText}>{event.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.detailText}>{event.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.detailText}>{event.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Users size={16} color="#6B7280" />
            <Text style={styles.detailText}>{event.participants} {t('events.participants')}</Text>
          </View>
        </View>

        {/* Countdown Timer */}
        {event.countdown && event.status === 'upcoming' && (
          <View style={styles.countdownContainer}>
            <LinearGradient
              colors={['#E8F5E8', '#F1F8E9']}
              style={styles.countdownBg}
            >
              <Clock size={16} color="#4CAF50" />
              <Text style={styles.countdownText}>{t('events.startsIn')} {formatCountdown(event.countdown)}</Text>
            </LinearGradient>
          </View>
        )}

        {/* Live Session Indicator */}
        {event.status === 'live' && (
          <TouchableOpacity style={styles.joinLiveContainer}>
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.joinLiveButton}
            >
              <PlayCircle size={20} color="#FFFFFF" />
              <Text style={styles.joinLiveText}>{t('events.joinLive')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F1F8E9']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Wheat size={24} color="#4CAF50" />
              <Sparkles size={16} color="#FF9800" style={styles.sparkleIcon} />
            </View>
            <View>
              <Text style={styles.headerTitle}>KrushiAI Events</Text>
              <Text style={styles.headerSubtitle}>Weekly farming events & workshops</Text>
            </View>
          </View>
          <View style={styles.headerIcon}>
            <Calendar size={24} color="#4CAF50" />
          </View>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <TrendingUp size={18} color="#4CAF50" />
          </View>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Users size={18} color="#4CAF50" />
          </View>
          <Text style={styles.statNumber}>1.2k</Text>
          <Text style={styles.statLabel}>Participants</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <CheckCircle size={18} color="#FF9800" />
          </View>
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Events List */}
      <ScrollView style={styles.eventsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {events.map(renderEvent)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  eventsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  eventCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  eventGradient: {
    padding: 20,
    borderRadius: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  eventDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  eventDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  countdownContainer: {
    marginBottom: 12,
  },
  countdownBg: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  joinLiveContainer: {
    marginTop: 8,
  },
  joinLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  joinLiveText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});