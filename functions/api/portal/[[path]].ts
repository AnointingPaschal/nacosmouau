import { Env, currentUser, passwordHash, verifyPassword } from '../auth/_shared';
import { withStoredPaystackKey } from '../_secure';
import { duesForMember, dueStatus, levelApplies, type DuesItem } from '../_dues';
import { reconcilePaystack, applyPaymentSuccess, audit, tally, bankDetails, currentSession, duesAmountForUser, duesPaid, ensureMembership, fail, fileKey, json, pathOf, paystackInitialize, paystackReady, paystackVerify, randomId, readBody, text } from '../_portal';

type Me = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
const publicPhoto = (key: unknown) => (typeof key === 'string' && key ? `/api/files/${key}` : null);

async function profile(env: Env, user: Me) {
  return env.DB.prepare('SELECT u.id,u.email,u.full_name,u.phone,u.matric_number,u.academic_level,u.status,p.profile_photo_key FROM users u LEFT JOIN member_profiles p ON p.user_id=u.id WHERE u.id=?').bind(user.id).first<Record<string, unknown>>();
}

/** Dues state for the current session: paid, pending (awaiting approval), rejected or unpaid. */
async function duesState(env: Env, userId: string, session: string) {
  await reconcilePaystack(env, userId);
  return dueStatus(env, userId, 'dues', null, session);
}

async function overview(env: Env, user: Me) {
  const session = await currentSession(env);
  const [dues, amount, membership, events, elections, notices, me] = await Promise.all([
    duesState(env, user.id, session), duesAmountForUser(env, user.id), ensureMembership(env, user.id),
    env.DB.prepare('SELECT COUNT(*) n FROM event_registrations WHERE user_id=? OR email=?').bind(user.id, user.email).first<{ n: number }>(),
    env.DB.prepare("SELECT COUNT(*) n FROM elections WHERE status IN ('nominations','voting')").first<{ n: number }>(),
    env.DB.prepare("SELECT id,title,body,priority,published_at FROM announcements WHERE published_at IS NOT NULL AND (expires_at IS NULL OR expires_at>datetime('now')) ORDER BY published_at DESC LIMIT 3").all(),
    profile(env, user),
  ]);
  return json({ session, profile: { ...me, profile_photo_url: publicPhoto(me?.profile_photo_key), profile_photo_key: undefined }, membership, dues: { ...dues, amount_minor: amount }, counts: { events: events?.n ?? 0, open_elections: elections?.n ?? 0 }, notices: notices.results ?? [] });
}

async function digitalId(env: Env, user: Me) {
  const session = await currentSession(env);
  const [me, membership, paid] = await Promise.all([profile(env, user), ensureMembership(env, user.id), duesPaid(env, user.id, session)]);
  if (!me?.profile_photo_key) return json({ passport_required: true, full_name: me?.full_name });
  return json({ full_name: me?.full_name, matric_number: me?.matric_number, academic_level: me?.academic_level, status: me?.status, session, membership_id: membership?.membership_id ?? null, issued_at: membership?.started_at ?? null, dues_paid: paid, photo_url: me?.profile_photo_key ? `/api/files/${me.profile_photo_key}` : null });
}

async function applyForPosition(request: Request, env: Env, user: Me, electionId: string) {
  const election = await env.DB.prepare('SELECT status,form_fee_minor FROM elections WHERE id=?').bind(electionId).first<{ status: string; form_fee_minor: number }>();
  if (!election) return fail('Election not found.', 404);
  if (election.status !== 'nominations') return fail('Applications are not open for this election.', 409);
  const body = await readBody(request); const positionId = String(body?.position_id ?? '');
  const position = await env.DB.prepare('SELECT title,eligible_levels FROM election_positions WHERE id=? AND election_id=?').bind(positionId, electionId).first<{ title: string; eligible_levels: string | null }>();
  if (!position) return fail('Choose a position to contest for.');
  const me = await env.DB.prepare('SELECT u.full_name,u.academic_level,p.profile_photo_key FROM users u LEFT JOIN member_profiles p ON p.user_id=u.id WHERE u.id=?').bind(user.id).first<{ full_name: string; academic_level: string | null; profile_photo_key: string | null }>();
  if (position.eligible_levels && !(me?.academic_level && position.eligible_levels.split(',').includes(me.academic_level))) return fail(`${position.title} is open to ${position.eligible_levels.split(',').join(', ')} level members only.`, 403);
  if (await env.DB.prepare('SELECT 1 FROM election_candidates WHERE election_id=? AND user_id=?').bind(electionId, user.id).first()) return fail('You have already applied in this election.', 409);
  const id = randomId(); const status = election.form_fee_minor > 0 ? 'pending_payment' : 'pending_screening';
  await env.DB.prepare('INSERT INTO election_candidates(id,election_id,position_id,user_id,display_name,manifesto,photo_key,status) VALUES(?,?,?,?,?,?,?,?)')
    .bind(id, electionId, positionId, user.id, me?.full_name ?? 'Member', 'Manifesto to be provided.', me?.profile_photo_key ?? null, status).run();
  await audit(env, user.id, 'apply', 'election_candidates', id, { election: electionId, position: positionId });
  return json({ id, status }, 201);
}

