insert into auth.users (
  id,
  aud,
  role,
  email,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'atlas@example.com',
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Atlas"}',
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'nova@example.com',
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Nova"}',
    timezone('utc', now()),
    timezone('utc', now())
  )
on conflict (id) do update
set
  email = excluded.email,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

insert into public.profiles (id, display_name, avatar_url)
values
  ('11111111-1111-1111-1111-111111111111', 'Atlas', null),
  ('22222222-2222-2222-2222-222222222222', 'Nova', null)
on conflict (id) do update
set
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url;

with bubble_seed (id, owner_id, title, x, y, width, height, created_offset, updated_offset) as (
  values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Late-night shipping club', -320, -120, 220, 160, interval '2 hours', interval '8 minutes'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Design critique lagoon', 340, 110, 240, 170, interval '5 hours', interval '22 minutes'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Founders walking circle', 1200, -540, 200, 140, interval '1 day', interval '75 minutes'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Quiet reading cove', -1240, 760, 180, 130, interval '8 hours', interval '3 hours'),
    ('f0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Stockholm fika', -760, -280, 196, 132, interval '6 days 2 hours', interval '12 minutes'),
    ('f0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Madrid terrace', -520, -210, 208, 138, interval '6 days 1 hour', interval '18 minutes'),
    ('f0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Paris pluie', -880, -60, 206, 140, interval '5 days 20 hours', interval '24 minutes'),
    ('f0000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Berlin night notes', -620, 20, 214, 144, interval '5 days 18 hours', interval '32 minutes'),
    ('f0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Roma sunset', -980, 180, 192, 130, interval '5 days 16 hours', interval '40 minutes'),
    ('f0000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'Lisbon tide', -720, 240, 200, 136, interval '5 days 12 hours', interval '52 minutes'),
    ('f0000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Amsterdam lane', -460, 100, 210, 142, interval '5 days 10 hours', interval '68 minutes'),
    ('f0000000-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 'Oslo window', -300, 260, 188, 128, interval '5 days 8 hours', interval '84 minutes'),
    ('f0000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Copenhagen table', -1080, 340, 212, 146, interval '5 days 6 hours', interval '96 minutes'),
    ('f0000000-0000-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', 'Helsinki snow', -540, 420, 204, 140, interval '5 days 4 hours', interval '108 minutes'),
    ('f0000000-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Warsaw tram', 420, -360, 198, 134, interval '4 days 22 hours', interval '20 minutes'),
    ('f0000000-0000-0000-0000-000000000012', '22222222-2222-2222-2222-222222222222', 'Prague corner', 660, -300, 208, 140, interval '4 days 20 hours', interval '28 minutes'),
    ('f0000000-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'Bratislava bench', 880, -180, 194, 132, interval '4 days 18 hours', interval '36 minutes'),
    ('f0000000-0000-0000-0000-000000000014', '22222222-2222-2222-2222-222222222222', 'Bucharest cafe', 560, -40, 216, 148, interval '4 days 16 hours', interval '44 minutes'),
    ('f0000000-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'Budapest river', 300, 60, 190, 126, interval '4 days 14 hours', interval '58 minutes'),
    ('f0000000-0000-0000-0000-000000000016', '22222222-2222-2222-2222-222222222222', 'Athens steps', 760, 120, 218, 150, interval '4 days 12 hours', interval '72 minutes'),
    ('f0000000-0000-0000-0000-000000000017', '11111111-1111-1111-1111-111111111111', 'Istanbul roof', 980, 260, 202, 138, interval '4 days 10 hours', interval '88 minutes'),
    ('f0000000-0000-0000-0000-000000000018', '22222222-2222-2222-2222-222222222222', 'Cairo lantern', 460, 260, 214, 144, interval '4 days 8 hours', interval '102 minutes'),
    ('f0000000-0000-0000-0000-000000000019', '11111111-1111-1111-1111-111111111111', 'Jerusalem stone', 220, 220, 196, 134, interval '4 days 6 hours', interval '118 minutes'),
    ('f0000000-0000-0000-0000-000000000020', '22222222-2222-2222-2222-222222222222', 'Delhi chai', 1040, 40, 206, 142, interval '4 days 4 hours', interval '134 minutes'),
    ('f0000000-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111', 'Dhaka rain', -1380, 920, 212, 146, interval '3 days 22 hours', interval '26 minutes'),
    ('f0000000-0000-0000-0000-000000000022', '22222222-2222-2222-2222-222222222222', 'Lahore evening', -1140, 840, 198, 134, interval '3 days 20 hours', interval '34 minutes'),
    ('f0000000-0000-0000-0000-000000000023', '11111111-1111-1111-1111-111111111111', 'Chennai coast', -900, 760, 206, 138, interval '3 days 18 hours', interval '46 minutes'),
    ('f0000000-0000-0000-0000-000000000024', '22222222-2222-2222-2222-222222222222', 'Hyderabad hub', -680, 880, 214, 144, interval '3 days 16 hours', interval '55 minutes'),
    ('f0000000-0000-0000-0000-000000000025', '11111111-1111-1111-1111-111111111111', 'Bangkok alley', -1260, 1120, 192, 130, interval '3 days 14 hours', interval '64 minutes'),
    ('f0000000-0000-0000-0000-000000000026', '22222222-2222-2222-2222-222222222222', 'Saigon scooters', -980, 1040, 220, 150, interval '3 days 12 hours', interval '78 minutes'),
    ('f0000000-0000-0000-0000-000000000027', '11111111-1111-1111-1111-111111111111', 'Jakarta late hour', -760, 1180, 204, 136, interval '3 days 10 hours', interval '90 minutes'),
    ('f0000000-0000-0000-0000-000000000028', '22222222-2222-2222-2222-222222222222', 'Kuala Lumpur after rain', -560, 980, 210, 142, interval '3 days 8 hours', interval '104 minutes'),
    ('f0000000-0000-0000-0000-000000000029', '11111111-1111-1111-1111-111111111111', 'Manila crossing', -1180, 1320, 196, 134, interval '3 days 6 hours', interval '118 minutes'),
    ('f0000000-0000-0000-0000-000000000030', '22222222-2222-2222-2222-222222222222', 'Tokyo quiet line', -860, 1380, 216, 148, interval '3 days 4 hours', interval '132 minutes'),
    ('f0000000-0000-0000-0000-000000000031', '11111111-1111-1111-1111-111111111111', 'Seoul rooftop', 720, 620, 202, 138, interval '2 days 22 hours', interval '16 minutes'),
    ('f0000000-0000-0000-0000-000000000032', '22222222-2222-2222-2222-222222222222', 'Shanghai pulse', 940, 520, 208, 140, interval '2 days 20 hours', interval '24 minutes'),
    ('f0000000-0000-0000-0000-000000000033', '11111111-1111-1111-1111-111111111111', 'Taipei night market', 1180, 620, 214, 144, interval '2 days 18 hours', interval '32 minutes'),
    ('f0000000-0000-0000-0000-000000000034', '22222222-2222-2222-2222-222222222222', 'Kyiv sunrise', 1420, 760, 198, 134, interval '2 days 16 hours', interval '40 minutes'),
    ('f0000000-0000-0000-0000-000000000035', '11111111-1111-1111-1111-111111111111', 'Moscow ring', 980, 860, 210, 142, interval '2 days 14 hours', interval '52 minutes'),
    ('f0000000-0000-0000-0000-000000000036', '22222222-2222-2222-2222-222222222222', 'Belgrade block', 1240, 980, 192, 130, interval '2 days 12 hours', interval '64 minutes'),
    ('f0000000-0000-0000-0000-000000000037', '11111111-1111-1111-1111-111111111111', 'Zagreb square', 1520, 980, 220, 150, interval '2 days 10 hours', interval '76 minutes'),
    ('f0000000-0000-0000-0000-000000000038', '22222222-2222-2222-2222-222222222222', 'Vilnius morning', 760, 1040, 204, 136, interval '2 days 8 hours', interval '88 minutes'),
    ('f0000000-0000-0000-0000-000000000039', '11111111-1111-1111-1111-111111111111', 'Riga line', 1100, 1180, 214, 144, interval '2 days 6 hours', interval '104 minutes'),
    ('f0000000-0000-0000-0000-000000000040', '22222222-2222-2222-2222-222222222222', 'Tallinn harbor', 1360, 1220, 196, 132, interval '2 days 4 hours', interval '120 minutes')
)
insert into public.bubbles (id, owner_id, title, x, y, width, height, created_at, updated_at)
select
  id::uuid,
  owner_id::uuid,
  title,
  x,
  y,
  width,
  height,
  timezone('utc', now()) - created_offset,
  timezone('utc', now()) - updated_offset
from bubble_seed
on conflict (id) do update
set
  title = excluded.title,
  x = excluded.x,
  y = excluded.y,
  width = excluded.width,
  height = excluded.height,
  updated_at = excluded.updated_at;

with message_seed (id, bubble_id, user_id, content, created_offset) as (
  values
    ('e1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'What are you shipping before sunrise this week?', interval '24 minutes'),
    ('e2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'A tiny social map, actually. I wanted conversations to feel place-based.', interval '18 minutes'),
    ('e3333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Drop your homepage screenshots and tell me what feels flat.', interval '50 minutes'),
    ('e4444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Warm palette, strong vibe, but the CTA probably needs more contrast.', interval '31 minutes'),
    ('e5555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Pitch the weirdest company idea you would still back.', interval '2 hours'),
    ('e6666666-6666-6666-6666-666666666666', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'This bubble is for lurkers, readers, and people who just want to listen.', interval '95 minutes'),
    ('f1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Vad bygger du den här veckan?', interval '12 minutes'),
    ('f1000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Esta semana quiero conversar más lento y con calma.', interval '18 minutes'),
    ('f1000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'On se retrouve ici pour partager une petite idée.', interval '24 minutes'),
    ('f1000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Heute schreibe ich einen Gedanken direkt auf die Karte.', interval '32 minutes'),
    ('f1000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Qui lasciamo pensieri brevi e sinceri.', interval '40 minutes'),
    ('f1000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'Hoje só quero encontrar pessoas curiosas por aqui.', interval '52 minutes'),
    ('f1000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Ik laat hier een klein idee achter voor later.', interval '68 minutes'),
    ('f1000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 'Hva snakker folk om i kveld?', interval '84 minutes'),
    ('f1000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Hvad fylder mest i dit hoved i dag?', interval '96 minutes'),
    ('f1000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', 'Mitä jos jokainen kupla on pieni tervehdys?', interval '108 minutes'),
    ('f1000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Co budujesz w tym tygodniu?', interval '20 minutes'),
    ('f1000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000012', '22222222-2222-2222-2222-222222222222', 'Co dneska chceš vypustit do světa?', interval '28 minutes'),
    ('f1000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'Čo by si sem napísal práve teraz?', interval '36 minutes'),
    ('f1000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000014', '22222222-2222-2222-2222-222222222222', 'Las aici un gând mic pentru cine trece.', interval '44 minutes'),
    ('f1000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'Ma csak egy rövid üzenetet hagyok itt.', interval '58 minutes'),
    ('f1000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000016', '22222222-2222-2222-2222-222222222222', 'Αφησε εδώ μια μικρή σκέψη για τους επόμενους.', interval '72 minutes'),
    ('f1000000-0000-0000-0000-000000000017', 'f0000000-0000-0000-0000-000000000017', '11111111-1111-1111-1111-111111111111', 'Bugün buraya kısa bir not bırakıyorum.', interval '88 minutes'),
    ('f1000000-0000-0000-0000-000000000018', 'f0000000-0000-0000-0000-000000000018', '22222222-2222-2222-2222-222222222222', 'هنا نترك فكرة صغيرة ونكمل الطريق.', interval '102 minutes'),
    ('f1000000-0000-0000-0000-000000000019', 'f0000000-0000-0000-0000-000000000019', '11111111-1111-1111-1111-111111111111', 'כאן משאירים משפט קטן וממשיכים הלאה.', interval '118 minutes'),
    ('f1000000-0000-0000-0000-000000000020', 'f0000000-0000-0000-0000-000000000020', '22222222-2222-2222-2222-222222222222', 'यहां बस एक छोटा सा विचार छोड़ दो।', interval '134 minutes'),
    ('f1000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111', 'এখানে শুধু একটুখানি কথা রেখে যাই।', interval '26 minutes'),
    ('f1000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-000000000022', '22222222-2222-2222-2222-222222222222', 'یہاں بس ایک چھوٹی سی بات چھوڑ دو۔', interval '34 minutes'),
    ('f1000000-0000-0000-0000-000000000023', 'f0000000-0000-0000-0000-000000000023', '11111111-1111-1111-1111-111111111111', 'இங்கே ஒரு சிறிய எண்ணம் விட்டு செல்லலாம்.', interval '46 minutes'),
    ('f1000000-0000-0000-0000-000000000024', 'f0000000-0000-0000-0000-000000000024', '22222222-2222-2222-2222-222222222222', 'ఇక్కడ ఒక చిన్న ఆలోచన వదిలి వెళ్దాం.', interval '55 minutes'),
    ('f1000000-0000-0000-0000-000000000025', 'f0000000-0000-0000-0000-000000000025', '11111111-1111-1111-1111-111111111111', 'ฝากความคิดสั้น ๆ ไว้ตรงนี้ได้เลย', interval '64 minutes'),
    ('f1000000-0000-0000-0000-000000000026', 'f0000000-0000-0000-0000-000000000026', '22222222-2222-2222-2222-222222222222', 'Để lại một ý nhỏ rồi đi tiếp.', interval '78 minutes'),
    ('f1000000-0000-0000-0000-000000000027', 'f0000000-0000-0000-0000-000000000027', '11111111-1111-1111-1111-111111111111', 'Tinggalkan satu kalimat kecil di sini.', interval '90 minutes'),
    ('f1000000-0000-0000-0000-000000000028', 'f0000000-0000-0000-0000-000000000028', '22222222-2222-2222-2222-222222222222', 'Tinggalkan satu fikiran ringkas di sini.', interval '104 minutes'),
    ('f1000000-0000-0000-0000-000000000029', 'f0000000-0000-0000-0000-000000000029', '11111111-1111-1111-1111-111111111111', 'Mag iwan ka lang ng maikling mensahe dito.', interval '118 minutes'),
    ('f1000000-0000-0000-0000-000000000030', 'f0000000-0000-0000-0000-000000000030', '22222222-2222-2222-2222-222222222222', 'ここに短いひとことを置いていこう。', interval '132 minutes'),
    ('f1000000-0000-0000-0000-000000000031', 'f0000000-0000-0000-0000-000000000031', '11111111-1111-1111-1111-111111111111', '여기에 짧은 생각 하나 남기고 가요.', interval '16 minutes'),
    ('f1000000-0000-0000-0000-000000000032', 'f0000000-0000-0000-0000-000000000032', '22222222-2222-2222-2222-222222222222', '在这里留下一句小小的话。', interval '24 minutes'),
    ('f1000000-0000-0000-0000-000000000033', 'f0000000-0000-0000-0000-000000000033', '11111111-1111-1111-1111-111111111111', '在這裡留下一句小小的話。', interval '32 minutes'),
    ('f1000000-0000-0000-0000-000000000034', 'f0000000-0000-0000-0000-000000000034', '22222222-2222-2222-2222-222222222222', 'Залиш тут коротку думку для наступного гостя.', interval '40 minutes'),
    ('f1000000-0000-0000-0000-000000000035', 'f0000000-0000-0000-0000-000000000035', '11111111-1111-1111-1111-111111111111', 'Оставь здесь короткую мысль и иди дальше.', interval '52 minutes'),
    ('f1000000-0000-0000-0000-000000000036', 'f0000000-0000-0000-0000-000000000036', '22222222-2222-2222-2222-222222222222', 'Ostavi ovde kratku misao i nastavi dalje.', interval '64 minutes'),
    ('f1000000-0000-0000-0000-000000000037', 'f0000000-0000-0000-0000-000000000037', '11111111-1111-1111-1111-111111111111', 'Ovdje ostavi kratku poruku za sljedećeg prolaznika.', interval '76 minutes'),
    ('f1000000-0000-0000-0000-000000000038', 'f0000000-0000-0000-0000-000000000038', '22222222-2222-2222-2222-222222222222', 'Palik čia mažą mintį kitam lankytojui.', interval '88 minutes'),
    ('f1000000-0000-0000-0000-000000000039', 'f0000000-0000-0000-0000-000000000039', '11111111-1111-1111-1111-111111111111', 'Atstāj šeit mazu domu nākamajam garāmgājējam.', interval '104 minutes'),
    ('f1000000-0000-0000-0000-000000000040', 'f0000000-0000-0000-0000-000000000040', '22222222-2222-2222-2222-222222222222', 'Jäta siia väike mõte järgmisele möödujale.', interval '120 minutes')
)
insert into public.messages (id, bubble_id, user_id, content, created_at)
select
  id::uuid,
  bubble_id::uuid,
  user_id::uuid,
  content,
  timezone('utc', now()) - created_offset
from message_seed
on conflict (id) do update
set
  bubble_id = excluded.bubble_id,
  user_id = excluded.user_id,
  content = excluded.content,
  created_at = excluded.created_at;
