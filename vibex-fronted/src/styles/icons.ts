/**
 * VibeX Icon System
 * 基于 Lucide Icons
 */

export const icons = {
  // 导航
  home: 'Home',
  search: 'Search',
  menu: 'Menu',
  settings: 'Settings',
  user: 'User',
  
  // 操作
  plus: 'Plus',
  edit: 'Edit',
  trash: 'Trash2',
  copy: 'Copy',
  download: 'Download',
  upload: 'Upload',
  save: 'Save',
  share: 'Share',
  
  // 箭头
  arrowUp: 'ArrowUp',
  arrowDown: 'ArrowDown',
  arrowLeft: 'ArrowLeft',
  arrowRight: 'ArrowRight',
  chevronDown: 'ChevronDown',
  chevronUp: 'ChevronUp',
  chevronLeft: 'ChevronLeft',
  chevronRight: 'ChevronRight',
  
  // UI 状态
  check: 'Check',
  x: 'X',
  checkCircle: 'CheckCircle',
  alertCircle: 'AlertCircle',
  info: 'Info',
  helpCircle: 'HelpCircle',
  loader: 'Loader',
  loading: 'Loading',
  
  // 内容
  eye: 'Eye',
  eyeOff: 'EyeOff',
  lock: 'Lock',
  unlock: 'Unlock',
  mail: 'Mail',
  phone: 'Phone',
  calendar: 'Calendar',
  clock: 'Clock',
  mapPin: 'MapPin',
  link: 'Link',
  
  // 文件
  file: 'File',
  fileText: 'FileText',
  folder: 'Folder',
  image: 'Image',
  code: 'Code',
  command: 'Command',
  
  // 社交
  github: 'Github',
  twitter: 'Twitter',
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'Linkedin',
  
  // 其他
  moreVertical: 'MoreVertical',
  moreHorizontal: 'MoreHorizontal',
  send: 'Send',
  zap: 'Zap',
  bot: 'Bot',
  workflow: 'Workflow',
  messageSquare: 'MessageSquare',
  chat: 'Chat',
} as const;

export type IconName = keyof typeof icons;
