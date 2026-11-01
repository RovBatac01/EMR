import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  HeartPulse,
  MapPin,
  Megaphone,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound
} from 'lucide-react';

import { api, apiOrigin } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import Alert from '../../components/Alert';

const mediaUrl = (value) => {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${apiOrigin}${value}`;
};

const readableDate = (value) => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(value));
};

function CtaLink({ to, className, children }) {
  const destination = to || '#';

  const useAnchor =
    destination.startsWith('#') ||
    destination.startsWith('http://') ||
    destination.startsWith('https://') ||
    destination.startsWith('mailto:') ||
    destination.startsWith('tel:');

  if (useAnchor) {
    return (
      <a
        href={destination}
        className={className}
        target={
          destination.startsWith('http://') ||
          destination.startsWith('https://')
            ? '_blank'
            : undefined
        }
        rel={
          destination.startsWith('http://') ||
          destination.startsWith('https://')
            ? 'noreferrer'
            : undefined
        }
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={destination} className={className}>
      {children}
    </Link>
  );
}

function PostCard({ item }) {
  const coverAltText =
    item.media?.find((entry) => Number(entry.is_cover) === 1)?.alt_text ||
    item.title;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-sm transition hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
    >
      <Link to={`/announcements/${item.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-emerald-50 dark:bg-slate-800">
          {item.cover_image_path ? (
            <img
              src={mediaUrl(item.cover_image_path)}
              alt={coverAltText}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-kld-700">
              <Megaphone size={46} />
            </div>
          )}

          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-black uppercase tracking-wider text-kld-800 shadow-sm dark:bg-slate-950/90 dark:text-emerald-300">
            {item.section_type === 'PROMOTION'
              ? 'Promotion'
              : 'Announcement'}
          </span>
        </div>

        <div className="p-6">
          <time className="text-xs font-bold uppercase tracking-[0.14em] text-kld-700 dark:text-emerald-300">
            {readableDate(
              item.publication_date ||
                item.publish_from ||
                item.created_at
            )}
          </time>

          <h3 className="mt-2 text-xl font-black text-slate-950 group-hover:text-kld-700 dark:text-white dark:group-hover:text-emerald-300">
            {item.title}
          </h3>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {item.summary ||
              item.body ||
              'Open this post for complete information.'}
          </p>

          <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-kld-700 dark:text-emerald-300">
            Read full post
            <ArrowRight size={16} />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

function ServiceCard({
  title,
  description,
  duration,
  capacity
}) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-kld-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        <HeartPulse />
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {description ||
          'School clinic assessment and appropriate health support.'}
      </p>

      {(duration || capacity) && (
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
          {duration && (
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              {duration} minutes
            </span>
          )}

          {capacity && (
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              Capacity {capacity}
            </span>
          )}
        </div>
      )}
    </motion.article>
  );
}

