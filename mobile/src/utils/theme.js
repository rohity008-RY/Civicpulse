export const colors = {
  bg:       '#0A0E1A',
  surface:  '#111827',
  surface2: '#1A2235',
  surface3: '#1F2D44',
  border:   'rgba(255,255,255,0.08)',
  border2:  'rgba(255,255,255,0.14)',
  text:     '#F0F4FF',
  text2:    '#8B9EC3',
  text3:    '#4A5B7A',
  accent:   '#3B82F6',
  accent2:  '#60A5FA',
  fire:     '#F97316',
  fire2:    '#FB923C',
  green:    '#10B981',
  green2:   '#34D399',
  red:      '#EF4444',
  red2:     '#F87171',
  purple:   '#8B5CF6',
  purple2:  '#A78BFA',
  yellow:   '#F59E0B',
  yellow2:  '#FCD34D',
};

export const CAT_CONFIG = {
  POTHOLE:     { emoji: '🕳️', bg: 'rgba(249,115,22,0.15)',  color: '#FB923C' },
  GARBAGE:     { emoji: '🗑️', bg: 'rgba(16,185,129,0.15)',  color: '#34D399' },
  WATER:       { emoji: '💧', bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' },
  STREETLIGHT: { emoji: '💡', bg: 'rgba(245,158,11,0.15)',  color: '#FCD34D' },
  SAFETY:      { emoji: '⚠️', bg: 'rgba(239,68,68,0.15)',   color: '#F87171' },
  TREE:        { emoji: '🌳', bg: 'rgba(139,92,246,0.15)',  color: '#A78BFA' },
  OTHER:       { emoji: '📋', bg: 'rgba(148,163,184,0.15)', color: '#94A3B8' },
};

export const STATUS_CONFIG = {
  OPEN:              { label: 'Open',          color: '#60A5FA', bg: 'rgba(59,130,246,0.12)' },
  ASSIGNED:          { label: 'Assigned',      color: '#FCD34D', bg: 'rgba(245,158,11,0.12)' },
  IN_PROGRESS:       { label: 'In Progress',   color: '#34D399', bg: 'rgba(16,185,129,0.12)' },
  ESCALATED_TO_MLA:  { label: 'Escalated→MLA', color: '#FB923C', bg: 'rgba(249,115,22,0.12)' },
  ESCALATED_TO_MP:   { label: 'Escalated→MP',  color: '#F87171', bg: 'rgba(239,68,68,0.12)' },
  RESOLVED:          { label: 'Resolved',      color: '#34D399', bg: 'rgba(16,185,129,0.12)' },
};
