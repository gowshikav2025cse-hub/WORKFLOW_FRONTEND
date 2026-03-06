// nodeDefinitions.ts — Single source of truth for all 80+ workflow node types
// Groups: core, communication, crm, productivity, cloud, database, ecommerce, social, devtools, ai

export type NodeCategory = 'trigger' | 'action' | 'condition' | 'output';

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'textarea' | 'toggle' | 'password' | 'keyvalue' | 'multiselect' | 'code';
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: string | number | boolean;
  required?: boolean;
  dependsOn?: { key: string; value: string }; // show this field only when another field has a specific value
  hint?: string; // helper text below the field
}

export interface NodeDefinition {
  type: string;
  label: string;
  description: string;
  icon: string;
  category: NodeCategory;
  group: string;
  tags: string[];
  configFields: ConfigField[];
}

// ─── Group Meta ───────────────────────────────────────────────────────────────
export const groupMeta: Record<string, { label: string; icon: string; color: string; description: string }> = {
  core:          { label: 'Core',          icon: 'Zap',          color: '#6366f1', description: 'Foundational logic blocks' },
  communication: { label: 'Communication', icon: 'MessageSquare', color: '#0ea5e9', description: 'Email, SMS, and messaging' },
  crm:           { label: 'CRM & Marketing', icon: 'Users',       color: '#f97316', description: 'Customer relationship tools' },
  productivity:  { label: 'Productivity',  icon: 'Layout',        color: '#8b5cf6', description: 'Task & document management' },
  cloud:         { label: 'Cloud Storage', icon: 'Cloud',         color: '#06b6d4', description: 'Files and object storage' },
  database:      { label: 'Databases',     icon: 'Database',      color: '#10b981', description: 'SQL, NoSQL, and realtime DBs' },
  ecommerce:     { label: 'E-Commerce',    icon: 'ShoppingCart',  color: '#f43f5e', description: 'Payments and storefronts' },
  social:        { label: 'Social Media',  icon: 'Share2',        color: '#ec4899', description: 'Posting and analytics' },
  devtools:      { label: 'Dev & Ops',     icon: 'Code2',         color: '#64748b', description: 'GitHub, webhooks, CI/CD' },
  ai:            { label: 'AI & Agents',   icon: 'Brain',         color: '#a855f7', description: 'LLMs, transformers, agents' },
};

// ─── Group Colors (Tailwind) ──────────────────────────────────────────────────
export const groupColors: Record<string, { bg: string; border: string; text: string; light: string }> = {
  core:          { bg: 'bg-emerald-500',  border: 'border-emerald-300',    text: 'text-emerald-700',  light: 'bg-emerald-50' },
  communication: { bg: 'bg-sky-500',      border: 'border-sky-300',        text: 'text-sky-700',      light: 'bg-sky-50' },
  crm:           { bg: 'bg-orange-500',   border: 'border-orange-300',     text: 'text-orange-700',   light: 'bg-orange-50' },
  productivity:  { bg: 'bg-violet-500',   border: 'border-violet-300',     text: 'text-violet-700',   light: 'bg-violet-50' },
  cloud:         { bg: 'bg-cyan-500',     border: 'border-cyan-300',       text: 'text-cyan-700',     light: 'bg-cyan-50' },
  database:      { bg: 'bg-emerald-500',  border: 'border-emerald-300',    text: 'text-emerald-700',  light: 'bg-emerald-50' },
  ecommerce:     { bg: 'bg-rose-500',     border: 'border-rose-300',       text: 'text-rose-700',     light: 'bg-rose-50' },
  social:        { bg: 'bg-pink-500',     border: 'border-pink-300',       text: 'text-pink-700',     light: 'bg-pink-50' },
  devtools:      { bg: 'bg-slate-500',    border: 'border-slate-300',      text: 'text-slate-700',    light: 'bg-slate-50' },
  ai:            { bg: 'bg-purple-500',   border: 'border-purple-300',     text: 'text-purple-700',   light: 'bg-purple-50' },
};

// ─── Category Colors ──────────────────────────────────────────────────────────
export const categoryColors: Record<NodeCategory, { text: string; bg: string; label: string }> = {
  trigger:   { text: 'text-amber-700',   bg: 'bg-amber-50',   label: 'TRG' },
  action:    { text: 'text-sky-700',     bg: 'bg-sky-50',     label: 'ACT' },
  condition: { text: 'text-violet-700',  bg: 'bg-violet-50',  label: 'CND' },
  output:    { text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'OUT' },
};

