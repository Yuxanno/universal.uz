/**
 * Modern UI Components Export
 * 
 * Централизованный экспорт всех современных компонентов
 * для удобного импорта в приложении
 */

// Buttons
export { default as Button } from './Button.modern';

// Cards
export { Card, CardHeader, CardBody, CardFooter } from './Card.modern';

// Inputs
export { default as Input } from './Input.modern';

// Modals
export { default as Modal } from './Modal.modern';

// Badges
export { default as Badge } from './Badge.modern';

// Loading States
export { default as Skeleton, SkeletonGroup, CardSkeleton } from './Skeleton.modern';

// Notifications
export { default as Toast, ToastContainer } from './Toast.modern';
export type { ToastType } from './Toast.modern';

// Empty States
export { default as EmptyState } from './EmptyState.modern';

/**
 * Usage Example:
 * 
 * import { Button, Card, Input, Modal } from '@/components/ui/index.modern';
 * 
 * function MyComponent() {
 *   return (
 *     <Card>
 *       <Input label="Name" />
 *       <Button variant="primary">Submit</Button>
 *     </Card>
 *   );
 * }
 */
