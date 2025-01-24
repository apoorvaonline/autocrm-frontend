import { HomeIcon, TicketIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Tickets', href: '/tickets', icon: TicketIcon },
  { name: 'Teams', href: '/teams', icon: UsersIcon, roles: ['admin', 'employee'] },
  { name: 'SLA Dashboard', href: '/sla-dashboard', icon: ChartBarIcon, roles: ['admin', 'employee'] }
]; 