insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  confirmed_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'atlas@example.com',
    crypt('password123', gen_salt('bf')),
    timezone('utc', now()),
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Atlas"}',
    false,
    timezone('utc', now()),
    timezone('utc', now()),
    null,
    null,
    '',
    '',
    null,
    timezone('utc', now()),
    '',
    0,
    null,
    '',
    null,
    false,
    null
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'nova@example.com',
    crypt('password123', gen_salt('bf')),
    timezone('utc', now()),
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Nova"}',
    false,
    timezone('utc', now()),
    timezone('utc', now()),
    null,
    null,
    '',
    '',
    null,
    timezone('utc', now()),
    '',
    0,
    null,
    '',
    null,
    false,
    null
  )
on conflict (id) do nothing;

insert into public.profiles (id, display_name, avatar_url)
values
  ('11111111-1111-1111-1111-111111111111', 'Atlas', null),
  ('22222222-2222-2222-2222-222222222222', 'Nova', null)
on conflict (id) do update
set
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url;

insert into public.bubbles (id, owner_id, title, x, y, width, height, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Late-night shipping club', -320, -120, 220, 160, timezone('utc', now()) - interval '2 hours', timezone('utc', now()) - interval '8 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Design critique lagoon', 340, 110, 240, 170, timezone('utc', now()) - interval '5 hours', timezone('utc', now()) - interval '22 minutes'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Founders walking circle', 1200, -540, 200, 140, timezone('utc', now()) - interval '1 day', timezone('utc', now()) - interval '75 minutes'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Quiet reading cove', -1240, 760, 180, 130, timezone('utc', now()) - interval '8 hours', timezone('utc', now()) - interval '3 hours')
on conflict (id) do update
set
  title = excluded.title,
  x = excluded.x,
  y = excluded.y,
  width = excluded.width,
  height = excluded.height,
  updated_at = excluded.updated_at;

insert into public.messages (id, bubble_id, user_id, content, created_at)
values
  ('e1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'What are you shipping before sunrise this week?', timezone('utc', now()) - interval '24 minutes'),
  ('e2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'A tiny social map, actually. I wanted conversations to feel place-based.', timezone('utc', now()) - interval '18 minutes'),
  ('e3333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Drop your homepage screenshots and tell me what feels flat.', timezone('utc', now()) - interval '50 minutes'),
  ('e4444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Warm palette, strong vibe, but the CTA probably needs more contrast.', timezone('utc', now()) - interval '31 minutes'),
  ('e5555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Pitch the weirdest company idea you would still back.', timezone('utc', now()) - interval '2 hours'),
  ('e6666666-6666-6666-6666-666666666666', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'This bubble is for lurkers, readers, and people who just want to listen.', timezone('utc', now()) - interval '95 minutes')
on conflict (id) do nothing;
