import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const NOTIFY_TO = [
  'josh@goldpmr.com',
  'spoole@goldpmr.com',
  'elise@goldpmr.com',
  'mlockhart@goldpmr.com',
];

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const buildEmailHtml = ({ type, fields, resumeUrl }) => {
  const rows = [
    { label: 'Name', value: fields.name },
    { label: 'Email', value: fields.email },
    { label: 'Phone', value: fields.phone },
    ...(type === 'facility' ? [
      { label: 'Organization', value: fields.org },
      { label: 'Address', value: fields.address },
    ] : []),
    ...(type === 'physician' && resumeUrl ? [
      { label: 'Resume', value: `<a href="${resumeUrl}" style="color: #C9A227;">Download (link valid 7 days)</a>`, raw: true },
    ] : []),
    { label: 'Message', value: escapeHtml(fields.message || '—').replace(/\n/g, '<br>'), raw: true },
  ];
  const tableRows = rows.map(r => `
    <tr>
      <td style="padding: 10px 14px; font-weight: 600; color: #475569; vertical-align: top; width: 140px; border-bottom: 1px solid #E2E8F0;">${r.label}</td>
      <td style="padding: 10px 14px; color: #0F172A; border-bottom: 1px solid #E2E8F0;">${r.raw ? r.value : escapeHtml(r.value || '—')}</td>
    </tr>
  `).join('');
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #C9A227; margin: 0 0 8px; font-size: 22px;">New ${type === 'facility' ? 'Facility Inquiry' : 'Physician Application'}</h2>
      <p style="color: #64748B; margin: 0 0 24px; font-size: 14px;">Received on goldpmr.com</p>
      <table style="border-collapse: collapse; width: 100%; border: 1px solid #E2E8F0; font-size: 14px;">${tableRows}</table>
      <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">Reply directly to this email to respond to the submitter.</p>
    </div>
  `;
};

const sendNotification = async ({ type, fields, resumeUrl }) => {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Gold PM&R <noreply@goldpmr.com>',
        to: NOTIFY_TO,
        reply_to: fields.email,
        subject: `New ${type === 'facility' ? 'facility inquiry' : 'physician application'} from ${fields.name || 'unknown'}`,
        html: buildEmailHtml({ type, fields, resumeUrl }),
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend send failed:', res.status, errText);
    }
  } catch (e) {
    console.error('Resend send threw:', e);
  }
};

export default async function handler(req) {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let form;
  try {
    form = await req.formData();
  } catch {
    return json(400, { error: 'Invalid form data' });
  }

  const type = form.get('type');
  if (type !== 'facility' && type !== 'physician') {
    return json(400, { error: 'Invalid submission type' });
  }

  let resumePath = null;
  const resume = form.get('resume');
  if (resume && typeof resume !== 'string' && resume.size > 0) {
    const ext = (resume.name.split('.').pop() || 'pdf').toLowerCase();
    resumePath = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('resumes')
      .upload(resumePath, resume, { contentType: resume.type });
    if (upErr) return json(500, { error: `Upload failed: ${upErr.message}` });
  }

  const fields = {
    name: form.get('name') || null,
    email: form.get('email') || null,
    phone: form.get('phone') || null,
    org: form.get('org') || null,
    address: form.get('address') || null,
    message: form.get('message') || null,
  };

  const { error: insErr } = await supabase.from('submissions').insert({ type, ...fields, resume_path: resumePath });
  if (insErr) return json(500, { error: insErr.message });

  let resumeUrl = null;
  if (resumePath) {
    const { data } = await supabase.storage.from('resumes').createSignedUrl(resumePath, 60 * 60 * 24 * 7);
    resumeUrl = data?.signedUrl || null;
  }

  await sendNotification({ type, fields, resumeUrl });

  return json(200, { ok: true });
}
