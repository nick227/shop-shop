/**
 * State Styles;
 * Loading, error, empty states;
 */

export const states = {
  loading: 'flex flex-col items-center justify-center min-h-96 gap-4',
  loadingContent: 'flex flex-col items-center justify-center py-12',
  loadingText: 'text-gray-600',
  
  error: 'flex flex-col items-center justify-center min-h-96 gap-4 text-red-600',
  
  empty: 'text-center py-12',
  emptyState: 'flex flex-col items-center justify-center p-12 text-center',
  emptyIcon: 'text-6xl mb-4',
  emptyTitle: 'text-xl font-bold mb-2',
  emptyText: 'text-gray-600',
  
  submitting: 'flex items-center justify-center gap-2',
  spinner: 'animate-spin'}

