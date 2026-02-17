import FloorPlanWizard from './components/wizard/FloorPlanWizard';
import ToastContainer, { useToast } from './components/ui/Toast';

/**
 * App — Root component.
 *
 * In the future, this will include routing for the parent app integration.
 * For now, it renders the FloorPlanWizard directly.
 */
export default function App() {
  const { toasts } = useToast();

  return (
    <>
      <FloorPlanWizard />
      <ToastContainer toasts={toasts} />
    </>
  );
}