async function withdrawCandidacy(env: Env, user: Me, id: string) {
  const row = await env.DB.prepare("SELECT c.status,e.status AS election_status,(SELECT COUNT(*) FROM payments p WHERE p.ref_id=c.id AND p.purpose='candidate_form' AND p.status IN ('pending','successful')) paid FROM election_candidates c JOIN elections e ON e.id=c.election_id WHERE c.id=? AND c.user_id=?").bind(id, user.id).first<{ status: string; election_status: string; paid: number }>();
  if (!row) return fail('Candidacy not found.', 404);
  if (row.election_status !== 'nominations' || row.paid > 0 || row.status !== 'pending_payment') return fail('You can only withdraw before paying for the form.', 409);
  await env.DB.prepare('DELETE FROM election_candidates WHERE id=?').bind(id).run();
  return json({ ok: true });
}

async function updateCandidacy(request: Request, env: Env, user: Me, id: string) {
  const row = await env.DB.prepare('SELECT c.status,e.status AS election_status FROM election_candidates c JOIN elections e ON e.id=c.election_id WHERE c.id=? AND c.user_id=?').bind(id, user.id).first<{ status: string; election_status: string }>();
  if (!row) return fail('Candidacy not found.', 404);
  if (!['draft', 'nominations'].includes(row.election_status) || row.status === 'rejected') return fail('You can no longer change this candidacy.', 409);
  const body = await readBody(request); const sets: string[] = []; const vals: unknown[] = [];
  if (typeof body?.manifesto === 'string') { const t = text(body.manifesto, 3000); if (t.length < 20) return fail('Write a manifesto of at least a few sentences.'); sets.push('manifesto=?'); vals.push(t); }
  if (typeof body?.photo_url === 'string' && body.photo_url) { const key = fileKey(body.photo_url); if (!key) return fail('Upload your passport with the file picker.'); sets.push('photo_key=?'); vals.push(key); }
  if (!sets.length) return fail('Nothing to update.');
  await env.DB.prepare(`UPDATE election_candidates SET ${sets.join(',')} WHERE id=?`).bind(...vals, id).run();
  await audit(env, user.id, 'update', 'election_candidates', id, { fields: sets.length });
  return json({ ok: true });
}

