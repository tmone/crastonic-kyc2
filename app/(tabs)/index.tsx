import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';

const { width } = Dimensions.get('window');

// Crastonic Brand Colors
const colors = {
  // Primary Colors
  primary: '#4A90E2', // Crastonic Blue - Trust & Security
  secondary: '#7B68EE', // Purple - Innovation & Web3
  
  // Accent Colors
  success: '#27AE60', // Green - Growth & Success
  warning: '#F39C12', // Orange - Activity
  danger: '#E74C3C', // Red - Important alerts
  
  // Neutral Colors
  dark: '#1a1a2e', // Dark Navy - Premium feel
  darkSecondary: '#16213e', // Darker Navy
  gray1: '#333333', // Text primary
  gray2: '#666666', // Text secondary
  gray3: '#999999', // Text tertiary
  gray4: '#E5E5E5', // Borders
  gray5: '#F8F9FA', // Background
  white: '#FFFFFF',
  
  // Gradient Colors
  gradientStart: '#4A90E2',
  gradientEnd: '#7B68EE',
  darkGradientStart: '#1a1a2e',
  darkGradientEnd: '#0f0f1e',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: 'John Doe',
    kycStatus: 'verified',
    kycLevel: 'Gold',
    totalAssets: '12.5',
    monthlyReturn: '+15.3',
    rentalIncome: '0.8',
  });

  const [featuredProjects, setFeaturedProjects] = useState([
    {
      id: '1',
      name: 'Sunrise Apartment',
      location: 'District 2, HCMC',
      minInvestment: '0.1',
      expectedReturn: '12',
      tokensLeft: 234,
      totalTokens: 1000,
      image: 'https://via.placeholder.com/300x200',
    },
    {
      id: '2',
      name: 'Green Tower',
      location: 'District 7, HCMC',
      minInvestment: '0.15',
      expectedReturn: '10',
      tokensLeft: 567,
      totalTokens: 2000,
      image: 'https://via.placeholder.com/300x200',
    },
  ]);

  const [userAssets, setUserAssets] = useState([
    {
      id: '1',
      name: 'Sunrise Apartment',
      tokens: 50,
      monthlyIncome: '0.05',
    },
    {
      id: '2',
      name: 'Pearl Plaza',
      tokens: 100,
      monthlyIncome: '0.12',
    },
    {
      id: '3',
      name: 'Diamond Residence',
      tokens: 25,
      monthlyIncome: '0.03',
    },
  ]);

  const [trendingProjects, setTrendingProjects] = useState([
    { id: '1', name: 'Luxury Villa Phu Quoc', change: '+25%' },
    { id: '2', name: 'Tech Park Tower', change: '+18%' },
    { id: '3', name: 'Beachfront Resort', change: '+15%' },
    { id: '4', name: 'City Center Mall', change: '+12%' },
  ]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const CrastonicLogo = () => (
    <View style={styles.logoContainer}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.logoGradient}
      >
        <Text style={styles.logoText}>C</Text>
      </LinearGradient>
      <Text style={styles.logoFullText}>CRASTONIC</Text>
    </View>
  );

  const renderHeader = () => (
    <LinearGradient
      colors={[colors.white, colors.gray5]}
      style={styles.header}
    >
      <View style={styles.headerTop}>
        <CrastonicLogo />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="bell" size={24} color={colors.gray1} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="user" size={24} color={colors.gray1} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.headerGreeting}>
        <Text style={styles.greeting}>Hello, {userProfile.name}!</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</Text>
      </View>
    </LinearGradient>
  );

  const renderKYCStatus = () => (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.kycCard}
    >
      <View style={styles.kycPattern}>
        {/* Decorative pattern */}
        <View style={[styles.patternCircle, { top: -20, right: -20 }]} />
        <View style={[styles.patternCircle, { bottom: -30, left: -30, width: 80, height: 80 }]} />
      </View>
      <View style={styles.kycContent}>
        <View style={styles.kycLeft}>
          <View style={styles.kycBadge}>
            <Feather name="shield" size={20} color={colors.white} />
            <Text style={styles.kycBadgeText}>KYC Verified</Text>
          </View>
          <Text style={styles.kycLevel}>{userProfile.kycLevel} Member</Text>
          <Text style={styles.kycDate}>Verified on June 5, 2025</Text>
        </View>
        <TouchableOpacity style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Feather name="chevron-right" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderPortfolioOverview = () => (
    <View style={styles.portfolioCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrapper}>
          <Feather name="trending-up" size={22} color={colors.primary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Portfolio Overview</Text>
        </View>
      </View>
      <View style={styles.portfolioStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Assets</Text>
          <Text style={styles.statValue}>{userProfile.totalAssets} ETH</Text>
          <View style={styles.statBar}>
            <View style={[styles.statBarFill, { width: '75%', backgroundColor: colors.primary }]} />
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Monthly Return</Text>
          <Text style={[styles.statValue, styles.positiveValue]}>
            {userProfile.monthlyReturn}%
          </Text>
          <View style={styles.statBar}>
            <View style={[styles.statBarFill, { width: '85%', backgroundColor: colors.success }]} />
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Rental Income</Text>
          <Text style={styles.statValue}>{userProfile.rentalIncome} ETH/mo</Text>
          <View style={styles.statBar}>
            <View style={[styles.statBarFill, { width: '60%', backgroundColor: colors.secondary }]} />
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.manageButton}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.manageButtonGradient}
        >
          <Text style={styles.manageButtonText}>Manage Portfolio</Text>
          <Feather name="arrow-right" size={18} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrapper}>
          <Feather name="zap" size={22} color={colors.primary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
      </View>
      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.actionItem}>
          <LinearGradient
            colors={[colors.primary, colors.primary + '20']}
            style={styles.actionIcon}
          >
            <Feather name="shopping-cart" size={24} color={colors.primary} />
          </LinearGradient>
          <Text style={styles.actionText}>Buy Tokens</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <LinearGradient
            colors={[colors.success, colors.success + '20']}
            style={styles.actionIcon}
          >
            <Feather name="trending-up" size={24} color={colors.success} />
          </LinearGradient>
          <Text style={styles.actionText}>Sell Tokens</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <LinearGradient
            colors={[colors.warning, colors.warning + '20']}
            style={styles.actionIcon}
          >
            <Feather name="send" size={24} color={colors.warning} />
          </LinearGradient>
          <Text style={styles.actionText}>Transfer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <LinearGradient
            colors={[colors.secondary, colors.secondary + '20']}
            style={styles.actionIcon}
          >
            <Feather name="bar-chart-2" size={24} color={colors.secondary} />
          </LinearGradient>
          <Text style={styles.actionText}>Reports</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFeaturedProject = ({ item }) => (
    <TouchableOpacity style={styles.projectCard}>
      <Image source={{ uri: item.image }} style={styles.projectImage} contentFit="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(26, 26, 46, 0.9)']}
        style={styles.projectGradient}
      >
        <View style={styles.projectInfo}>
          <View style={styles.projectBadge}>
            <Text style={styles.projectBadgeText}>FEATURED</Text>
          </View>
          <Text style={styles.projectName}>{item.name}</Text>
          <View style={styles.projectLocation}>
            <Feather name="map-pin" size={12} color={colors.white} />
            <Text style={styles.projectLocationText}>{item.location}</Text>
          </View>
          <View style={styles.projectStats}>
            <View style={styles.projectStat}>
              <Text style={styles.projectStatLabel}>Min. Investment</Text>
              <Text style={styles.projectStatValue}>{item.minInvestment} ETH</Text>
            </View>
            <View style={styles.projectStat}>
              <Text style={styles.projectStatLabel}>Expected Return</Text>
              <Text style={styles.projectStatValue}>{item.expectedReturn}%/year</Text>
            </View>
          </View>
          <View style={styles.tokenProgress}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[colors.success, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFill, 
                  { width: `${((item.totalTokens - item.tokensLeft) / item.totalTokens) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.tokenText}>
              {item.tokensLeft}/{item.totalTokens} tokens left
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderFeaturedProjects = () => (
    <View style={styles.featuredSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrapper}>
          <Feather name="home" size={22} color={colors.primary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Featured Properties</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={featuredProjects}
        renderItem={renderFeaturedProject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.projectsList}
      />
    </View>
  );

  const renderUserAssets = () => (
    <View style={styles.assetsSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrapper}>
          <Feather name="briefcase" size={22} color={colors.primary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Your Assets</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Manage</Text>
        </TouchableOpacity>
      </View>
      {userAssets.map((asset) => (
        <TouchableOpacity key={asset.id} style={styles.assetItem}>
          <View style={styles.assetIcon}>
            <Feather name="home" size={20} color={colors.primary} />
          </View>
          <View style={styles.assetLeft}>
            <Text style={styles.assetName}>{asset.name}</Text>
            <Text style={styles.assetTokens}>{asset.tokens} tokens</Text>
          </View>
          <View style={styles.assetRight}>
            <Text style={styles.assetIncome}>{asset.monthlyIncome} ETH/mo</Text>
            <Text style={styles.assetIncomeLabel}>Income</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMarketOverview = () => (
    <View style={styles.marketCard}>
      <LinearGradient
        colors={[colors.primary + '10', colors.secondary + '10']}
        style={styles.marketCardGradient}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrapper}>
            <Feather name="bar-chart-2" size={22} color={colors.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>RWA Market Overview</Text>
          </View>
        </View>
        <View style={styles.marketStats}>
          <View style={styles.marketStatItem}>
            <Text style={styles.marketStatLabel}>Total Market Cap</Text>
            <Text style={styles.marketStatValue}>$10.62B</Text>
            <Text style={styles.marketStatChange}>+5.2% (24h)</Text>
          </View>
          <View style={styles.marketStatDivider} />
          <View style={styles.marketStatItem}>
            <Text style={styles.marketStatLabel}>Active Projects</Text>
            <Text style={styles.marketStatValue}>1,234</Text>
          </View>
          <View style={styles.marketStatDivider} />
          <View style={styles.marketStatItem}>
            <Text style={styles.marketStatLabel}>24h Volume</Text>
            <Text style={styles.marketStatValue}>$125M</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTrendingProjects = () => (
    <View style={styles.trendingSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrapper}>
          <Feather name="trending-up" size={22} color={colors.primary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Trending Projects</Text>
        </View>
      </View>
      {trendingProjects.map((project, index) => (
        <TouchableOpacity key={project.id} style={styles.trendingItem}>
          <View style={styles.trendingLeft}>
            <View style={styles.trendingRankContainer}>
              <Text style={styles.trendingRank}>{index + 1}</Text>
            </View>
            <Text style={styles.trendingName}>{project.name}</Text>
          </View>
          <View style={styles.trendingRight}>
            <Feather name="trending-up" size={16} color={colors.success} />
            <Text style={[styles.trendingChange, styles.positiveValue]}>
              {project.change}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );


  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderKYCStatus()}
        {renderPortfolioOverview()}
        {renderQuickActions()}
        {renderFeaturedProjects()}
        {renderUserAssets()}
        {renderMarketOverview()}
        {renderTrendingProjects()}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray5,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoGradient: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  logoFullText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray1,
    letterSpacing: 1,
  },
  headerGreeting: {
    // Greeting styles
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray1,
  },
  date: {
    fontSize: 14,
    color: colors.gray2,
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    position: 'relative',
    padding: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  kycCard: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  kycPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  patternCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  kycContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kycLeft: {
    flex: 1,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  kycBadgeText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  kycLevel: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kycDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
  },
  viewDetailsText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  portfolioCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray1,
    marginLeft: 0,
  },
  portfolioStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray4,
    marginHorizontal: 10,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray2,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray1,
    marginBottom: 8,
  },
  positiveValue: {
    color: colors.success,
  },
  statBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  manageButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  manageButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  manageButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 20,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 12,
    color: colors.gray1,
    textAlign: 'center',
    fontWeight: '500',
  },
  featuredSection: {
    paddingHorizontal: 0,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 10,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  projectsList: {
    paddingHorizontal: 20,
  },
  projectCard: {
    width: width * 0.85,
    height: 260,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  projectImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  projectGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  projectInfo: {
    // Project info styles
  },
  projectBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  projectBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 0.5,
  },
  projectName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 6,
  },
  projectLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectLocationText: {
    fontSize: 13,
    color: colors.white,
    marginLeft: 4,
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  projectStat: {
    // Project stat styles
  },
  projectStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  projectStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  tokenProgress: {
    // Token progress styles
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tokenText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  assetsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assetLeft: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray1,
  },
  assetTokens: {
    fontSize: 13,
    color: colors.gray2,
    marginTop: 2,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetIncome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  assetIncomeLabel: {
    fontSize: 11,
    color: colors.gray2,
    marginTop: 2,
  },
  marketCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  marketCardGradient: {
    paddingVertical: 24,
    paddingHorizontal: 0,
  },
  marketStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  marketStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  marketStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray4,
    marginHorizontal: 10,
  },
  marketStatLabel: {
    fontSize: 11,
    color: colors.gray2,
    marginBottom: 4,
  },
  marketStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray1,
  },
  marketStatChange: {
    fontSize: 11,
    color: colors.success,
    marginTop: 2,
  },
  trendingSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  trendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  trendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trendingRankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trendingRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.warning,
  },
  trendingName: {
    fontSize: 15,
    color: colors.gray1,
    fontWeight: '500',
  },
  trendingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingChange: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  bottomSpacing: {
    height: 80,
  },
});