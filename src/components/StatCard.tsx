import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Fonts } from '@/constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  dark?: boolean;
  iconColor?: string;
}

export default function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  dark,
  iconColor = Colors.primary,
}: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <View
      style={[
        styles.card,
        dark ? styles.cardDark : styles.cardLight,
      ]}
    >
      <View style={styles.topRow}>
        <Text
          style={[
            styles.label,
            dark ? styles.labelDark : styles.labelLight,
          ]}
        >
          {label}
        </Text>
        {icon && (
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: dark
                  ? 'rgba(255, 255, 255, 0.15)'
                  : `${iconColor}15`,
              },
            ]}
          >
            {icon}
          </View>
        )}
      </View>

      <View style={styles.valueRow}>
        <Text
          style={[
            styles.value,
            dark ? styles.valueDark : styles.valueLight,
          ]}
        >
          {value}
        </Text>
        {sub && (
          <Text
            style={[
              styles.sub,
              dark ? styles.subDark : styles.subLight,
            ]}
          >
            {sub}
          </Text>
        )}
      </View>

      {trend && (
        <View style={styles.trendRow}>
          <Text style={[styles.trendValue, isPositive ? styles.trendPos : styles.trendNeg]}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Text>
          <Text
            style={[
              styles.trendLabel,
              dark ? styles.trendLabelDark : styles.trendLabelLight,
            ]}
          >
            {trend.label}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 112,
  },
  cardDark: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cardLight: {
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  label: {
    fontFamily: Fonts?.mono || 'monospace',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    flex: 1,
  },
  labelDark: {
    color: 'rgba(255, 255, 255, 0.65)',
  },
  labelLight: {
    color: Colors.textSecondary,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    marginTop: Spacing.xs,
  },
  value: {
    fontFamily: Fonts?.display || 'System',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  valueDark: {
    color: Colors.textWhite,
  },
  valueLight: {
    color: Colors.text,
  },
  sub: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: Fonts?.sans || 'System',
  },
  subDark: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  subLight: {
    color: Colors.textSecondary,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  trendValue: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts?.mono || 'monospace',
  },
  trendPos: {
    color: '#34D399',
  },
  trendNeg: {
    color: '#F87171',
  },
  trendLabel: {
    fontSize: 10,
    fontFamily: Fonts?.mono || 'monospace',
  },
  trendLabelDark: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  trendLabelLight: {
    color: Colors.textSecondary,
  },
});