async function payments(env: Env, user: Me) {
  const session = await currentSession(env);
  await reconcilePaystack(env, user.id);
  const [rows, amount, bank, state] = await Promise.all([
    env.DB.prepare('SELECT id,reference,amount_minor,currency,status,purpose,session,method,ref_id,created_at,paid_at,review_note FROM payments WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(user.id).all(),
    duesAmountForUser(env, user.id), bankDetails(env), duesState(env, user.id, session),
  ]);
  const level = (await env.DB.prepare('SELECT academic_level FROM users WHERE id=?').bind(user.id).first<{ academic_level: string | null }>())?.academic_level ?? null;
  const items = await duesForMember(env, user.id, level);
  const payments = ((rows.results ?? []) as Array<Record<string, unknown>>);
  const titles = new Map((await env.DB.prepare('SELECT id,title FROM dues_items').all<{ id: string; title: string }>()).results?.map(r => [r.id, r.title]) ?? []);
  return json({ session, level, dues_amount_minor: amount, dues: state, dues_items: items, bank, paystack: paystackReady(env), payments: payments.map(p => ({ ...p, due_title: p.purpose === 'custom_due' ? titles.get(String(p.ref_id ?? '')) ?? 'Other dues' : null })) });
}

async function createPayment(request: Request, env: Env, user: Me) {
  const body = await readBody(request); if (!body) return fail('Invalid request body.');
  const purpose = body.purpose === 'candidate_form' ? 'candidate_form' : body.purpose === 'custom_due' ? 'custom_due' : 'dues';
  const method = body.method === 'transfer' ? 'transfer' : 'paystack';
  const session = await currentSession(env);
  let amount = 0; let refId: string | null = null;
  if (purpose === 'dues') {
    amount = await duesAmountForUser(env, user.id);
    if (!amount) return fail('NACOS dues have not been set for this session yet. Please check back soon.', 409);
    const existing = await duesState(env, user.id, session);
    if (existing.status === 'paid') return fail(`Your dues for ${session} are already paid.`, 409);
    if (existing.status === 'pending') return fail('Your bank transfer is awaiting approval.', 409);
    if (existing.status === 'confirming') return fail('Your Paystack payment is being confirmed. Please wait a minute and refresh.', 409);
  } else if (purpose === 'custom_due') {
    refId = text(body.refId, 80);
    const item = await env.DB.prepare('SELECT id,title,description,amount_minor,levels,session,due_date,is_active FROM dues_items WHERE id=?').bind(refId).first<DuesItem>();
    if (!item || !item.is_active || item.session !== session) return fail('These dues are not open for payment.', 404);
    const level = (await env.DB.prepare('SELECT academic_level FROM users WHERE id=?').bind(user.id).first<{ academic_level: string | null }>())?.academic_level ?? null;
    if (!levelApplies(item.levels, level)) return fail('These dues do not apply to your level.', 403);
    const existing = await dueStatus(env, user.id, 'custom_due', item.id, session);
    if (existing.status === 'paid') return fail('You have already paid these dues.', 409);
    if (existing.status === 'pending') return fail('Your bank transfer is awaiting approval.', 409);
    if (existing.status === 'confirming') return fail('Your Paystack payment is being confirmed. Please wait a minute and refresh.', 409);
    amount = item.amount_minor;
  } else {
    refId = text(body.refId, 80);
    const candidate = await env.DB.prepare('SELECT c.id,c.status,e.form_fee_minor,e.status AS election_status FROM election_candidates c JOIN elections e ON e.id=c.election_id WHERE c.id=? AND c.user_id=?').bind(refId, user.id).first<{ id: string; status: string; form_fee_minor: number; election_status: string }>();
    if (!candidate) return fail('Candidate form not found.', 404);
    if (candidate.status !== 'pending_payment') return fail('This candidate form has already been paid for or closed.', 409);
    amount = candidate.form_fee_minor;
    if (amount <= 0) return fail('This form has no fee.', 409);
  }
  const id = randomId(); const reference = `NMU-${Date.now().toString(36).toUpperCase()}-${randomId().slice(0, 6).toUpperCase()}`;
  if (method === 'transfer') {
    const proof = fileKey(body.proof_url);
    if (!proof) return fail('Upload a clear photo or PDF of your bank teller or transfer receipt.');
    const bank = await bankDetails(env); if (!bank.configured) return fail('Bank transfer details have not been set up yet.', 409);
    await env.DB.prepare("INSERT INTO payments(id,user_id,reference,amount_minor,currency,status,purpose,session,method,ref_id,proof_key,depositor_name) VALUES(?,?,?,?,'NGN','pending',?,?,'transfer',?,?,?)").bind(id, user.id, reference, amount, purpose, session, refId, proof, text(body.depositor_name, 120) || null).run();
    return json({ id, reference, status: 'pending', message: 'Teller submitted. An administrator will review it shortly.' }, 201);
  }
  if (!paystackReady(env)) return fail('Online payment is not available right now. Use bank transfer instead.', 503);
  await env.DB.prepare("INSERT INTO payments(id,user_id,reference,amount_minor,currency,status,purpose,session,method,ref_id) VALUES(?,?,?,?,'NGN','pending',?,?,'paystack',?)").bind(id, user.id, reference, amount, purpose, session, refId).run();
  try {
    const url = await paystackInitialize(env, { email: user.email, amount, reference, callback: `${new URL(request.url).origin}/portal/payments?reference=${reference}`, metadata: { purpose, session, payment_id: id } });
    return json({ id, reference, authorization_url: url }, 201);
  } catch (error) {
    await env.DB.prepare("UPDATE payments SET status='failed',review_note=? WHERE id=?").bind('Could not start Paystack checkout', id).run();
    return fail(error instanceof Error ? error.message : 'Paystack could not start the payment.', 502);
  }
}

async function verifyPayment(request: Request, env: Env, user: Me) {
  const body = await readBody(request); const reference = text(body?.reference, 80);
  const payment = await env.DB.prepare('SELECT id,amount_minor,status,method FROM payments WHERE reference=? AND user_id=?').bind(reference, user.id).first<{ id: string; amount_minor: number; status: string; method: string }>();
  if (!payment) return fail('Payment not found.', 404);
  if (payment.status === 'successful') return json({ status: 'successful' });
  if (payment.method !== 'paystack') return json({ status: payment.status });
  if (!paystackReady(env)) return fail('Online payment is not configured.', 503);
  const result = await paystackVerify(env, reference);
  if (result?.status === 'success' && result.amount === payment.amount_minor && result.currency === 'NGN') { await applyPaymentSuccess(env, payment.id); return json({ status: 'successful' }); }
  if (result && ['failed', 'abandoned', 'reversed'].includes(result.status)) await env.DB.prepare("UPDATE payments SET status='failed' WHERE id=? AND status='pending'").bind(payment.id).run();
  return json({ status: result?.status === 'success' ? 'mismatch' : 'pending', gateway: result?.status ?? 'unknown' });
}

async function electionList(env: Env, user: Me) {
  await reconcilePaystack(env, user.id);
  const session = await currentSession(env);
  const [{ results: elections = [] }, paid] = await Promise.all([
    env.DB.prepare("SELECT id,title,description,status,opens_at,closes_at,session,form_fee_minor,live_results FROM elections WHERE status<>'draft' ORDER BY created_at DESC").all<Record<string, unknown>>(),
    duesPaid(env, user.id, session),
  ]);
  const out = [];
  for (const election of elections) {
    const mine = await env.DB.prepare(`SELECT c.id,c.status,c.screening_note,c.display_name,c.manifesto,c.photo_key,p.title AS position,(SELECT CASE WHEN p2.status='pending' AND p2.method='paystack' THEN 'confirming' ELSE p2.status END FROM payments p2 WHERE p2.ref_id=c.id AND p2.purpose='candidate_form' ORDER BY (p2.status='successful') DESC,(p2.status='pending') DESC,p2.created_at DESC LIMIT 1) payment_status,(SELECT p3.review_note FROM payments p3 WHERE p3.ref_id=c.id AND p3.purpose='candidate_form' AND p3.status='failed' ORDER BY p3.created_at DESC LIMIT 1) payment_note FROM election_candidates c JOIN election_positions p ON p.id=c.position_id WHERE c.election_id=? AND c.user_id=?`).bind(election.id, user.id).all();
    const voted = await env.DB.prepare('SELECT 1 FROM election_voters WHERE election_id=? AND user_id=?').bind(election.id, user.id).first();
    out.push({ ...election, my_candidacies: (mine.results ?? []).map((c: Record<string, unknown>) => ({ ...c, photo_url: c.photo_key ? `/api/files/${c.photo_key}` : null, photo_key: undefined })), has_voted: Boolean(voted) });
  }
  return json({ session, dues_paid: paid, elections: out });
}

async function electionDetail(env: Env, user: Me, id: string) {
  await reconcilePaystack(env, user.id);
  const election = await env.DB.prepare("SELECT id,title,description,status,opens_at,closes_at,session,form_fee_minor,live_results FROM elections WHERE id=? AND status<>'draft'").bind(id).first<Record<string, unknown>>();
  if (!election) return fail('Election not found.', 404);
  const session = await currentSession(env);
  const [paid, voted, positions, candidates] = await Promise.all([
    duesPaid(env, user.id, session),
    env.DB.prepare('SELECT 1 FROM election_voters WHERE election_id=? AND user_id=?').bind(id, user.id).first(),
    env.DB.prepare('SELECT id,title,eligible_levels FROM election_positions WHERE election_id=? ORDER BY display_order,title').bind(id).all<{ id: string; title: string; eligible_levels: string | null }>(),
    env.DB.prepare("SELECT id,position_id,display_name,manifesto,photo_key FROM election_candidates WHERE election_id=? AND status='eligible' ORDER BY display_name").bind(id).all<Record<string, unknown>>(),
  ]);
  const now = new Date().toISOString();
  let reason = '';
  if (election.status !== 'voting') reason = election.status === 'closed' ? 'Voting has ended.' : 'Voting has not opened yet.';
  else if (election.opens_at && String(election.opens_at) > now) reason = 'Voting has not opened yet.';
  else if (election.closes_at && String(election.closes_at) < now) reason = 'Voting has ended.';
  else if (!paid) reason = `Only members who have paid ${session} NACOS dues can vote.`;
  else if (voted) reason = 'You have already voted in this election.';
  const grouped = (positions.results ?? []).map(p => ({ ...p, candidates: (candidates.results ?? []).filter(c => c.position_id === p.id).map(c => ({ id: c.id, display_name: c.display_name, manifesto: c.manifesto, photo_url: publicPhoto(c.photo_key) })) }));
  const [me, mine] = await Promise.all([
    env.DB.prepare('SELECT academic_level FROM users WHERE id=?').bind(user.id).first<{ academic_level: string | null }>(),
    env.DB.prepare(`SELECT c.id,c.position_id,c.status,c.screening_note,c.display_name,c.manifesto,c.photo_key,(SELECT CASE WHEN p2.status='pending' AND p2.method='paystack' THEN 'confirming' ELSE p2.status END FROM payments p2 WHERE p2.ref_id=c.id AND p2.purpose='candidate_form' ORDER BY (p2.status='successful') DESC,(p2.status='pending') DESC,p2.created_at DESC LIMIT 1) payment_status,(SELECT p3.review_note FROM payments p3 WHERE p3.ref_id=c.id AND p3.purpose='candidate_form' AND p3.status='failed' ORDER BY p3.created_at DESC LIMIT 1) payment_note FROM election_candidates c WHERE c.election_id=? AND c.user_id=?`).bind(id, user.id).all<Record<string, unknown>>(),
  ]);
  const out: Record<string, unknown> = {
    election, positions: grouped, can_vote: !reason, reason, has_voted: Boolean(voted), dues_paid: paid,
    can_apply: election.status === 'nominations', my_level: me?.academic_level ?? null,
    my_candidacies: (mine.results ?? []).map(c => ({ ...c, photo_url: publicPhoto(c.photo_key), photo_key: undefined })),
  };
  if (election.status === 'closed') out.results = await tally(env, id);
  return json(out);
}

async function vote(request: Request, env: Env, user: Me, id: string) {
  const body = await readBody(request); const selections = body?.selections as Record<string, string> | undefined;
  if (!selections || typeof selections !== 'object') return fail('Choose your candidates before submitting.');
  const election = await env.DB.prepare('SELECT status,opens_at,closes_at FROM elections WHERE id=?').bind(id).first<{ status: string; opens_at: string | null; closes_at: string | null }>();
  const now = new Date().toISOString();
  if (!election || election.status !== 'voting' || (election.opens_at && election.opens_at > now) || (election.closes_at && election.closes_at < now)) return fail('Voting is not open for this election.', 409);
  const session = await currentSession(env);
  if (!(await duesPaid(env, user.id, session))) return fail(`Only members who have paid ${session} NACOS dues can vote.`, 403);
  if (await env.DB.prepare('SELECT 1 FROM election_voters WHERE election_id=? AND user_id=?').bind(id, user.id).first()) return fail('You have already voted in this election.', 409);
  const positions = await env.DB.prepare('SELECT id FROM election_positions WHERE election_id=?').bind(id).all<{ id: string }>();
  const eligible = await env.DB.prepare("SELECT id,position_id FROM election_candidates WHERE election_id=? AND status='eligible'").bind(id).all<{ id: string; position_id: string }>();
  const clean: Record<string, string> = {};
  for (const position of positions.results ?? []) {
    const options = (eligible.results ?? []).filter(c => c.position_id === position.id);
    if (!options.length) continue; // nothing to vote on for this position
    const choice = selections[position.id];
    if (!choice) continue; // abstain
    if (!options.some(c => c.id === choice)) return fail('One of your selections is not a valid candidate.');
    clean[position.id] = choice;
  }
  if (!Object.keys(clean).length) return fail('Select at least one candidate to cast your vote.');
  try {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO election_voters(id,election_id,user_id) VALUES(?,?,?)').bind(randomId(), id, user.id),
      env.DB.prepare('INSERT INTO election_ballots(id,election_id,encrypted_selections) VALUES(?,?,?)').bind(randomId(), id, JSON.stringify(clean)),
    ]);
  } catch { return fail('You have already voted in this election.', 409); }
  return json({ ok: true, message: 'Your vote has been recorded. Thank you for voting.' }, 201);
}