export default function LandingPage() {
  const { settings } = useSettings();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    api
      .get('/public/landing')
      .then(({ data: response }) => {
        if (!active) {
          return;
        }

        setData(response.data);
        setError('');
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
              requestError.message ||
              'Unable to load the clinic landing page.'
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const sections = {
      ANNOUNCEMENT: [],
      PROMOTION: [],
      SERVICE: [],
      TEAM: []
    };

    for (const row of data?.items || []) {
      sections[row.section_type]?.push(row);
    }

    return sections;
  }, [data]);

  const posts = useMemo(() => {
    return [
      ...grouped.ANNOUNCEMENT,
      ...grouped.PROMOTION
    ]
      .sort(
        (a, b) =>
          new Date(
            b.publication_date ||
              b.publish_from ||
              b.created_at
          ) -
          new Date(
            a.publication_date ||
              a.publish_from ||
              a.created_at
          )
      )
      .slice(0, 6);
  }, [grouped]);

  const config = data?.config || {};

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <PublicHeader />

      <main>
        {/* =========================================================
            FULL-SCREEN HERO
        ========================================================== */}
        <section
          id="home"
          className="relative isolate flex min-h-[calc(100svh-76px)] items-center overflow-hidden bg-kld-950 text-white"
        >
          {/* Hero image or video fills the complete section */}
          {config.hero_media_type === 'VIDEO' &&
          config.hero_media_path ? (
            <video
              key={config.hero_media_path}
              className="absolute inset-0 h-full w-full object-cover object-center"
              autoPlay
              muted
              loop
              controls
              playsInline
              preload="metadata"
              poster={mediaUrl(config.hero_fallback_path)}
              aria-label="Clinic introduction video"
            >
              <source src={mediaUrl(config.hero_media_path)} />
              Your browser does not support the clinic video.
            </video>
          ) : config.hero_media_type === 'IMAGE' &&
            config.hero_media_path ? (
            <img
              src={mediaUrl(config.hero_media_path)}
              alt={`${settings.clinic_name || 'School Clinic'} hero`}
              className="absolute inset-0 h-full w-full object-cover object-center"
              fetchPriority="high"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-kld-950 via-kld-800 to-emerald-950" />
          )}

          {/* Readability overlays */}
          <div className="pointer-events-none absolute inset-0 bg-black/35" />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20" />

          {/* Subtle decorative lighting */}
          <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-emerald-500/15 blur-[100px]" />

          <div className="pointer-events-none absolute -right-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-yellow-300/10 blur-[120px]" />

          {/* Hero content */}
          <div className="pointer-events-none relative z-10 mx-auto flex min-h-[calc(100svh-76px)] w-full max-w-7xl items-center px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
            <motion.div
              initial={{
                opacity: 0,
                y: 24
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                duration: 0.55
              }}
              className="pointer-events-auto max-w-3xl"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/20 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg backdrop-blur-md">
                <Sparkles size={15} />
                Health support for the KLD community
              </span>

              <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.04] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] sm:text-5xl md:text-6xl lg:text-7xl">
                {config.hero_heading ||
                  settings.clinic_name ||
                  'KLD School Clinic'}
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/85 drop-shadow sm:text-lg lg:text-xl">
                {config.hero_description ||
                  'Accessible, confidential, and coordinated healthcare support for students and employees.'}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <CtaLink
                  to={
                    config.primary_cta_url ||
                    '/student/appointments'
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A5C36] px-6 py-3.5 text-sm font-black text-white shadow-xl transition duration-200 hover:-translate-y-0.5 hover:bg-[#087046] focus:outline-none focus:ring-4 focus:ring-white/30"
                >
                  {config.primary_cta_label ||
                    'Book an Appointment'}
                  <CalendarDays size={18} />
                </CtaLink>

                <CtaLink
                  to={
                    config.secondary_cta_url ||
                    '#services'
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-black text-white shadow-lg backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30"
                >
                  {config.secondary_cta_label ||
                    'View Services'}
                  <ArrowRight size={18} />
                </CtaLink>
              </div>

              <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
                {[
                  [
                    ShieldCheck,
                    'Private and role-protected'
                  ],
                  [
                    HeartPulse,
                    'Student and employee care'
                  ],
                  [
                    Clock3,
                    'Appointment and walk-in support'
                  ]
                ].map(([Icon, label]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/20 bg-black/20 p-4 shadow-lg backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-black/30"
                  >
                    <Icon
                      className="text-emerald-300"
                      size={21}
                    />

                    <div className="mt-2 text-sm font-bold leading-5 text-white">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Smooth visual transition to next section */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
        </section>

        {/* =========================================================
            API STATUS
        ========================================================== */}
        {error && (
          <div className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
            <Alert>{error}</Alert>
          </div>
        )}

        {loading && (
          <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-slate-500">
            Loading clinic information…
          </div>
        )}

        {/* =========================================================
            CLINIC INFORMATION
        ========================================================== */}
        <section className="border-y border-emerald-950/10 bg-emerald-50/70 py-10 dark:border-slate-800 dark:bg-emerald-950/20">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <Clock3 className="text-kld-700 dark:text-emerald-300" />

              <h2 className="mt-3 font-black">
                Operating Hours
              </h2>

              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-400">
                {config.operating_hours ||
                  settings.clinic_operating_info ||
                  'Contact the clinic for current operating hours.'}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <MapPin className="text-kld-700 dark:text-emerald-300" />

              <h2 className="mt-3 font-black">
                Clinic Location
              </h2>

              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-400">
                {config.location_text ||
                  settings.clinic_address ||
                  'KLD campus clinic'}
              </p>

              {config.location_url && (
                <a
                  href={config.location_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-sm font-bold text-kld-700 hover:underline dark:text-emerald-300"
                >
                  Open map
                </a>
              )}
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <Phone className="text-kld-700 dark:text-emerald-300" />

              <h2 className="mt-3 font-black">
                Contact the Clinic
              </h2>

              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-400">
                {config.contact_content ||
                  settings.clinic_contact ||
                  'Use the contact details published by the school clinic.'}
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            ANNOUNCEMENTS AND PROMOTIONS
        ========================================================== */}
        {posts.length > 0 && (
          <section
            id="announcements"
            className="py-20"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-kld-700 dark:text-emerald-300">
                    Clinic updates
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                    Announcements and promotions
                  </h2>

                  <p className="mt-3 text-slate-600 dark:text-slate-400">
                    Important clinic notices, services,
                    and health campaigns.
                  </p>
                </div>

                <Link
                  to="/announcements"
                  className="btn-secondary shrink-0"
                >
                  View All
                  <ArrowRight size={17} />
                </Link>
              </div>

              <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((item) => (
                  <PostCard
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            SERVICES
        ========================================================== */}
        <section
          id="services"
          className="bg-emerald-50/70 py-20 dark:bg-slate-900/50"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-kld-700 dark:text-emerald-300">
                Clinic services
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                Care that works with the school day
              </h2>

              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
                Available services are configured by the
                clinic and may be requested through
                authenticated appointment scheduling.
              </p>
            </div>

            <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(data?.services || []).map((service) => (
                <ServiceCard
                  key={service.id}
                  title={service.name}
                  description={service.description}
                  duration={service.duration_minutes}
                  capacity={service.slot_capacity}
                />
              ))}

              {grouped.SERVICE.map((item) => (
                <ServiceCard
                  key={item.id}
                  title={item.title}
                  description={
                    item.summary || item.body
                  }
                />
              ))}

              {!data?.services?.length &&
                !grouped.SERVICE.length && (
                  <ServiceCard
                    title="School Clinic Care"
                    description="Clinic services will appear here once published by an administrator."
                  />
                )}
            </div>
          </div>
        </section>

        {/* =========================================================
            ABOUT
        ========================================================== */}
        <section
          id="about"
          className="py-20"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="rounded-[2.25rem] bg-kld-950 p-8 text-white shadow-xl sm:p-10">
              <Stethoscope
                className="text-emerald-300"
                size={42}
              />

              <h2 className="mt-5 text-3xl font-black">
                {config.about_heading ||
                  'About the School Clinic'}
              </h2>

              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-white/75">
                {config.about_content ||
                  'The school clinic supports campus wellbeing through first aid, assessment, consultation coordination, medicine management, health records, referrals, and preventive health activities.'}
              </p>
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-kld-700 dark:text-emerald-300">
                Our approach
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                Confidential care, clear coordination
              </h2>

              <div className="mt-6 space-y-4">
                {[
                  [
                    'Protected records',
                    'Role-based access and audit trails protect authorized medical information.'
                  ],
                  [
                    'Connected clinic workflow',
                    'Visits, consultations, medicines, appointments, and follow-ups stay connected.'
                  ],
                  [
                    'Patient-centered access',
                    'Verified students can access permitted information through their own secure portal.'
                  ]
                ].map(([title, text]) => (
                  <div
                    key={title}
                    className="flex gap-4 rounded-2xl border border-emerald-950/10 p-5 dark:border-slate-800"
                  >
                    <ShieldCheck className="mt-0.5 shrink-0 text-kld-700 dark:text-emerald-300" />

                    <div>
                      <h3 className="font-black">
                        {title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            TEAM
        ========================================================== */}
        {grouped.TEAM.length > 0 && (
          <section
            id="team"
            className="bg-slate-50 py-20 dark:bg-slate-900/50"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-kld-700 dark:text-emerald-300">
                  Our team
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  Clinic personnel
                </h2>
              </div>

              <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {grouped.TEAM.map((member) => (
                  <article
                    key={member.id}
                    className="overflow-hidden rounded-3xl border bg-white text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    {member.cover_image_path ? (
                      <img
                        src={mediaUrl(
                          member.cover_image_path
                        )}
                        alt={member.title}
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-emerald-50 text-kld-700 dark:bg-slate-800">
                        <UsersRound size={58} />
                      </div>
                    )}

                    <div className="p-5">
                      <h3 className="font-black">
                        {member.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {member.summary || member.body}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            APPOINTMENT CALL TO ACTION
        ========================================================== */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[2rem] bg-gradient-to-r from-kld-800 to-kld-600 p-8 text-white shadow-xl sm:p-10 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-200">
                Need clinic assistance?
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Request an appointment through your
                secure account.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
                Appointment requests require
                authentication so the clinic can verify
                the patient and protect health
                information.
              </p>
            </div>

            <Link
              to="/student/appointments"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-kld-800 shadow-lg hover:bg-emerald-50"
            >
              Book Appointment
              <CalendarDays size={18} />
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}