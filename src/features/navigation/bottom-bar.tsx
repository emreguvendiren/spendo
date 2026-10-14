import { ComponentProps, Fragment } from 'react';
import { Pressable, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Icon, Text } from 'react-native-paper';
import { usePreferences } from '@/features/preferences/provider';
import { bottomBar, controls, layout, spacing, typography } from '@/theme/tokens';

export type BottomBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export function BottomBar({ state, descriptors, navigation, insets }: BottomBarProps) {
  const { t, colors } = usePreferences();
  const router = useRouter();
  return <View style={{ paddingTop: bottomBar.actionLift, paddingBottom: Math.max(insets.bottom, spacing.sm), paddingLeft: insets.left, paddingRight: insets.right }}>
    <View pointerEvents="none" style={{ position: 'absolute', top: bottomBar.actionLift, bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: controls.borderWidth, borderTopColor: colors.separator }} />
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const selected = state.index === index;
        const color = selected ? colors.accent : colors.muted;
        const label = options.title ?? route.name;
        return <Fragment key={route.key}>
          <Pressable accessibilityRole="button" accessibilityLabel={options.tabBarAccessibilityLabel ?? label} accessibilityState={{ selected }}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            style={({ pressed }) => ({ flex: 1, minHeight: bottomBar.itemMinHeight, minWidth: layout.touchTarget, paddingHorizontal: spacing.xs, paddingVertical: spacing.sm, gap: spacing.xs, alignItems: 'center', justifyContent: 'center', opacity: pressed ? controls.pressedOpacity : 1 })}>
            {options.tabBarIcon?.({ focused: selected, color, size: layout.icon })}
            <Text style={{ fontSize: typography.caption, color, textAlign: 'center' }}>{label}</Text>
          </Pressable>
          {route.name === 'transactions' && <View style={{ flex: 1, alignItems: 'center', marginTop: -bottomBar.actionLift }}>
            <Pressable accessibilityRole="button" accessibilityLabel={t.add}
              onPress={() => router.push('/entry')}
              style={({ pressed }) => ({ width: bottomBar.actionSize, height: bottomBar.actionSize, borderRadius: bottomBar.actionSize / 2, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: pressed ? controls.pressedOpacity : 1 })}>
              <Icon source="plus" color={colors.onAccent} size={bottomBar.actionIcon} />
            </Pressable>
          </View>}
        </Fragment>;
      })}
    </View>
  </View>;
}