// ─── Node Catalog ────────────────────────────────────────────────────────────
export const nodeCatalog: NodeDefinition[] = [

  // ══════════════════════════════ CORE ══════════════════════════════
  {
    type: 'schedule_trigger',
    label: 'Schedule / Cron',
    description: 'Run workflow on a time-based schedule',
    icon: 'Clock',
    category: 'trigger',
    group: 'core',
    tags: ['schedule', 'cron', 'timer', 'recurring', 'interval', 'daily', 'hourly'],
    configFields: [
      { key: 'interval', label: 'Run every', type: 'select', options: [
        { label: 'Every minute', value: '* * * * *' },
        { label: 'Every 5 minutes', value: '*/5 * * * *' },
        { label: 'Every hour', value: '0 * * * *' },
        { label: 'Every day at 9am', value: '0 9 * * *' },
        { label: 'Every Monday', value: '0 9 * * 1' },
        { label: 'Custom (cron)', value: 'custom' },
      ], defaultValue: '0 * * * *' },
      { key: 'customCron', label: 'Custom cron expression', type: 'text', placeholder: '0 9 * * *' },
      { key: 'timezone', label: 'Timezone', type: 'text', placeholder: 'America/New_York', defaultValue: 'UTC' },
    ],
  },
  {
    type: 'webhook_trigger',
    label: 'Webhook',
    description: 'Start workflow when an HTTP request is received',
    icon: 'Webhook',
    category: 'trigger',
    group: 'core',
    tags: ['webhook', 'http', 'api', 'incoming', 'post', 'get', 'rest'],
    configFields: [
      { key: 'httpMethod', label: 'HTTP Method', type: 'multiselect', options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'HEAD', value: 'HEAD' },
      ], defaultValue: 'POST', required: true },
      { key: 'path', label: 'Path', type: 'text', placeholder: 'my-webhook', required: true, hint: 'The webhook will be available at /webhook/{path}' },
      { key: 'authentication', label: 'Authentication', type: 'select', options: [
        { label: 'None', value: 'none' },
        { label: 'Basic Auth', value: 'basic' },
        { label: 'Header Auth', value: 'header' },
      ], defaultValue: 'none' },
      { key: 'authHeaderName', label: 'Header Name', type: 'text', placeholder: 'X-API-Key', dependsOn: { key: 'authentication', value: 'header' } },
      { key: 'authHeaderValue', label: 'Header Value', type: 'password', placeholder: 'your-secret-key', dependsOn: { key: 'authentication', value: 'header' } },
      { key: 'basicUser', label: 'Username', type: 'text', dependsOn: { key: 'authentication', value: 'basic' } },
      { key: 'basicPassword', label: 'Password', type: 'password', dependsOn: { key: 'authentication', value: 'basic' } },
      { key: 'respond', label: 'Respond', type: 'select', options: [
        { label: 'Immediately', value: 'immediately' },
        { label: 'When Last Node Finishes', value: 'lastNode' },
        { label: 'Using Respond to Webhook Node', value: 'responseNode' },
      ], defaultValue: 'immediately' },
      { key: 'responseCode', label: 'Response Code', type: 'number', defaultValue: 200 },
      { key: 'responseData', label: 'Response Data', type: 'select', options: [
        { label: 'All Entries', value: 'allEntries' },
        { label: 'First Entry JSON', value: 'firstEntryJson' },
        { label: 'No Response Body', value: 'noData' },
      ], defaultValue: 'firstEntryJson' },
    ],
  },
  {
    type: 'manual_trigger',
    label: 'Manual Trigger',
    description: 'Trigger this workflow manually on demand',
    icon: 'Play',
    category: 'trigger',
    group: 'core',
    tags: ['manual', 'run', 'start', 'on demand', 'test'],
    configFields: [
      { key: 'label', label: 'Button Label', type: 'text', placeholder: 'Run Now', defaultValue: 'Run Now' },
    ],
  },
  {
    type: 'http_request',
    label: 'HTTP Request',
    description: 'Make any HTTP/REST API call',
    icon: 'Globe',
    category: 'action',
    group: 'core',
    tags: ['http', 'rest', 'api', 'fetch', 'request', 'url', 'json', 'curl'],
    configFields: [
      { key: 'method', label: 'Method', type: 'select', options: [
        { label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' }, { label: 'PATCH', value: 'PATCH' }, { label: 'DELETE', value: 'DELETE' },
        { label: 'HEAD', value: 'HEAD' },
      ], defaultValue: 'GET', required: true },
      { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/endpoint', required: true },
      { key: 'authentication', label: 'Authentication', type: 'select', options: [
        { label: 'None', value: 'none' },
        { label: 'Bearer Token', value: 'bearer' },
        { label: 'Basic Auth', value: 'basic' },
        { label: 'Header Auth', value: 'header' },
      ], defaultValue: 'none' },
      { key: 'bearerToken', label: 'Bearer Token', type: 'password', placeholder: 'your-api-token', dependsOn: { key: 'authentication', value: 'bearer' } },
      { key: 'basicUser', label: 'Username', type: 'text', dependsOn: { key: 'authentication', value: 'basic' } },
      { key: 'basicPassword', label: 'Password', type: 'password', dependsOn: { key: 'authentication', value: 'basic' } },
      { key: 'headerAuthName', label: 'Header Name', type: 'text', placeholder: 'X-API-Key', dependsOn: { key: 'authentication', value: 'header' } },
      { key: 'headerAuthValue', label: 'Header Value', type: 'password', dependsOn: { key: 'authentication', value: 'header' } },
      { key: 'sendQueryParams', label: 'Send Query Parameters', type: 'toggle', defaultValue: false },
      { key: 'queryParams', label: 'Query Parameters (JSON)', type: 'textarea', placeholder: '{"key": "value"}', dependsOn: { key: 'sendQueryParams', value: 'true' }, hint: 'Key-value pairs added as URL query parameters' },
      { key: 'sendHeaders', label: 'Send Headers', type: 'toggle', defaultValue: false },
      { key: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Content-Type": "application/json"}', dependsOn: { key: 'sendHeaders', value: 'true' } },
      { key: 'sendBody', label: 'Send Body', type: 'toggle', defaultValue: false },
      { key: 'contentType', label: 'Content Type', type: 'select', options: [
        { label: 'JSON', value: 'json' }, { label: 'Form URL-Encoded', value: 'form' },
        { label: 'Multipart Form Data', value: 'multipart' }, { label: 'Raw', value: 'raw' },
      ], defaultValue: 'json', dependsOn: { key: 'sendBody', value: 'true' } },
      { key: 'body', label: 'Body', type: 'textarea', placeholder: '{"key": "value"}', dependsOn: { key: 'sendBody', value: 'true' } },
      { key: 'timeout', label: 'Timeout (ms)', type: 'number', defaultValue: 10000 },
      { key: 'followRedirects', label: 'Follow Redirects', type: 'toggle', defaultValue: true },
      { key: 'responseFormat', label: 'Response Format', type: 'select', options: [
        { label: 'Auto-detect', value: 'auto' }, { label: 'JSON', value: 'json' }, { label: 'Text', value: 'text' },
      ], defaultValue: 'auto' },
    ],
  },
  {
    type: 'if_condition',
    label: 'IF Condition',
    description: 'Branch based on a true/false check',
    icon: 'GitBranch',
    category: 'condition',
    group: 'core',
    tags: ['if', 'condition', 'branch', 'logic', 'filter', 'check', 'boolean'],
    configFields: [
      { key: 'field', label: 'Field / Expression', type: 'text', placeholder: '{{data.status}}', required: true },
      { key: 'operator', label: 'Operator', type: 'select', options: [
        { label: 'equals', value: 'eq' }, { label: 'not equals', value: 'neq' },
        { label: 'greater than', value: 'gt' }, { label: 'less than', value: 'lt' },
        { label: 'contains', value: 'contains' }, { label: 'is empty', value: 'empty' },
      ], defaultValue: 'eq' },
      { key: 'value', label: 'Compare Value', type: 'text', placeholder: 'active' },
    ],
  },
  {
    type: 'filter',
    label: 'Filter',
    description: 'Pass or block items based on conditions',
    icon: 'Filter',
    category: 'condition',
    group: 'core',
    tags: ['filter', 'guard', 'stop', 'pass', 'allow', 'block'],
    configFields: [
      { key: 'field', label: 'Field', type: 'text', placeholder: '{{data.type}}', required: true },
      { key: 'operator', label: 'Operator', type: 'select', options: [
        { label: 'equals', value: 'eq' }, { label: 'not equals', value: 'neq' },
        { label: 'contains', value: 'contains' }, { label: 'is not empty', value: 'notEmpty' },
      ], defaultValue: 'eq' },
      { key: 'value', label: 'Value', type: 'text', placeholder: 'order' },
    ],
  },
  {
    type: 'transform_data',
    label: 'Transform Data',
    description: 'Reshape, rename, or map data fields',
    icon: 'Shuffle',
    category: 'action',
    group: 'core',
    tags: ['transform', 'map', 'reshape', 'data', 'format', 'convert', 'parse'],
    configFields: [
      { key: 'expression', label: 'Mapping (JSON)', type: 'textarea', placeholder: '{"name": "{{data.firstName}} {{data.lastName}}"}', required: true },
    ],
  },
  {
    type: 'merge',
    label: 'Merge / Join',
    description: 'Combine data from multiple branches',
    icon: 'Merge',
    category: 'action',
    group: 'core',
    tags: ['merge', 'join', 'combine', 'aggregate', 'collect'],
    configFields: [
      { key: 'mode', label: 'Merge Mode', type: 'select', options: [
        { label: 'Wait for all', value: 'all' }, { label: 'First to arrive', value: 'first' },
      ], defaultValue: 'all' },
    ],
  },
  {
    type: 'delay',
    label: 'Delay / Wait',
    description: 'Pause execution for a specified duration',
    icon: 'Timer',
    category: 'action',
    group: 'core',
    tags: ['delay', 'wait', 'pause', 'sleep', 'throttle'],
    configFields: [
      { key: 'duration', label: 'Duration', type: 'number', defaultValue: 60, required: true },
      { key: 'unit', label: 'Unit', type: 'select', options: [
        { label: 'Seconds', value: 'sec' }, { label: 'Minutes', value: 'min' },
        { label: 'Hours', value: 'hr' }, { label: 'Days', value: 'day' },
      ], defaultValue: 'min' },
    ],
  },
  {
    type: 'log_output',
    label: 'Log / Debug',
    description: 'Write values to execution logs for debugging',
    icon: 'Terminal',
    category: 'output',
    group: 'core',
    tags: ['log', 'debug', 'print', 'console', 'output', 'inspect'],
    configFields: [
      { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Value: {{data.value}}', required: true },
      { key: 'level', label: 'Level', type: 'select', options: [
        { label: 'Info', value: 'info' }, { label: 'Warn', value: 'warn' }, { label: 'Error', value: 'error' },
      ], defaultValue: 'info' },
    ],
  },

  // ══════════════════════════════ COMMUNICATION ══════════════════════════════
  {
    type: 'gmail_trigger',
    label: 'Gmail — New Email',
    description: 'Trigger when a new email arrives in Gmail',
    icon: 'Mail',
    category: 'trigger',
    group: 'communication',
    tags: ['gmail', 'email', 'google', 'inbox', 'receive', 'new mail'],
    configFields: [
      { key: 'labelFilter', label: 'Label Filter', type: 'text', placeholder: 'INBOX' },
      { key: 'fromFilter', label: 'Only from sender', type: 'text', placeholder: 'boss@company.com' },
      { key: 'subjectFilter', label: 'Subject contains', type: 'text', placeholder: 'Invoice' },
    ],
  },
  {
    type: 'gmail_send',
    label: 'Gmail — Send Email',
    description: 'Send an email via Gmail',
    icon: 'Send',
    category: 'action',
    group: 'communication',
    tags: ['gmail', 'send email', 'google mail', 'email', 'compose'],
    configFields: [
      { key: 'to', label: 'To', type: 'text', placeholder: 'recipient@example.com', required: true },
      { key: 'cc', label: 'CC', type: 'text', placeholder: 'cc@example.com' },
      { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Hello!', required: true },
      { key: 'body', label: 'Body (HTML)', type: 'textarea', placeholder: '<p>Hello {{name}},</p>', required: true },
      { key: 'attachments', label: 'Attachment URL', type: 'text', placeholder: 'https://...' },
    ],
  },
  {
    type: 'outlook_send',
    label: 'Outlook — Send Email',
    description: 'Send email via Microsoft Outlook',
    icon: 'Mail',
    category: 'action',
    group: 'communication',
    tags: ['outlook', 'microsoft', 'send email', 'office 365', 'email'],
    configFields: [
      { key: 'to', label: 'To', type: 'text', placeholder: 'recipient@example.com', required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'body', label: 'Body', type: 'textarea', required: true },
    ],
  },
  {
    type: 'slack_message',
    label: 'Slack — Send Message',
    description: 'Post a message to a Slack channel or user',
    icon: 'MessageSquare',
    category: 'action',
    group: 'communication',
    tags: ['slack', 'message', 'chat', 'notify', 'channel', 'team', 'workspace'],
    configFields: [
      { key: 'channel', label: 'Channel or @user', type: 'text', placeholder: '#general', required: true },
      { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Hello from FlowCraft!', required: true },
      { key: 'username', label: 'Bot display name', type: 'text', placeholder: 'FlowCraft Bot' },
      { key: 'emoji', label: 'Icon emoji', type: 'text', placeholder: ':robot_face:' },
    ],
  },
  {
    type: 'slack_trigger',
    label: 'Slack — New Message',
    description: 'Trigger when a message is posted in a channel',
    icon: 'MessageSquare',
    category: 'trigger',
    group: 'communication',
    tags: ['slack', 'message', 'incoming', 'channel', 'listen'],
    configFields: [
      { key: 'channel', label: 'Channel', type: 'text', placeholder: '#support', required: true },
      { key: 'botMentionOnly', label: 'Only when bot is mentioned', type: 'toggle', defaultValue: false },
    ],
  },
  {
    type: 'discord_message',
    label: 'Discord — Send Message',
    description: 'Send a message to a Discord channel via webhook',
    icon: 'MessageCircle',
    category: 'action',
    group: 'communication',
    tags: ['discord', 'message', 'channel', 'gaming', 'community'],
    configFields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://discord.com/api/webhooks/...', required: true },
      { key: 'content', label: 'Message', type: 'textarea', placeholder: 'Hello from FlowCraft!', required: true },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'FlowBot' },
      { key: 'embedTitle', label: 'Embed Title (optional)', type: 'text' },
    ],
  },
  {
    type: 'telegram_send',
    label: 'Telegram — Send Message',
    description: 'Send a Telegram message via bot',
    icon: 'Send',
    category: 'action',
    group: 'communication',
    tags: ['telegram', 'bot', 'message', 'chat', 'notification'],
    configFields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: '123456:ABC-DEF...', required: true },
      { key: 'chatId', label: 'Chat ID', type: 'text', placeholder: '-1001234567890', required: true },
      { key: 'text', label: 'Message', type: 'textarea', placeholder: 'Hello!', required: true },
      { key: 'parseMode', label: 'Parse Mode', type: 'select', options: [
        { label: 'None', value: '' }, { label: 'Markdown', value: 'Markdown' }, { label: 'HTML', value: 'HTML' },
      ], defaultValue: '' },
    ],
  },
  {
    type: 'teams_message',
    label: 'Microsoft Teams — Send',
    description: 'Post a message to a Teams channel',
    icon: 'Video',
    category: 'action',
    group: 'communication',
    tags: ['teams', 'microsoft', 'office', 'channel', 'message', 'notify'],
    configFields: [
      { key: 'webhookUrl', label: 'Incoming Webhook URL', type: 'text', required: true },
      { key: 'title', label: 'Card Title', type: 'text', placeholder: 'Notification' },
      { key: 'text', label: 'Message', type: 'textarea', required: true },
    ],
  },
  {
    type: 'twilio_sms',
    label: 'Twilio — Send SMS',
    description: 'Send an SMS message via Twilio',
    icon: 'Smartphone',
    category: 'action',
    group: 'communication',
    tags: ['twilio', 'sms', 'text', 'phone', 'message', 'mobile'],
    configFields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', placeholder: 'ACxxxx', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { key: 'from', label: 'From Number', type: 'text', placeholder: '+1234567890', required: true },
      { key: 'to', label: 'To Number', type: 'text', placeholder: '+1987654321', required: true },
      { key: 'body', label: 'Message', type: 'textarea', placeholder: 'Hello!', required: true },
    ],
  },
  {
    type: 'sendgrid_email',
    label: 'SendGrid — Send Email',
    description: 'Send transactional email via SendGrid',
    icon: 'Mail',
    category: 'action',
    group: 'communication',
    tags: ['sendgrid', 'email', 'transactional', 'marketing', 'newsletter'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'from', label: 'From Email', type: 'text', placeholder: 'noreply@company.com', required: true },
      { key: 'to', label: 'To Email', type: 'text', required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'html', label: 'HTML Content', type: 'textarea', required: true },
      { key: 'templateId', label: 'Template ID (optional)', type: 'text' },
    ],
  },
  {
    type: 'whatsapp_send',
    label: 'WhatsApp — Send Message',
    description: 'Send WhatsApp message via Meta Business API',
    icon: 'MessageSquare',
    category: 'action',
    group: 'communication',
    tags: ['whatsapp', 'message', 'meta', 'phone', 'mobile', 'chat'],
    configFields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'to', label: 'Recipient Phone', type: 'text', placeholder: '+1234567890', required: true },
      { key: 'message', label: 'Message Text', type: 'textarea', required: true },
    ],
  },

  // ══════════════════════════════ CRM & MARKETING ══════════════════════════════
  {
    type: 'hubspot_contact',
    label: 'HubSpot — Create/Update Contact',
    description: 'Add or update a contact in HubSpot CRM',
    icon: 'UserPlus',
    category: 'action',
    group: 'crm',
    tags: ['hubspot', 'crm', 'contact', 'lead', 'sales', 'marketing'],
    configFields: [
      { key: 'apiKey', label: 'Private App Token', type: 'password', required: true },
      { key: 'email', label: 'Email', type: 'text', placeholder: '{{data.email}}', required: true },
      { key: 'firstName', label: 'First Name', type: 'text', placeholder: '{{data.firstName}}' },
      { key: 'lastName', label: 'Last Name', type: 'text', placeholder: '{{data.lastName}}' },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'lifecycleStage', label: 'Lifecycle Stage', type: 'select', options: [
        { label: 'Subscriber', value: 'subscriber' }, { label: 'Lead', value: 'lead' },
        { label: 'MQL', value: 'marketingqualifiedlead' }, { label: 'Customer', value: 'customer' },
      ], defaultValue: 'lead' },
    ],
  },
  {
    type: 'hubspot_deal',
    label: 'HubSpot — Create Deal',
    description: 'Create a new deal in HubSpot pipeline',
    icon: 'TrendingUp',
    category: 'action',
    group: 'crm',
    tags: ['hubspot', 'deal', 'crm', 'pipeline', 'sales', 'revenue'],
    configFields: [
      { key: 'apiKey', label: 'Private App Token', type: 'password', required: true },
      { key: 'dealName', label: 'Deal Name', type: 'text', required: true },
      { key: 'amount', label: 'Amount', type: 'number' },
      { key: 'stage', label: 'Deal Stage', type: 'text', placeholder: 'appointmentscheduled' },
    ],
  },
  {
    type: 'salesforce_lead',
    label: 'Salesforce — Create Lead',
    description: 'Create a lead in Salesforce CRM',
    icon: 'UserPlus',
    category: 'action',
    group: 'crm',
    tags: ['salesforce', 'crm', 'lead', 'contact', 'sales', 'opportunity'],
    configFields: [
      { key: 'instanceUrl', label: 'Instance URL', type: 'text', placeholder: 'https://yourorgname.salesforce.com', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'firstName', label: 'First Name', type: 'text', required: true },
      { key: 'lastName', label: 'Last Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
      { key: 'company', label: 'Company', type: 'text', required: true },
    ],
  },
  {
    type: 'mailchimp_subscribe',
    label: 'Mailchimp — Add Subscriber',
    description: 'Add or update a subscriber in a Mailchimp audience',
    icon: 'MailCheck',
    category: 'action',
    group: 'crm',
    tags: ['mailchimp', 'email', 'newsletter', 'subscriber', 'list', 'audience', 'marketing'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'server', label: 'Server Prefix', type: 'text', placeholder: 'us1', required: true },
      { key: 'listId', label: 'Audience ID', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', placeholder: '{{data.email}}', required: true },
      { key: 'firstName', label: 'First Name', type: 'text' },
      { key: 'lastName', label: 'Last Name', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: [
        { label: 'Subscribed', value: 'subscribed' }, { label: 'Pending', value: 'pending' },
      ], defaultValue: 'subscribed' },
    ],
  },
  {
    type: 'activecampaign_contact',
    label: 'ActiveCampaign — Add Contact',
    description: 'Add contact and subscribe to email list',
    icon: 'Users',
    category: 'action',
    group: 'crm',
    tags: ['activecampaign', 'crm', 'email', 'contact', 'automation'],
    configFields: [
      { key: 'apiUrl', label: 'API URL', type: 'text', placeholder: 'https://yourorg.api-us1.com', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
      { key: 'firstName', label: 'First Name', type: 'text' },
      { key: 'listId', label: 'List ID', type: 'number' },
    ],
  },
  {
    type: 'pipedrive_deal',
    label: 'Pipedrive — Create Deal',
    description: 'Add a deal to Pipedrive CRM',
    icon: 'TrendingUp',
    category: 'action',
    group: 'crm',
    tags: ['pipedrive', 'crm', 'deal', 'sales', 'pipeline'],
    configFields: [
      { key: 'apiToken', label: 'API Token', type: 'password', required: true },
      { key: 'title', label: 'Deal Title', type: 'text', required: true },
      { key: 'value', label: 'Value', type: 'number' },
      { key: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD' },
    ],
  },
  {
    type: 'intercom_message',
    label: 'Intercom — Send Message',
    description: 'Send an in-app or email message via Intercom',
    icon: 'MessageCircle',
    category: 'action',
    group: 'crm',
    tags: ['intercom', 'support', 'chat', 'message', 'customer success'],
    configFields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'userId', label: 'User ID or Email', type: 'text', required: true },
      { key: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  },

  // ══════════════════════════════ PRODUCTIVITY ══════════════════════════════
  {
    type: 'google_sheets_trigger',
    label: 'Google Sheets — New Row',
    description: 'Trigger when a new row is added to a spreadsheet',
    icon: 'FileSpreadsheet',
    category: 'trigger',
    group: 'productivity',
    tags: ['google sheets', 'spreadsheet', 'row', 'google', 'data'],
    configFields: [
      { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', required: true },
      { key: 'sheetName', label: 'Sheet Name', type: 'text', defaultValue: 'Sheet1' },
    ],
  },
  {
    type: 'google_sheets_append',
    label: 'Google Sheets — Append Row',
    description: 'Add a new row to a Google Sheet',
    icon: 'FileSpreadsheet',
    category: 'action',
    group: 'productivity',
    tags: ['google sheets', 'spreadsheet', 'append', 'row', 'data', 'google'],
    configFields: [
      { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', required: true },
      { key: 'sheetName', label: 'Sheet Name', type: 'text', defaultValue: 'Sheet1' },
      { key: 'values', label: 'Row Data (JSON array)', type: 'textarea', placeholder: '["{{name}}", "{{email}}", "{{date}}"]', required: true },
    ],
  },
  {
    type: 'notion_create_page',
    label: 'Notion — Create Page',
    description: 'Create a new page or database entry in Notion',
    icon: 'FileText',
    category: 'action',
    group: 'productivity',
    tags: ['notion', 'page', 'database', 'notes', 'wiki', 'doc'],
    configFields: [
      { key: 'apiKey', label: 'Integration Token', type: 'password', required: true },
      { key: 'databaseId', label: 'Database ID', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', placeholder: '{{data.title}}', required: true },
      { key: 'properties', label: 'Properties (JSON)', type: 'textarea', placeholder: '{"Status": "To Do"}' },
    ],
  },
  {
    type: 'notion_trigger',
    label: 'Notion — New Database Item',
    description: 'Trigger when a new item is added to a Notion database',
    icon: 'FileText',
    category: 'trigger',
    group: 'productivity',
    tags: ['notion', 'database', 'new item', 'trigger'],
    configFields: [
      { key: 'apiKey', label: 'Integration Token', type: 'password', required: true },
      { key: 'databaseId', label: 'Database ID', type: 'text', required: true },
    ],
  },
  {
    type: 'airtable_trigger',
    label: 'Airtable — New Record',
    description: 'Trigger when a record is added to an Airtable base',
    icon: 'Table',
    category: 'trigger',
    group: 'productivity',
    tags: ['airtable', 'database', 'record', 'spreadsheet', 'base'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'baseId', label: 'Base ID', type: 'text', required: true },
      { key: 'tableName', label: 'Table Name', type: 'text', required: true },
    ],
  },
  {
    type: 'airtable_create',
    label: 'Airtable — Create Record',
    description: 'Add a new record to an Airtable table',
    icon: 'Table',
    category: 'action',
    group: 'productivity',
    tags: ['airtable', 'record', 'database', 'create', 'base'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'baseId', label: 'Base ID', type: 'text', required: true },
      { key: 'tableName', label: 'Table Name', type: 'text', required: true },
      { key: 'fields', label: 'Fields (JSON)', type: 'textarea', placeholder: '{"Name": "{{data.name}}", "Status": "Active"}', required: true },
    ],
  },
  {
    type: 'trello_card',
    label: 'Trello — Create Card',
    description: 'Add a card to a Trello board list',
    icon: 'Columns',
    category: 'action',
    group: 'productivity',
    tags: ['trello', 'card', 'board', 'task', 'kanban', 'project'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'apiToken', label: 'API Token', type: 'password', required: true },
      { key: 'listId', label: 'List ID', type: 'text', required: true },
      { key: 'name', label: 'Card Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'dueDate', label: 'Due Date', type: 'text', placeholder: '2024-12-31' },
    ],
  },
  {
    type: 'jira_issue',
    label: 'Jira — Create Issue',
    description: 'Create a new issue in a Jira project',
    icon: 'Bug',
    category: 'action',
    group: 'productivity',
    tags: ['jira', 'issue', 'bug', 'task', 'ticket', 'project', 'agile', 'sprint'],
    configFields: [
      { key: 'domain', label: 'Domain', type: 'text', placeholder: 'yourcompany.atlassian.net', required: true },
      { key: 'email', label: 'Account Email', type: 'text', required: true },
      { key: 'apiToken', label: 'API Token', type: 'password', required: true },
      { key: 'projectKey', label: 'Project Key', type: 'text', placeholder: 'ENG', required: true },
      { key: 'summary', label: 'Summary', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'issueType', label: 'Issue Type', type: 'select', options: [
        { label: 'Bug', value: 'Bug' }, { label: 'Task', value: 'Task' }, { label: 'Story', value: 'Story' },
      ], defaultValue: 'Task' },
    ],
  },
  {
    type: 'asana_task',
    label: 'Asana — Create Task',
    description: 'Add a task to an Asana project',
    icon: 'CheckSquare',
    category: 'action',
    group: 'productivity',
    tags: ['asana', 'task', 'project', 'todo', 'team'],
    configFields: [
      { key: 'accessToken', label: 'Personal Access Token', type: 'password', required: true },
      { key: 'projectGid', label: 'Project GID', type: 'text', required: true },
      { key: 'name', label: 'Task Name', type: 'text', required: true },
      { key: 'notes', label: 'Notes', type: 'textarea' },
      { key: 'dueOn', label: 'Due On (YYYY-MM-DD)', type: 'text' },
    ],
  },
  {
    type: 'clickup_task',
    label: 'ClickUp — Create Task',
    description: 'Create a task in ClickUp',
    icon: 'MousePointer',
    category: 'action',
    group: 'productivity',
    tags: ['clickup', 'task', 'project', 'list', 'pm'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'listId', label: 'List ID', type: 'text', required: true },
      { key: 'name', label: 'Task Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'priority', label: 'Priority', type: 'select', options: [
        { label: 'Urgent', value: '1' }, { label: 'High', value: '2' },
        { label: 'Normal', value: '3' }, { label: 'Low', value: '4' },
      ], defaultValue: '3' },
    ],
  },
  {
    type: 'todoist_task',
    label: 'Todoist — Create Task',
    description: 'Add a task to Todoist',
    icon: 'CheckCircle',
    category: 'action',
    group: 'productivity',
    tags: ['todoist', 'task', 'todo', 'personal', 'reminder'],
    configFields: [
      { key: 'apiToken', label: 'API Token', type: 'password', required: true },
      { key: 'content', label: 'Task Content', type: 'text', required: true },
      { key: 'projectId', label: 'Project ID', type: 'text' },
      { key: 'dueString', label: 'Due', type: 'text', placeholder: 'tomorrow at 10am' },
      { key: 'priority', label: 'Priority', type: 'select', options: [
        { label: 'P1 (urgent)', value: '4' }, { label: 'P2', value: '3' }, { label: 'P3', value: '2' }, { label: 'P4', value: '1' },
      ], defaultValue: '2' },
    ],
  },
  {
    type: 'monday_item',
    label: 'Monday.com — Create Item',
    description: 'Create an item in a Monday.com board',
    icon: 'LayoutGrid',
    category: 'action',
    group: 'productivity',
    tags: ['monday', 'board', 'item', 'project', 'management'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'boardId', label: 'Board ID', type: 'number', required: true },
      { key: 'groupId', label: 'Group ID', type: 'text' },
      { key: 'itemName', label: 'Item Name', type: 'text', required: true },
    ],
  },

  // ══════════════════════════════ CLOUD STORAGE ══════════════════════════════
  {
    type: 'google_drive_upload',
    label: 'Google Drive — Upload File',
    description: 'Upload a file to Google Drive',
    icon: 'HardDrive',
    category: 'action',
    group: 'cloud',
    tags: ['google drive', 'storage', 'upload', 'file', 'google'],
    configFields: [
      { key: 'folderId', label: 'Folder ID', type: 'text', placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms' },
      { key: 'fileName', label: 'File Name', type: 'text', placeholder: '{{data.filename}}', required: true },
      { key: 'mimeType', label: 'MIME Type', type: 'text', placeholder: 'application/pdf' },
      { key: 'content', label: 'File Content / URL', type: 'textarea', required: true },
    ],
  },
  {
    type: 'dropbox_upload',
    label: 'Dropbox — Upload File',
    description: 'Upload content to Dropbox',
    icon: 'Package',
    category: 'action',
    group: 'cloud',
    tags: ['dropbox', 'storage', 'file', 'upload', 'cloud'],
    configFields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'path', label: 'Path', type: 'text', placeholder: '/uploads/file.pdf', required: true },
      { key: 'content', label: 'File Content', type: 'textarea', required: true },
      { key: 'autoRename', label: 'Auto rename on conflict', type: 'toggle', defaultValue: true },
    ],
  },
  {
    type: 'aws_s3_upload',
    label: 'AWS S3 — Upload Object',
    description: 'Put an object into an S3 bucket',
    icon: 'Cloud',
    category: 'action',
    group: 'cloud',
    tags: ['aws', 's3', 'storage', 'cloud', 'amazon', 'bucket', 'object'],
    configFields: [
      { key: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true },
      { key: 'region', label: 'Region', type: 'text', defaultValue: 'us-east-1' },
      { key: 'bucket', label: 'Bucket', type: 'text', required: true },
      { key: 'key', label: 'Object Key (path)', type: 'text', required: true },
      { key: 'body', label: 'Content / Body', type: 'textarea', required: true },
    ],
  },
  {
    type: 'onedrive_upload',
    label: 'OneDrive — Upload File',
    description: 'Upload a file to Microsoft OneDrive',
    icon: 'Cloud',
    category: 'action',
    group: 'cloud',
    tags: ['onedrive', 'microsoft', 'storage', 'file', 'upload'],
    configFields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'path', label: 'File Path', type: 'text', placeholder: '/Documents/file.pdf', required: true },
      { key: 'content', label: 'File Content / URL', type: 'textarea', required: true },
    ],
  },
  {
    type: 'box_upload',
    label: 'Box — Upload File',
    description: 'Upload files to Box cloud storage',
    icon: 'Archive',
    category: 'action',
    group: 'cloud',
    tags: ['box', 'storage', 'file', 'enterprise', 'cloud'],
    configFields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'folderId', label: 'Folder ID', type: 'text', defaultValue: '0' },
      { key: 'fileName', label: 'File Name', type: 'text', required: true },
      { key: 'content', label: 'File Content', type: 'textarea', required: true },
    ],
  },

  // ══════════════════════════════ DATABASES ══════════════════════════════
  {
    type: 'mysql_query',
    label: 'MySQL — Run Query',
    description: 'Execute a SQL query on a MySQL database',
    icon: 'Database',
    category: 'action',
    group: 'database',
    tags: ['mysql', 'sql', 'database', 'query', 'relational', 'db'],
    configFields: [
      { key: 'host', label: 'Host', type: 'text', placeholder: 'localhost', required: true },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 3306 },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'user', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'query', label: 'SQL Query', type: 'textarea', placeholder: 'SELECT * FROM users WHERE id = {{data.id}}', required: true },
    ],
  },
  {
    type: 'postgres_query',
    label: 'PostgreSQL — Run Query',
    description: 'Execute a SQL query on PostgreSQL',
    icon: 'Database',
    category: 'action',
    group: 'database',
    tags: ['postgres', 'postgresql', 'sql', 'database', 'query', 'relational'],
    configFields: [
      { key: 'connectionString', label: 'Connection String', type: 'text', placeholder: 'postgresql://user:pass@host:5432/db', required: true },
      { key: 'query', label: 'SQL Query', type: 'textarea', placeholder: 'INSERT INTO orders VALUES (...)  ', required: true },
    ],
  },
  {
    type: 'mongodb_query',
    label: 'MongoDB — Find Documents',
    description: 'Query documents from a MongoDB collection',
    icon: 'Database',
    category: 'action',
    group: 'database',
    tags: ['mongodb', 'nosql', 'database', 'collection', 'document', 'find'],
    configFields: [
      { key: 'connectionString', label: 'Connection String', type: 'text', placeholder: 'mongodb+srv://...', required: true },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'collection', label: 'Collection', type: 'text', required: true },
      { key: 'filter', label: 'Filter (JSON)', type: 'textarea', placeholder: '{"status": "active"}' },
      { key: 'limit', label: 'Limit', type: 'number', defaultValue: 100 },
    ],
  },
  {
    type: 'redis_set',
    label: 'Redis — Set Value',
    description: 'Set a key-value pair in Redis',
    icon: 'Layers',
    category: 'action',
    group: 'database',
    tags: ['redis', 'cache', 'key value', 'memory', 'store'],
    configFields: [
      { key: 'url', label: 'Redis URL', type: 'text', placeholder: 'redis://localhost:6379', required: true },
      { key: 'key', label: 'Key', type: 'text', required: true },
      { key: 'value', label: 'Value', type: 'text', required: true },
      { key: 'ttl', label: 'TTL (seconds, 0 = no expiry)', type: 'number', defaultValue: 0 },
    ],
  },
  {
    type: 'supabase_insert',
    label: 'Supabase — Insert Row',
    description: 'Insert a row into a Supabase table',
    icon: 'Database',
    category: 'action',
    group: 'database',
    tags: ['supabase', 'postgres', 'database', 'insert', 'row', 'realtime'],
    configFields: [
      { key: 'url', label: 'Supabase URL', type: 'text', placeholder: 'https://xxxxx.supabase.co', required: true },
      { key: 'anonKey', label: 'Anon Key', type: 'password', required: true },
      { key: 'table', label: 'Table Name', type: 'text', required: true },
      { key: 'data', label: 'Row Data (JSON)', type: 'textarea', placeholder: '{"name": "{{data.name}}", "email": "{{data.email}}"}', required: true },
    ],
  },
  {
    type: 'firebase_write',
    label: 'Firebase — Write Data',
    description: 'Write data to Firebase Realtime Database or Firestore',
    icon: 'Flame',
    category: 'action',
    group: 'database',
    tags: ['firebase', 'firestore', 'realtime', 'database', 'google', 'mobile'],
    configFields: [
      { key: 'projectId', label: 'Project ID', type: 'text', required: true },
      { key: 'serviceAccountKey', label: 'Service Account (JSON)', type: 'textarea', required: true },
      { key: 'collection', label: 'Collection', type: 'text', required: true },
      { key: 'data', label: 'Document Data (JSON)', type: 'textarea', required: true },
    ],
  },

  // ══════════════════════════════ E-COMMERCE ══════════════════════════════
  {
    type: 'shopify_order_trigger',
    label: 'Shopify — New Order',
    description: 'Trigger when a new order is placed',
    icon: 'ShoppingBag',
    category: 'trigger',
    group: 'ecommerce',
    tags: ['shopify', 'order', 'ecommerce', 'store', 'purchase', 'checkout'],
    configFields: [
      { key: 'shopDomain', label: 'Shop Domain', type: 'text', placeholder: 'mystore.myshopify.com', required: true },
      { key: 'accessToken', label: 'Admin API Token', type: 'password', required: true },
      { key: 'eventType', label: 'Event', type: 'select', options: [
        { label: 'New order', value: 'orders/create' },
        { label: 'Order paid', value: 'orders/paid' },
        { label: 'Order fulfilled', value: 'orders/fulfilled' },
        { label: 'Order cancelled', value: 'orders/cancelled' },
      ], defaultValue: 'orders/create' },
    ],
  },
  {
    type: 'shopify_product',
    label: 'Shopify — Create Product',
    description: 'Add a new product to Shopify store',
    icon: 'Package',
    category: 'action',
    group: 'ecommerce',
    tags: ['shopify', 'product', 'store', 'ecommerce', 'add'],
    configFields: [
      { key: 'shopDomain', label: 'Shop Domain', type: 'text', required: true },
      { key: 'accessToken', label: 'Admin API Token', type: 'password', required: true },
      { key: 'title', label: 'Product Title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'price', label: 'Price', type: 'number', required: true },
      { key: 'vendor', label: 'Vendor', type: 'text' },
    ],
  },
  {
    type: 'stripe_payment_trigger',
    label: 'Stripe — Payment Intent',
    description: 'Trigger on Stripe payment events',
    icon: 'CreditCard',
    category: 'trigger',
    group: 'ecommerce',
    tags: ['stripe', 'payment', 'checkout', 'billing', 'subscription', 'card'],
    configFields: [
      { key: 'webhookSecret', label: 'Webhook Signing Secret', type: 'password', required: true },
      { key: 'eventType', label: 'Event Type', type: 'select', options: [
        { label: 'payment_intent.succeeded', value: 'payment_intent.succeeded' },
        { label: 'payment_intent.failed', value: 'payment_intent.payment_failed' },
        { label: 'customer.subscription.created', value: 'customer.subscription.created' },
        { label: 'invoice.paid', value: 'invoice.paid' },
      ], defaultValue: 'payment_intent.succeeded' },
    ],
  },
  {
    type: 'stripe_charge',
    label: 'Stripe — Create Charge',
    description: 'Create a payment charge via Stripe',
    icon: 'CreditCard',
    category: 'action',
    group: 'ecommerce',
    tags: ['stripe', 'charge', 'payment', 'billing', 'card'],
    configFields: [
      { key: 'apiKey', label: 'Secret Key', type: 'password', required: true },
      { key: 'amount', label: 'Amount (cents)', type: 'number', required: true },
      { key: 'currency', label: 'Currency', type: 'text', defaultValue: 'usd' },
      { key: 'source', label: 'Payment Source / Token', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'text' },
    ],
  },
  {
    type: 'paypal_payment',
    label: 'PayPal — Create Payment',
    description: 'Create a PayPal payment order',
    icon: 'DollarSign',
    category: 'action',
    group: 'ecommerce',
    tags: ['paypal', 'payment', 'checkout', 'billing', 'money'],
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD' },
      { key: 'sandbox', label: 'Sandbox Mode', type: 'toggle', defaultValue: true },
    ],
  },
  {
    type: 'woocommerce_order',
    label: 'WooCommerce — New Order',
    description: 'Trigger on new WooCommerce orders',
    icon: 'ShoppingCart',
    category: 'trigger',
    group: 'ecommerce',
    tags: ['woocommerce', 'wordpress', 'order', 'ecommerce', 'store'],
    configFields: [
      { key: 'siteUrl', label: 'Site URL', type: 'text', placeholder: 'https://myshop.com', required: true },
      { key: 'consumerKey', label: 'Consumer Key', type: 'text', required: true },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: true },
    ],
  },

  // ══════════════════════════════ SOCIAL MEDIA ══════════════════════════════
  {
    type: 'twitter_tweet',
    label: 'X (Twitter) — Post Tweet',
    description: 'Post a tweet to a Twitter/X account',
    icon: 'Twitter',
    category: 'action',
    group: 'social',
    tags: ['twitter', 'x', 'tweet', 'post', 'social', 'social media'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'text', required: true },
      { key: 'accessTokenSecret', label: 'Access Token Secret', type: 'password', required: true },
      { key: 'text', label: 'Tweet Text', type: 'textarea', placeholder: 'Hello world! {{data.message}}', required: true },
    ],
  },
  {
    type: 'linkedin_post',
    label: 'LinkedIn — Create Post',
    description: 'Post content to a LinkedIn profile or company page',
    icon: 'Linkedin',
    category: 'action',
    group: 'social',
    tags: ['linkedin', 'post', 'social', 'professional', 'company'],
    configFields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'text', label: 'Post Text', type: 'textarea', required: true },
      { key: 'type', label: 'Post As', type: 'select', options: [
        { label: 'Personal Profile', value: 'person' }, { label: 'Company Page', value: 'organization' },
      ], defaultValue: 'person' },
      { key: 'organizationId', label: 'Company URN (if company post)', type: 'text' },
    ],
  },
  {
    type: 'facebook_post',
    label: 'Facebook — Create Post',
    description: 'Post to a Facebook page',
    icon: 'Facebook',
    category: 'action',
    group: 'social',
    tags: ['facebook', 'meta', 'post', 'social', 'page'],
    configFields: [
      { key: 'pageId', label: 'Page ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Page Access Token', type: 'password', required: true },
      { key: 'message', label: 'Message', type: 'textarea', required: true },
      { key: 'link', label: 'Link (optional)', type: 'text' },
    ],
  },
  {
    type: 'instagram_caption',
    label: 'Instagram — Create Post',
    description: 'Schedule an Instagram post via Meta API',
    icon: 'Instagram',
    category: 'action',
    group: 'social',
    tags: ['instagram', 'post', 'photo', 'social', 'meta', 'caption'],
    configFields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'igAccountId', label: 'IG Account ID', type: 'text', required: true },
      { key: 'imageUrl', label: 'Image URL', type: 'text', required: true },
      { key: 'caption', label: 'Caption', type: 'textarea', required: true },
    ],
  },
  {
    type: 'youtube_upload',
    label: 'YouTube — Upload Video',
    description: 'Upload a video to a YouTube channel',
    icon: 'Youtube',
    category: 'action',
    group: 'social',
    tags: ['youtube', 'video', 'upload', 'social', 'content'],
    configFields: [
      { key: 'accessToken', label: 'OAuth2 Access Token', type: 'password', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'videoUrl', label: 'Video File URL', type: 'text', required: true },
      { key: 'privacyStatus', label: 'Privacy', type: 'select', options: [
        { label: 'Public', value: 'public' }, { label: 'Unlisted', value: 'unlisted' }, { label: 'Private', value: 'private' },
      ], defaultValue: 'public' },
    ],
  },

  // ══════════════════════════════ DEV TOOLS ══════════════════════════════
  {
    type: 'github_trigger',
    label: 'GitHub — Push / PR Event',
    description: 'Trigger on GitHub repository events',
    icon: 'Github',
    category: 'trigger',
    group: 'devtools',
    tags: ['github', 'git', 'push', 'pull request', 'commit', 'code', 'repository'],
    configFields: [
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
      { key: 'event', label: 'Event', type: 'select', options: [
        { label: 'push', value: 'push' }, { label: 'pull_request', value: 'pull_request' },
        { label: 'issues', value: 'issues' }, { label: 'release', value: 'release' },
      ], defaultValue: 'push' },
      { key: 'branch', label: 'Branch Filter', type: 'text', placeholder: 'main' },
    ],
  },
  {
    type: 'github_issue',
    label: 'GitHub — Create Issue',
    description: 'Open a new issue on a GitHub repository',
    icon: 'Github',
    category: 'action',
    group: 'devtools',
    tags: ['github', 'issue', 'repository', 'code', 'bug', 'ticket'],
    configFields: [
      { key: 'token', label: 'Personal Access Token', type: 'password', required: true },
      { key: 'owner', label: 'Owner', type: 'text', required: true },
      { key: 'repo', label: 'Repository', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'labels', label: 'Labels (comma separated)', type: 'text', placeholder: 'bug, priority:high' },
    ],
  },
  {
    type: 'gitlab_trigger',
    label: 'GitLab — Pipeline Event',
    description: 'Trigger on GitLab CI/CD pipeline events',
    icon: 'GitlabIcon',
    category: 'trigger',
    group: 'devtools',
    tags: ['gitlab', 'ci', 'cd', 'pipeline', 'code', 'devops'],
    configFields: [
      { key: 'secretToken', label: 'Secret Token', type: 'password' },
      { key: 'event', label: 'Event', type: 'select', options: [
        { label: 'Push', value: 'Push Hook' }, { label: 'Pipeline', value: 'Pipeline Hook' },
        { label: 'Merge Request', value: 'Merge Request Hook' },
      ], defaultValue: 'Push Hook' },
    ],
  },
  {
    type: 'pagerduty_alert',
    label: 'PagerDuty — Create Incident',
    description: 'Create a PagerDuty incident alert',
    icon: 'AlertTriangle',
    category: 'action',
    group: 'devtools',
    tags: ['pagerduty', 'incident', 'alert', 'on call', 'monitoring'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'serviceKey', label: 'Service Key', type: 'text', required: true },
      { key: 'summary', label: 'Incident Summary', type: 'text', required: true },
      { key: 'severity', label: 'Severity', type: 'select', options: [
        { label: 'Critical', value: 'critical' }, { label: 'Error', value: 'error' },
        { label: 'Warning', value: 'warning' }, { label: 'Info', value: 'info' },
      ], defaultValue: 'error' },
    ],
  },
  {
    type: 'datadog_metric',
    label: 'Datadog — Send Metric',
    description: 'Submit a custom metric to Datadog',
    icon: 'BarChart2',
    category: 'action',
    group: 'devtools',
    tags: ['datadog', 'metric', 'monitoring', 'apm', 'observability'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'metricName', label: 'Metric Name', type: 'text', placeholder: 'app.orders.count', required: true },
      { key: 'value', label: 'Value', type: 'number', required: true },
      { key: 'tags', label: 'Tags (comma separated)', type: 'text', placeholder: 'env:prod,service:api' },
    ],
  },
  {
    type: 'sentry_trigger',
    label: 'Sentry — New Error',
    description: 'Trigger when a new issue appears in Sentry',
    icon: 'Bug',
    category: 'trigger',
    group: 'devtools',
    tags: ['sentry', 'error', 'exception', 'monitoring', 'crash', 'bug'],
    configFields: [
      { key: 'webhookSecret', label: 'Client Secret', type: 'password' },
      { key: 'projId', label: 'Project Slug', type: 'text' },
    ],
  },

  // ══════════════════════════════ AI & AGENTS ══════════════════════════════
  {
    type: 'openai_complete',
    label: 'OpenAI — Text Completion',
    description: 'Generate text using GPT-4 or GPT-3.5',
    icon: 'Sparkles',
    category: 'action',
    group: 'ai',
    tags: ['openai', 'gpt', 'chatgpt', 'ai', 'nlp', 'generate', 'text', 'completion'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'model', label: 'Model', type: 'select', options: [
        { label: 'gpt-4o', value: 'gpt-4o' }, { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
        { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
      ], defaultValue: 'gpt-4o' },
      { key: 'systemPrompt', label: 'System Prompt', type: 'textarea', placeholder: 'You are a helpful assistant.' },
      { key: 'prompt', label: 'User Prompt', type: 'textarea', placeholder: 'Summarize: {{data.content}}', required: true },
      { key: 'temperature', label: 'Temperature', type: 'number', defaultValue: 0.7 },
      { key: 'maxTokens', label: 'Max Tokens', type: 'number', defaultValue: 1000 },
    ],
  },
  {
    type: 'openai_embed',
    label: 'OpenAI — Embeddings',
    description: 'Generate vector embeddings using OpenAI',
    icon: 'Binary',
    category: 'action',
    group: 'ai',
    tags: ['openai', 'embeddings', 'vector', 'semantic search', 'ai'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'model', label: 'Model', type: 'select', options: [
        { label: 'text-embedding-3-small', value: 'text-embedding-3-small' },
        { label: 'text-embedding-3-large', value: 'text-embedding-3-large' },
      ], defaultValue: 'text-embedding-3-small' },
      { key: 'input', label: 'Input Text', type: 'textarea', required: true },
    ],
  },
  {
    type: 'anthropic_claude',
    label: 'Anthropic — Claude',
    description: 'Run prompts through Anthropic Claude',
    icon: 'Brain',
    category: 'action',
    group: 'ai',
    tags: ['anthropic', 'claude', 'ai', 'nlp', 'generate', 'llm'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'model', label: 'Model', type: 'select', options: [
        { label: 'claude-3-5-sonnet', value: 'claude-3-5-sonnet-20241022' },
        { label: 'claude-3-haiku', value: 'claude-3-haiku-20240307' },
      ], defaultValue: 'claude-3-5-sonnet-20241022' },
      { key: 'prompt', label: 'Prompt', type: 'textarea', placeholder: '{{data.input}}', required: true },
      { key: 'maxTokens', label: 'Max Tokens', type: 'number', defaultValue: 1024 },
    ],
  },
  {
    type: 'google_gemini',
    label: 'Google — Gemini AI',
    description: 'Generate content with Google Gemini',
    icon: 'Star',
    category: 'action',
    group: 'ai',
    tags: ['gemini', 'google ai', 'bard', 'llm', 'generate', 'text'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'model', label: 'Model', type: 'select', options: [
        { label: 'gemini-1.5-pro', value: 'gemini-1.5-pro' },
        { label: 'gemini-1.5-flash', value: 'gemini-1.5-flash' },
      ], defaultValue: 'gemini-1.5-flash' },
      { key: 'prompt', label: 'Prompt', type: 'textarea', required: true },
      { key: 'temperature', label: 'Temperature', type: 'number', defaultValue: 0.9 },
    ],
  },
  {
    type: 'huggingface_inference',
    label: 'Hugging Face — Inference',
    description: 'Call Hugging Face model inference endpoints',
    icon: 'Cpu',
    category: 'action',
    group: 'ai',
    tags: ['huggingface', 'model', 'inference', 'nlp', 'classification', 'ml'],
    configFields: [
      { key: 'apiKey', label: 'API Token', type: 'password', required: true },
      { key: 'model', label: 'Model ID', type: 'text', placeholder: 'facebook/bart-large-cnn', required: true },
      { key: 'inputs', label: 'Inputs', type: 'textarea', required: true },
    ],
  },
  {
    type: 'ai_agent',
    label: 'AI Agent',
    description: 'Run a multi-step autonomous AI agent task',
    icon: 'Bot',
    category: 'action',
    group: 'ai',
    tags: ['agent', 'ai', 'autonomous', 'tools', 'agentic', 'multi step'],
    configFields: [
      { key: 'model', label: 'AI Model', type: 'select', options: [
        { label: 'GPT-4o', value: 'gpt-4o' }, { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
        { label: 'Gemini Pro', value: 'gemini-1.5-pro' },
      ], defaultValue: 'gpt-4o' },
      { key: 'objective', label: 'Objective / Task', type: 'textarea', placeholder: 'Research {{topic}} and return a summary.', required: true },
      { key: 'maxSteps', label: 'Max Steps', type: 'number', defaultValue: 5 },
    ],
  },
  {
    type: 'ai_classify',
    label: 'AI — Classify / Label',
    description: 'Classify text into predefined categories',
    icon: 'Tag',
    category: 'action',
    group: 'ai',
    tags: ['classify', 'label', 'ai', 'category', 'sentiment', 'categorize'],
    configFields: [
      { key: 'apiKey', label: 'OpenAI API Key', type: 'password', required: true },
      { key: 'text', label: 'Text to Classify', type: 'textarea', placeholder: '{{data.content}}', required: true },
      { key: 'categories', label: 'Categories (comma separated)', type: 'text', placeholder: 'positive, negative, neutral', required: true },
    ],
  },
  {
    type: 'ai_summarize',
    label: 'AI — Summarize',
    description: 'Summarize long text using an AI model',
    icon: 'AlignLeft',
    category: 'action',
    group: 'ai',
    tags: ['summarize', 'ai', 'text', 'extract', 'condense', 'summary'],
    configFields: [
      { key: 'apiKey', label: 'OpenAI API Key', type: 'password', required: true },
      { key: 'text', label: 'Text to Summarize', type: 'textarea', required: true },
      { key: 'maxWords', label: 'Max Words', type: 'number', defaultValue: 150 },
      { key: 'style', label: 'Style', type: 'select', options: [
        { label: 'Bullet points', value: 'bullets' }, { label: 'Paragraph', value: 'paragraph' }, { label: 'TLDR', value: 'tldr' },
      ], defaultValue: 'paragraph' },
    ],
  },

  // ── OpenRouter ──
  {
    type: 'openrouter_complete',
    label: 'OpenRouter — Chat Completion',
    description: 'Route to any LLM via OpenRouter (GPT-4o, Claude, Llama, Mixtral, etc.)',
    icon: 'Sparkles',
    category: 'action',
    group: 'ai',
    tags: ['openrouter', 'llm', 'ai', 'gpt', 'claude', 'llama', 'mixtral', 'chat', 'completion', 'router'],
    configFields: [
      { key: 'apiKey', label: 'OpenRouter API Key', type: 'password', required: true, hint: 'Get your key at openrouter.ai/keys' },
      { key: 'model', label: 'Model', type: 'select', options: [
        { label: 'OpenAI GPT-4o', value: 'openai/gpt-4o' },
        { label: 'OpenAI GPT-4o Mini', value: 'openai/gpt-4o-mini' },
        { label: 'Anthropic Claude 3.5 Sonnet', value: 'anthropic/claude-3.5-sonnet' },
        { label: 'Anthropic Claude 3 Haiku', value: 'anthropic/claude-3-haiku' },
        { label: 'Google Gemini 2.0 Flash', value: 'google/gemini-2.0-flash-exp' },
        { label: 'Meta Llama 3.1 405B', value: 'meta-llama/llama-3.1-405b-instruct' },
        { label: 'Meta Llama 3.1 70B', value: 'meta-llama/llama-3.1-70b-instruct' },
        { label: 'Mistral Large', value: 'mistralai/mistral-large-latest' },
        { label: 'DeepSeek V3', value: 'deepseek/deepseek-chat' },
        { label: 'Qwen 2.5 72B', value: 'qwen/qwen-2.5-72b-instruct' },
      ], defaultValue: 'openai/gpt-4o-mini', required: true },
      { key: 'systemPrompt', label: 'System Prompt', type: 'textarea', placeholder: 'You are a helpful assistant.' },
      { key: 'prompt', label: 'User Message', type: 'textarea', placeholder: '{{data.content}}', required: true },
      { key: 'temperature', label: 'Temperature', type: 'number', defaultValue: 0.7, hint: '0 = deterministic, 2 = creative' },
      { key: 'maxTokens', label: 'Max Tokens', type: 'number', defaultValue: 1024 },
      { key: 'topP', label: 'Top P', type: 'number', defaultValue: 1 },
      { key: 'responseFormat', label: 'Response Format', type: 'select', options: [
        { label: 'Text', value: 'text' }, { label: 'JSON Object', value: 'json_object' },
      ], defaultValue: 'text' },
    ],
  },

  // ── ElevenLabs ──
  {
    type: 'elevenlabs_tts',
    label: 'ElevenLabs — Text to Speech',
    description: 'Convert text to natural-sounding speech using ElevenLabs',
    icon: 'Volume2',
    category: 'action',
    group: 'ai',
    tags: ['elevenlabs', 'tts', 'text to speech', 'voice', 'audio', 'ai', 'speech'],
    configFields: [
      { key: 'apiKey', label: 'ElevenLabs API Key', type: 'password', required: true, hint: 'Get your key at elevenlabs.io' },
      { key: 'text', label: 'Text to Speak', type: 'textarea', placeholder: '{{data.message}}', required: true },
      { key: 'voiceId', label: 'Voice', type: 'select', options: [
        { label: 'Rachel (Female)', value: '21m00Tcm4TlvDq8ikWAM' },
        { label: 'Drew (Male)', value: '29vD33N1CtxCmqQRPOHJ' },
        { label: 'Clyde (Male)', value: '2EiwWnXFnvU5JabPnv8n' },
        { label: 'Paul (Male)', value: '5Q0t7uMcjvnagumLfvZi' },
        { label: 'Domi (Female)', value: 'AZnzlk1XvdvUeBnXmlld' },
        { label: 'Dave (Male)', value: 'CYw3kZ02Hs0563khs1Fj' },
        { label: 'Fin (Male)', value: 'D38z5RcWu1voky8WS1ja' },
        { label: 'Sarah (Female)', value: 'EXAVITQu4vr4xnSDxMaL' },
        { label: 'Antoni (Male)', value: 'ErXwobaYiN019PkySvjV' },
        { label: 'Elli (Female)', value: 'MF3mGyEYCl7XYWbV9V6O' },
      ], defaultValue: '21m00Tcm4TlvDq8ikWAM', required: true },
      { key: 'modelId', label: 'Model', type: 'select', options: [
        { label: 'Eleven Multilingual v2', value: 'eleven_multilingual_v2' },
        { label: 'Eleven Turbo v2.5', value: 'eleven_turbo_v2_5' },
        { label: 'Eleven English v1', value: 'eleven_monolingual_v1' },
      ], defaultValue: 'eleven_multilingual_v2' },
      { key: 'stability', label: 'Stability', type: 'number', defaultValue: 0.5, hint: '0 = more variable, 1 = more stable' },
      { key: 'similarityBoost', label: 'Clarity + Similarity', type: 'number', defaultValue: 0.75, hint: '0 = more diverse, 1 = more similar' },
      { key: 'outputFormat', label: 'Output Format', type: 'select', options: [
        { label: 'MP3 (44.1kHz)', value: 'mp3_44100_128' },
        { label: 'PCM (16kHz)', value: 'pcm_16000' },
        { label: 'PCM (44.1kHz)', value: 'pcm_44100' },
      ], defaultValue: 'mp3_44100_128' },
    ],
  },

  // ── Code / JavaScript ──
  {
    type: 'code_javascript',
    label: 'Code — JavaScript',
    description: 'Run custom JavaScript code to transform data',
    icon: 'Code2',
    category: 'action',
    group: 'core',
    tags: ['code', 'javascript', 'js', 'script', 'function', 'custom', 'transform'],
    configFields: [
      { key: 'code', label: 'JavaScript Code', type: 'code', placeholder: '// Access input data via `input`\nconst result = input.data;\nreturn { processed: true, data: result };', required: true, hint: 'The input data is available as `input`. Return the output object.' },
      { key: 'timeout', label: 'Timeout (ms)', type: 'number', defaultValue: 5000 },
    ],
  },

  // ── Set / Assign ──
  {
    type: 'set_values',
    label: 'Set',
    description: 'Set values to pass to the next node — like Extract Shipment Fields',
    icon: 'PenLine',
    category: 'action',
    group: 'core',
    tags: ['set', 'assign', 'extract', 'fields', 'values', 'map', 'data'],
    configFields: [
      { key: 'keepOnlySet', label: 'Keep Only Set', type: 'toggle', defaultValue: false, hint: 'If enabled, only the fields you set below will be passed through' },
      { key: 'values', label: 'Values to Set (JSON)', type: 'textarea', placeholder: '{"order_id": "{{$json.id}}", "customer_phone": "{{$json.customer.phone}}"}', required: true, hint: 'Define name-value pairs. Use {{$json.field}} to reference input data.' },
    ],
  },

  // ── Switch / Router ──
  {
    type: 'switch',
    label: 'Switch',
    description: 'Route to different branches based on value matching',
    icon: 'GitBranch',
    category: 'condition',
    group: 'core',
    tags: ['switch', 'router', 'route', 'branch', 'case', 'match'],
    configFields: [
      { key: 'field', label: 'Value to Match', type: 'text', placeholder: '{{$json.status}}', required: true },
      { key: 'rules', label: 'Rules (JSON array)', type: 'textarea', placeholder: '[{"value": "active", "output": 0}, {"value": "inactive", "output": 1}]', required: true, hint: 'Each rule maps a value to an output index (0, 1, 2...)' },
      { key: 'fallbackOutput', label: 'Fallback Output', type: 'number', defaultValue: 0, hint: 'Output to use when no rule matches' },
    ],
  },

  // ── Respond to Webhook ──
  {
    type: 'respond_webhook',
    label: 'Respond to Webhook',
    description: 'Send a custom response back to the webhook caller',
    icon: 'Reply',
    category: 'output',
    group: 'core',
    tags: ['respond', 'webhook', 'response', 'http', 'reply', 'send'],
    configFields: [
      { key: 'statusCode', label: 'Status Code', type: 'number', defaultValue: 200, required: true },
      { key: 'responseBody', label: 'Response Body (JSON)', type: 'textarea', placeholder: '{"status": "success", "message": "Received"}', required: true },
      { key: 'headers', label: 'Response Headers (JSON)', type: 'textarea', placeholder: '{"Content-Type": "application/json"}' },
    ],
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return nodeCatalog.find(n => n.type === type);
}

export function getNodesByGroup(group: string): NodeDefinition[] {
  return nodeCatalog.filter(n => n.group === group);
}

export function searchNodes(query: string): NodeDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return nodeCatalog;
  return nodeCatalog.filter(n =>
    n.label.toLowerCase().includes(q) ||
    n.description.toLowerCase().includes(q) ||
    n.type.toLowerCase().includes(q) ||
    n.group.toLowerCase().includes(q) ||
    n.tags.some(t => t.includes(q))
  );
}

export const allGroups = Object.keys(groupMeta);
