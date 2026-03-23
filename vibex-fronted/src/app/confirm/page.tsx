/**
 * /confirm Route - Confirmation flow standalone entry page
 *
 * This route provides the initial requirement input for the confirmation flow.
 * Compatible with `output: 'export'` (static HTML export).
 *
 * Note: The homepage middleware previously redirected /confirm to /.
 * This page now serves as the standalone confirmation entry point.
 */
import ConfirmPage from '@/components/confirm/ConfirmPage';

export default function ConfirmRoute() {
  return <ConfirmPage />;
}
