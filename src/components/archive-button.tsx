import { Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { usePreferences } from '@/features/preferences/provider';

export function ArchiveButton({ archived, busy, onChange }: { archived: boolean; busy: boolean; onChange: () => void }) {
  const { t } = usePreferences();
  const label = archived ? t.restoreArchive : t.archive;
  return <Button accessibilityLabel={label} icon={archived ? 'archive-arrow-up-outline' : 'archive-outline'} disabled={busy} onPress={() => {
    if (archived) { onChange(); return; }
    Alert.alert(t.archiveTitle, t.archiveBody, [{ text: t.cancel, style: 'cancel' }, { text: t.archive, onPress: onChange }]);
  }}>{label}</Button>;
}