export const onRequest: PagesFunction<Env> = async ({ request, env: baseEnv, params }) => {
  const env = await withStoredPaystackKey(baseEnv);
  const user = await currentUser(request, env).catch(() => null);
  if (!user || user.status !== 'active') return fail('Sign in with an active member account to continue.', 401);
  const path = pathOf(params as Record<string, string | string[]>); const [a, b, c] = path; const method = request.method;
  try {
    if (a === 'overview' && method === 'GET') return await overview(env, user);
    if (a === 'id' && method === 'GET') return await digitalId(env, user);
    if (a === 'payments' && !b && method === 'GET') return await payments(env, user);
    if (a === 'payments' && !b && method === 'POST') return await createPayment(request, env, user);
    if (a === 'payments' && b === 'verify' && method === 'POST') return await verifyPayment(request, env, user);
    if (a === 'elections' && b && c === 'apply' && method === 'POST') return await applyForPosition(request, env, user, b);
    if (a === 'candidacy' && b && c === 'withdraw' && method === 'POST') return await withdrawCandidacy(env, user, b);
    if (a === 'candidacy' && b && method === 'POST') return await updateCandidacy(request, env, user, b);
    if (a === 'elections' && !b && method === 'GET') return await electionList(env, user);
    if (a === 'elections' && b && !c && method === 'GET') return await electionDetail(env, user, b);
    if (a === 'elections' && b && c === 'results' && method === 'GET') {
      const el = await env.DB.prepare("SELECT status,live_results FROM elections WHERE id=? AND status<>'draft'").bind(b).first<{ status: string; live_results: number }>();
      if (!el) return fail('Election not found.', 404);
      if (!(el.status === 'closed' || (el.status === 'voting' && el.live_results === 1))) return fail('Results are not available to members yet.', 403);
      return json({ ...(await tally(env, b)), status: el.status, live: el.status === 'voting' });
    }
    if (a === 'elections' && b && c === 'vote' && method === 'POST') return await vote(request, env, user, b);
    if (a === 'events' && method === 'GET') {
      const rows = await env.DB.prepare('SELECT r.id,r.status,r.created_at,e.title,e.slug,e.starts_at,e.venue,e.image_key,(SELECT ticket_code FROM event_tickets t WHERE t.registration_id=r.id LIMIT 1) ticket_code FROM event_registrations r JOIN events e ON e.id=r.event_id WHERE r.user_id=? OR r.email=? ORDER BY e.starts_at DESC').bind(user.id, user.email).all<Record<string, unknown>>();
      return json((rows.results ?? []).map(r => ({ ...r, image_url: publicPhoto(r.image_key), image_key: undefined })));
    }
    if (a === 'welfare' && method === 'GET') return json((await env.DB.prepare('SELECT id,category,subject,details,status,response,created_at FROM welfare_requests WHERE user_id=? ORDER BY created_at DESC').bind(user.id).all()).results ?? []);
    if (a === 'welfare' && method === 'POST') {
      const body = await readBody(request); const subject = text(body?.subject, 160); const details = text(body?.details, 4000); const category = text(body?.category, 60) || 'General';
      if (subject.length < 3 || details.length < 10) return fail('Add a subject and describe your request in a few words.');
      const id = randomId(); await env.DB.prepare('INSERT INTO welfare_requests(id,user_id,category,subject,details,confidential) VALUES(?,?,?,?,?,1)').bind(id, user.id, category, subject, details).run();
      return json({ id }, 201);
    }
    if (a === 'documents' && method === 'GET') {
      const rows = await env.DB.prepare("SELECT id,title,description,category,object_key,visibility,published_at FROM documents WHERE published_at IS NOT NULL ORDER BY published_at DESC").all<Record<string, unknown>>();
      return json((rows.results ?? []).map(d => ({ ...d, file_url: `/api/files/${d.object_key}`, object_key: undefined })));
    }
    if (a === 'password' && method === 'PUT') {
      const body = await readBody(request); const current = String(body?.current ?? ''); const next = String(body?.next ?? '');
      if (next.length < 12 || next.length > 200) return fail('Choose a new password of at least 12 characters.');
      const row = await env.DB.prepare('SELECT password_hash FROM users WHERE id=?').bind(user.id).first<{ password_hash: string }>();
      if (!row || !(await verifyPassword(current, row.password_hash))) return fail('Your current password is incorrect.', 403);
      await env.DB.prepare("UPDATE users SET password_hash=?,updated_at=datetime('now') WHERE id=?").bind(await passwordHash(next), user.id).run();
      await audit(env, user.id, 'update', 'password', user.id);
      return json({ ok: true });
    }
    return fail('Not found.', 404);
  } catch (error) {
    console.error('Portal request failed:', error);
    return fail('Something went wrong while loading this page. Please try again.', 500);
  }
};
