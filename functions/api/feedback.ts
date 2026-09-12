export interface Env {
  DISCORD_WEBHOOK_URL?: string;
}

// Simple in-memory rate limiting map for this isolate
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60000;

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return true; // Server-to-server or same-origin request without Origin header
  if (origin === 'https://zapixal.com' || origin === 'https://www.zapixal.com') {
    return true;
  }
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }
  return false;
}

function checkRateLimit(ip: string): boolean {
  if (!ip) return true;
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || record.expiresAt < now) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  record.count++;
  return true;
}

interface ScreenshotValidationResult {
  valid: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
}

function validateAndExtractScreenshot(screenshotBase64: unknown): ScreenshotValidationResult {
  if (screenshotBase64 === undefined || screenshotBase64 === null || screenshotBase64 === '') {
    return { valid: true };
  }

  if (typeof screenshotBase64 !== 'string') {
    return { valid: false, error: 'Screenshot payload must be a string' };
  }

  const match = screenshotBase64.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i);
  if (!match) {
    return { valid: false, error: 'Invalid or unsupported screenshot Data URL format' };
  }

  const mimeType = match[1].toLowerCase();
  const base64Data = match[3];

  const paddingMatches = base64Data.match(/=/g);
  const padding = paddingMatches ? paddingMatches.length : 0;
  const byteLength = Math.floor((base64Data.length * 3) / 4) - padding;

  if (byteLength > 3 * 1024 * 1024) {
    return { valid: false, error: 'Screenshot size exceeds maximum 3MB limit' };
  }

  if (byteLength < 8) {
    return { valid: false, error: 'Screenshot payload too small or corrupted' };
  }

  let binaryString: string;
  try {
    binaryString = atob(base64Data.slice(0, 64));
  } catch {
    return { valid: false, error: 'Invalid base64 encoding in screenshot' };
  }

  const headerBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    headerBytes[i] = binaryString.charCodeAt(i);
  }

  let ext = 'png';
  let isMagicValid = false;

  // PNG Magic Bytes: 89 50 4E 47
  if (
    headerBytes[0] === 0x89 &&
    headerBytes[1] === 0x50 &&
    headerBytes[2] === 0x4e &&
    headerBytes[3] === 0x47
  ) {
    isMagicValid = true;
    ext = 'png';
  }
  // JPEG Magic Bytes: FF D8 FF
  else if (
    headerBytes[0] === 0xff &&
    headerBytes[1] === 0xd8 &&
    headerBytes[2] === 0xff
  ) {
    isMagicValid = true;
    ext = 'jpg';
  }
  // WebP Magic Bytes: RIFF ... WEBP
  else if (
    headerBytes[0] === 0x52 &&
    headerBytes[1] === 0x49 &&
    headerBytes[2] === 0x46 &&
    headerBytes[3] === 0x46 &&
    headerBytes[8] === 0x57 &&
    headerBytes[9] === 0x45 &&
    headerBytes[10] === 0x42 &&
    headerBytes[11] === 0x50
  ) {
    isMagicValid = true;
    ext = 'webp';
  }

  if (!isMagicValid) {
    return { valid: false, error: 'Screenshot magic bytes do not match PNG, JPEG, or WebP format' };
  }

  if (ext === 'png' && mimeType !== 'image/png') {
    return { valid: false, error: 'MIME type mismatch for PNG screenshot' };
  }
  if (ext === 'jpg' && mimeType !== 'image/jpeg' && mimeType !== 'image/jpg') {
    return { valid: false, error: 'MIME type mismatch for JPEG screenshot' };
  }
  if (ext === 'webp' && mimeType !== 'image/webp') {
    return { valid: false, error: 'MIME type mismatch for WebP screenshot' };
  }

  try {
    const fullBinary = atob(base64Data);
    const fullBytes = new Uint8Array(fullBinary.length);
    for (let i = 0; i < fullBinary.length; i++) {
      fullBytes[i] = fullBinary.charCodeAt(i);
    }
    const blob = new Blob([fullBytes], { type: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType });
    return { valid: true, blob, filename: `screenshot.${ext}` };
  } catch {
    return { valid: false, error: 'Failed to decode screenshot base64 data' };
  }
}

