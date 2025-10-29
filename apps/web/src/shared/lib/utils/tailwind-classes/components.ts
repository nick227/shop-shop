/**
 * Reusable Component Styles;
 * Cards, buttons, badges, modals, images;
 */

export const components = {
  // Cards;
  card: 'bg-white rounded-lg border border-gray-200 p-6',
  cardHeader: 'flex justify-between items-start mb-4',
  cardBody: 'space-y-4',
  cardFooter: 'flex justify-between items-center pt-4 border-t border-gray-200',
  cardActions: 'flex gap-2',
  
  // Buttons & Actions;
  button: 'px-4 py-2 rounded',
  actions: 'flex gap-2',
  actionsGrid: 'grid grid-cols-1 md:grid-cols-2 gap-3',
  actionsBar: 'flex gap-3 items-center mb-6',
  actionButton: 'flex flex-col items-center gap-2 p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all cursor-pointer',
  actionIcon: 'text-4xl',
  actionLabel: 'font-medium text-gray-900',
  
  // Badges;
  badge: 'px-2 py-1 text-xs rounded',
  badges: 'flex gap-2',
  badgePrimary: 'px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium',
  badgeSuccess: 'px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium',
  badgeWarning: 'px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium',
  badgeDanger: 'px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium',
  statusBadge: 'inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium',
  
  // Modals & Overlays;
  modal: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4',
  modalContent: 'bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl',
  modalHeader: 'flex justify-between items-center p-6 border-b border-gray-200',
  modalBody: 'p-6 space-y-6',
  modalFooter: 'flex justify-end gap-2 p-6 border-t border-gray-200',
  overlay: 'fixed inset-0 bg-black bg-opacity-50',
  drawer: 'p-4',
  
  // Images;
  image: 'w-full h-auto',
  'image--hidden': 'opacity-0',
  skeleton: 'absolute inset-0 bg-gray-200 animate-pulse',
  fallback: 'absolute inset-0 flex items-center justify-center text-white font-bold text-sm',
  
  // Stats;
  statsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
  stats: 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-8',
  statCard: 'bg-white p-6 rounded-lg border border-gray-200 text-center',
  statCardPending: 'border-l-4 border-l-yellow-500',
  statValue: 'text-3xl font-bold text-gray-900 mb-1',
  statLabel: 'text-sm text-gray-600 uppercase tracking-wide',
  statIcon: 'text-4xl mb-2',
  
  // Navigation;
  nav: 'flex gap-2 mb-6',
  navLink: 'px-4 py-2 rounded-lg font-medium transition-all',
  navLinkActive: 'bg-blue-600 text-white',
  navItem: 'flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-all',
  navItemActive: 'bg-blue-50 text-blue-600 font-semibold',
  navIcon: 'text-xl',
  navLabel: 'text-sm',
  navBadge: 'ml-auto px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full',
  
  // Tabs;
  tabs: 'flex gap-2 mb-6 border-b border-gray-200',
  tab: 'flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-all border-transparent text-gray-600 hover:text-gray-900',
  tabActive: 'border-blue-600 text-blue-600',
  tabIcon: 'text-lg',
  tabLabel: 'text-sm',
  tabBadge: 'ml-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full',
  
  // Pagination;
  pagination: 'flex justify-center mt-8',
  paginationContainer: 'mt-8'}

