import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Fonts } from '@/constants/theme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variantStyles = {
  default: {
    bg: Colors.primarySurface,
    text: Colors.primary,
    border: Colors.cardBorder,
    dot: Colors.primaryLight,
  },
  success: {
    bg: Colors.successBg,
    text: Colors.success,
    border: Colors.successBorder,
    dot: Colors.success,
  },
  warning: {
    bg: Colors.warningBg,
    text: Colors.warning,
    border: Colors.warningBorder,
    dot: Colors.warning,
  },
  danger: {
    bg: Colors.dangerBg,
    text: Colors.danger,
    border: Colors.dangerBorder,
    dot: Colors.danger,
  },
  info: {
    bg: Colors.infoBg,
    text: Colors.info,
    border: Colors.infoBorder,
    dot: Colors.info,
  },
  muted: {
    bg: '#ECF2EE',
    text: Colors.textSecondary,
    border: Colors.cardBorder,
    dot: Colors.textSecondary,
  },
};

export default function Badge({ children, variant = 'default', size = 'sm', dot }: BadgeProps) {
  const v = variantStyles[variant] || variantStyles.default;
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          paddingHorizontal: isSm ? 8 : 10,
          paddingVertical: isSm ? 2.5 : 4,
        },
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: v.dot }]} />}
      <Text
        style={[
          styles.text,
          {
            color: v.text,
            fontSize: isSm ? 10 : 12,
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: Fonts?.mono || 'monospace',
    fontWeight: '600',
  },
});
