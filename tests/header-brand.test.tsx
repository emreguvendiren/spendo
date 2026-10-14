import { render, screen } from '@testing-library/react-native';
import appConfig from '../app.json';
import { HeaderBrand } from '@/components/header-brand';

it('shows only the accessible brand image without a text title or version', async () => {
  await render(<HeaderBrand />);
  expect(screen.getByLabelText('Spendo')).toBeTruthy();
  expect(screen.queryByText('Spendo')).toBeNull();
  expect(screen.queryByText(`v${appConfig.expo.version}`)).toBeNull();
});
