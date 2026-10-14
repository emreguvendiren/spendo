import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { layout, radius, spacing } from '@/theme/tokens';

export function HeaderBrand() {
  return <View style={styles.brand}>
    <Image source={require('../../logo.png')} contentFit="cover" accessibilityLabel="Spendo" style={styles.logo} />
  </View>;
}

const styles = StyleSheet.create({
  brand: { marginLeft: spacing.md },
  logo: { width: layout.headerLogoWidth, height: layout.headerLogoHeight, borderRadius: radius.sm },
});
