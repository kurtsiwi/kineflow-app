-- KineFlow — ejercicios de ejemplo para ver el home con contenido.
-- Idempotente: vuelve a correrlo y solo actualiza las filas existentes.

insert into public.exercises
  (slug, name, description, category, body_area, difficulty, sets, reps, duration_seconds, image_url, video_url, published)
values
  ('puente-gluteo',
   'Puente de glúteo',
   'Acostado boca arriba con las rodillas flexionadas y los pies apoyados, eleva la pelvis contrayendo los glúteos hasta alinear cadera, rodillas y hombros. Baja de forma controlada sin dejar caer la zona lumbar.',
   'Fortalecimiento', 'Cadera y glúteos', 'principiante', 3, 12, null,
   'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
   null, true),

  ('plancha-frontal',
   'Plancha frontal',
   'Apoya antebrazos y puntas de los pies manteniendo el tronco recto y el abdomen activo. Evita hundir la zona lumbar y respira de forma continua durante todo el sostén.',
   'Estabilidad', 'Core', 'intermedio', 3, null, 30,
   'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
   null, true),

  ('estiramiento-isquiotibiales',
   'Estiramiento de isquiotibiales',
   'Sentado con una pierna extendida, lleva el tronco hacia adelante desde la cadera manteniendo la espalda recta hasta sentir tensión suave detrás del muslo. Sostén sin rebotes.',
   'Flexibilidad', 'Pierna posterior', 'principiante', 2, null, 45,
   'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80',
   null, true),

  ('rotacion-externa-hombro-banda',
   'Rotación externa de hombro con banda',
   'Con el codo pegado al costado y flexionado a 90°, rota el antebrazo hacia afuera contra la resistencia de la banda elástica. Vuelve lento, sin despegar el codo del cuerpo.',
   'Rehabilitación', 'Hombro', 'principiante', 3, 15, null,
   'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=1200&q=80',
   null, true),

  ('sentadilla-pared',
   'Sentadilla contra la pared',
   'Apoya la espalda en la pared y desliza hasta que las rodillas queden a 90°, con los pies separados al ancho de la cadera. Mantén la posición y sube controlando el movimiento.',
   'Fortalecimiento', 'Rodilla y cuádriceps', 'intermedio', 3, null, 40,
   'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=1200&q=80',
   null, true),

  ('movilidad-cervical',
   'Movilidad cervical',
   'Sentado y con los hombros relajados, realiza rotaciones e inclinaciones lentas de cabeza dentro del rango sin dolor. Nunca fuerces el final del recorrido.',
   'Movilidad', 'Cuello', 'principiante', 2, 10, null,
   'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
   null, true),

  ('equilibrio-unipodal',
   'Equilibrio en una pierna',
   'Párate sobre una pierna con la rodilla ligeramente flexionada y mantén el equilibrio. Progresa cerrando los ojos o apoyando sobre una superficie inestable.',
   'Propiocepción', 'Tobillo y pie', 'intermedio', 3, null, 30,
   'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1200&q=80',
   null, true),

  ('perro-pajaro',
   'Perro-pájaro',
   'En cuadrupedia, extiende simultáneamente el brazo derecho y la pierna izquierda sin rotar la pelvis. Alterna lados manteniendo el abdomen activo y la columna neutra.',
   'Estabilidad', 'Lumbar y core', 'intermedio', 3, 10, null,
   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
   null, false)
on conflict (slug) do update set
  name             = excluded.name,
  description      = excluded.description,
  category         = excluded.category,
  body_area        = excluded.body_area,
  difficulty       = excluded.difficulty,
  sets             = excluded.sets,
  reps             = excluded.reps,
  duration_seconds = excluded.duration_seconds,
  image_url        = excluded.image_url,
  video_url        = excluded.video_url,
  published        = excluded.published;