function sanitizeMentions(text: string): string {
  if (!text) return '';
  return text.replace(/@/g, '@\u200B');
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  
  if (origin && !isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: 'Forbidden origin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allowedOrigin = origin || 'https://zapixal.com';
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const ip = request.headers.get('CF-Connecting-IP') || '';
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    const rawBody = await request.text();
    if (rawBody.length > 5 * 1024 * 1024) { // 5MB limit
      return new Response(JSON.stringify({ error: 'Payload size exceeds limit' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { isHelpful, category, message, screenshotBase64, diagnostics } = body || {};

    if (typeof isHelpful !== 'boolean') {
      return new Response(JSON.stringify({ error: 'isHelpful must be a boolean' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (category !== undefined && category !== null && (typeof category !== 'string' || category.length > 100)) {
      return new Response(JSON.stringify({ error: 'Category must be a string under 100 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (message !== undefined && message !== null && (typeof message !== 'string' || message.length > 2000)) {
      return new Response(JSON.stringify({ error: 'Message must be a string under 2000 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (diagnostics !== undefined && diagnostics !== null) {
      if (typeof diagnostics !== 'object' || Array.isArray(diagnostics)) {
        return new Response(JSON.stringify({ error: 'Diagnostics must be a non-null plain object' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      for (const key of Object.keys(diagnostics)) {
        const val = (diagnostics as Record<string, unknown>)[key];
        if (val !== null && val !== undefined && typeof val === 'object') {
          return new Response(JSON.stringify({ error: `Nested structures in diagnostics field '${key}' are not allowed` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }

      const {
        currentRoute, browserName, osName, targetFormat, userAgent,
        language, timezone, currentToolName, stalledMessage, appVersion, timestamp
      } = diagnostics;

      if (currentRoute !== undefined && currentRoute !== null && (typeof currentRoute !== 'string' || currentRoute.length > 200)) {
        return new Response(JSON.stringify({ error: 'Invalid currentRoute in diagnostics' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (browserName !== undefined && browserName !== null && (typeof browserName !== 'string' || browserName.length > 100)) {
        return new Response(JSON.stringify({ error: 'Invalid browserName in diagnostics' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (osName !== undefined && osName !== null && (typeof osName !== 'string' || osName.length > 100)) {
        return new Response(JSON.stringify({ error: 'Invalid osName in diagnostics' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (targetFormat !== undefined && targetFormat !== null && (typeof targetFormat !== 'string' || targetFormat.length > 50)) {
        return new Response(JSON.stringify({ error: 'Invalid targetFormat in diagnostics' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (userAgent !== undefined && userAgent !== null && (typeof userAgent !== 'string' || userAgent.length > 500)) {
        return new Response(JSON.stringify({ error: 'Invalid userAgent in diagnostics' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (language !== undefined && language !== null && (typeof language !== 'string' || language.length > 50)) {
        return new Response(JSON.stringify({ error: 'Invalid language in diagnostics' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (timezone !== undefined && timezone !== null && (typeof timezone !== 'string' || timezone.length > 100)) {
        return new Response(JSON.stringify({ error: 'Invalid timezone in diagnostics' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (currentToolName !== undefined && currentToolName !== null && (typeof currentToolName !== 'string' || currentToolName.length > 200)) {
        return new Response(JSON.stringify({ error: 'Invalid currentToolName in diagnostics' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (stalledMessage !== undefined && stalledMessage !== null && (typeof stalledMessage !== 'string' || stalledMessage.length > 500)) {
        return new Response(JSON.stringify({ error: 'Invalid stalledMessage in diagnostics' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (appVersion !== undefined && appVersion !== null && (typeof appVersion !== 'string' || appVersion.length > 50)) {
        return new Response(JSON.stringify({ error: 'Invalid appVersion in diagnostics' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (timestamp !== undefined && timestamp !== null && (typeof timestamp !== 'string' || timestamp.length > 100)) {
        return new Response(JSON.stringify({ error: 'Invalid timestamp in diagnostics' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // Server-side screenshot validation
    const screenshotVal = validateAndExtractScreenshot(screenshotBase64);
    if (!screenshotVal.valid) {
      return new Response(JSON.stringify({ error: screenshotVal.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const webhookUrl = env.DISCORD_WEBHOOK_URL || (typeof process !== 'undefined' ? process.env?.DISCORD_WEBHOOK_URL : undefined);

    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return new Response(JSON.stringify({ error: 'Feedback system not configured on the server.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const isPositive = isHelpful === true;
    const title = isPositive ? '👍 Positive Feedback Received' : '👎 Negative / Issue Feedback';
    const color = isPositive ? 0x10b981 : 0xef4444;
    const sanitizedMessage = sanitizeMentions(message || '');

    const fields = [
      { name: 'Rating', value: isPositive ? '👍 Helpful' : '👎 Not Helpful', inline: true },
      { name: 'Category', value: sanitizeMentions(category || (isPositive ? 'General Praise' : 'Unspecified')), inline: true },
    ];

    if (diagnostics) {
      const diagLines = [];
      diagLines.push(`Browser: ${diagnostics.browserName || 'Unknown'} on ${diagnostics.osName || 'Unknown'}`);
      diagLines.push(`User Agent: ${diagnostics.userAgent || 'Unknown'}`);
      diagLines.push(`Screen: ${diagnostics.screenWidth}x${diagnostics.screenHeight}, Viewport: ${diagnostics.viewportWidth}x${diagnostics.viewportHeight}, DPR: ${diagnostics.devicePixelRatio}`);
      if (diagnostics.deviceMemoryGb) diagLines.push(`RAM: ${diagnostics.deviceMemoryGb}GB`);
      if (diagnostics.cpuCores) diagLines.push(`CPU Cores: ${diagnostics.cpuCores}`);
      diagLines.push(`Language: ${diagnostics.language} | Timezone: ${diagnostics.timezone}`);
      diagLines.push(`Route: ${diagnostics.currentRoute} | Tool: ${diagnostics.currentToolName}`);
      diagLines.push(`Queue: ${diagnostics.fileCount} files | Format: ${diagnostics.targetFormat} | Max KB: ${diagnostics.targetMaxKB || 'N/A'} | Quality: ${diagnostics.quality}`);
      diagLines.push(`Errors: ${diagnostics.hasErrors ? 'Yes' : 'No'}${diagnostics.stalledMessage ? ` | Stalled: ${diagnostics.stalledMessage}` : ''}`);
      diagLines.push(`App Version: ${diagnostics.appVersion} | Client-side: ${diagnostics.isClientSideOnly} | Timestamp: ${diagnostics.timestamp}`);

      const diagStr = diagLines.map(line => sanitizeMentions(line)).join('\n');
      // Truncate just in case it exceeds 1010 chars, Discord limit is 1024 for field value
      const safeDiagStr = diagStr.length > 1000 ? diagStr.substring(0, 1000) + '...' : diagStr;

      fields.push({
        name: 'Technical Diagnostics',
        value: `\`\`\`\n${safeDiagStr}\n\`\`\``,
        inline: false
      });
    }

    const embed: any = {
      title,
      description: sanitizedMessage ? `**User Message:**\n${sanitizedMessage.slice(0, 1000)}` : '*No written message provided*',
      color,
      fields,
      footer: { text: `Zapixal Feedback System • ${new Date().toISOString().split('T')[0]}` },
    };

    const formData = new FormData();
    
    if (screenshotVal.blob && screenshotVal.filename) {
      formData.append('file[0]', screenshotVal.blob, screenshotVal.filename);
      embed.image = { url: `attachment://${screenshotVal.filename}` };
    }
    
    formData.append('payload_json', JSON.stringify({ embeds: [embed] }));

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!discordRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to deliver feedback to upstream server.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Feedback received successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to process feedback', details: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

export const onRequestOptions = async (context: { request: Request }) => {
  const origin = context.request.headers.get('Origin') || '';
  if (origin && !isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: 'Forbidden origin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allowedOrigin = origin || 'https://zapixal.com';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
