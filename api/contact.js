import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

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

  const { error: insErr } = await supabase.from('submissions').insert({
    type,
    name: form.get('name') || null,
    email: form.get('email') || null,
    phone: form.get('phone') || null,
    org: form.get('org') || null,
    address: form.get('address') || null,
    message: form.get('message') || null,
    resume_path: resumePath,
  });
  if (insErr) return json(500, { error: insErr.message });

  return json(200, { ok: true });
}
