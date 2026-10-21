import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, Info, X, Check, Share2, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';

export interface HeroSlide {
  id: string;
  backdrop: string;
  title: string;
  titleSuffix?: string;
  badgeAccent?: string;
  subtitle: string;
  ratingBadge: {
    label: string;
    score: string;
    color: string;
  };
  year: string;
  episodeTag: string;
  genres: string[];
  description: string;
  primaryActionLabel?: string;
  targetRoute?: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'doctor-x',
    backdrop: '/hero-doctor-x.jpg',
    title: 'BÁC SĨ',
    titleSuffix: 'X',
    badgeAccent: 'MAFIA ÁO TRẮNG',
    subtitle: 'Doctor X: Mafia in White',
    ratingBadge: {
      label: 'TMDb',
      score: '9.0',
      color: 'bg-[#00B4D8] text-black',
    },
    year: '2026',
    episodeTag: 'Tập 4',
    genres: ['Hình Sự', 'Chính Kịch', 'Bí Ẩn'],
    description:
      'Gye Su-jeong là một bác sĩ phẫu thuật thiên tài với tài năng xuất chúng và cá tính mạnh mẽ. Gia nhập một bệnh viện đại học đầy rẫy tham nhũng và đấu đá quyền lực, cô quyết tâm vạch trần những thế lực đen tối trong ngành...',
    primaryActionLabel: 'Xem ngay',
    targetRoute: ROUTES.DASHBOARD,
  },
  {
    id: 'alsm-core',
    backdrop: '/hero-mainframe.jpg',
    title: 'ALSM',
    titleSuffix: 'CORE',
    badgeAccent: 'MAINFRAME REVOLUTION',
    subtitle: 'Automating Legacy System Modernization',
    ratingBadge: {
      label: 'AST',
      score: '9.9',
      color: 'bg-emerald-400 text-black',
    },
    year: '2026',
    episodeTag: 'v2.4 Live',
    genres: ['Legacy Core', 'AST Engine', 'Cloud Mesh'],
    description:
      'Nền tảng tự động hóa hiện đại hóa hệ thống kế thừa IBM Mainframe và AS/400. Chuyển đổi toàn diện giao diện BMS/DSPF sang React 19 và mã nguồn COBOL sang Java Microservices với độ chính xác tuyệt đối 100%.',
    primaryActionLabel: 'Khám phá Workspace',
    targetRoute: ROUTES.DASHBOARD,
  },
  {
    id: 'bms-terminal',
    backdrop: '/hero-terminal.jpg',
    title: '3270',
    titleSuffix: 'STUDIO',
    badgeAccent: 'CICS SCREEN CONVERTER',
    subtitle: 'Pixel-Perfect 24x80 Grid to React',
    ratingBadge: {
      label: 'PARITY',
      score: '100%',
      color: 'bg-amber-400 text-black',
    },
    year: '2026',
    episodeTag: 'Studio v2',
    genres: ['BMS Screen', 'IBM 3270', 'React 19'],
    description:
      'Giải mã hoàn chỉnh các macro DFHMSD, DFHMDI, DFHMDF. Tự động sinh giao diện web tương tác mô phỏng chính xác vị trí hàng cột, màu sắc terminal, trường nhập liệu bảo vệ và phím chức năng PF1–PF12.',
    primaryActionLabel: 'Thử nghiệm Convert',
    targetRoute: ROUTES.DASHBOARD,
  },
  {
    id: 'enterprise-council',
    backdrop: '/hero-meeting.jpg',
    title: 'HỘI ĐỒNG',
    titleSuffix: 'ALSM',
    badgeAccent: 'KIỂM ĐỊNH CHẤT LƯỢNG',
    subtitle: 'Enterprise Quality & Advisory Review',
    ratingBadge: {
      label: 'QC',
      score: 'A+',
      color: 'bg-indigo-400 text-white',
    },
    year: '2026',
    episodeTag: 'Audit Ready',
    genres: ['Compliance', 'Unit Test', 'Clean Code'],
    description:
      'Quy trình thẩm định mã nguồn chuyển đổi chuyên sâu theo tiêu chuẩn ngân hàng quốc tế. Kết hợp giữa bộ luật tĩnh nghiêm ngặt và AI Validator cố vấn giúp bảo vệ an toàn tuyệt đối cho hệ thống nghiệp vụ lõi.',
    primaryActionLabel: 'Xem Báo cáo QC',
    targetRoute: ROUTES.DASHBOARD,
  },
  {
    id: 'cloud-mesh',
    backdrop: '/hero-city.jpg',
    title: 'CLOUD',
    titleSuffix: 'MESH',
    badgeAccent: 'KIẾN TRÚC TƯƠNG LAI',
    subtitle: 'From Monolith to Spring Microservices',
    ratingBadge: {
      label: 'SPEED',
      score: '10x',
      color: 'bg-cyan-400 text-black',
    },
    year: '2026',
    episodeTag: 'Production',
    genres: ['Spring Boot 3', 'REST API', 'Event-Driven'],
    description:
      'Dịch chuyển dữ liệu và dịch vụ không gián đoạn (Zero-Downtime). Tự động phân giải các copybook dùng chung, chuyển đổi vùng nhớ nhị phân COMP-3 sang BigDecimal và sinh controller REST đạt chuẩn doanh nghiệp.',
    primaryActionLabel: 'Bắt đầu Dự án',
    targetRoute: ROUTES.DASHBOARD,
  },
];

export const CinematicHero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [showPlayModal, setShowPlayModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = HERO_SLIDES[currentIndex];

  const resetAutoplay = () => {
    if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    autoplayTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
  };

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, []);

  const handleSelectSlide = (index: number) => {
    setCurrentIndex(index);
    resetAutoplay();
  };

  const handleToggleLike = () => {
    setIsLiked((prev) => {
      const next = !prev;
      showToast(next ? 'Đã thêm vào danh sách yêu thích!' : 'Đã xóa khỏi danh sách yêu thích!');
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <section
      id="hero"
      className="relative w-full min-h-[640px] sm:min-h-[720px] lg:min-h-[780px] flex items-center overflow-hidden bg-[#0a0d14] text-white select-none"
      onMouseEnter={() => {
        if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      }}
      onMouseLeave={resetAutoplay}
    >
      {/* Background Backdrops with crossfade */}
      {HERO_SLIDES.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-0 scale-100' : 'opacity-0 -z-10 pointer-events-none scale-105'
          } transform transition-transform duration-10000`}
        >
          <img
            src={slide.backdrop}
            alt={slide.subtitle}
            className="w-full h-full object-cover object-center"
            loading={idx === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      {/* Cinematic Multi-layer Gradient Overlays matching ChợPhim */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-black/95 via-black/75 to-black/20 sm:to-transparent" />
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-[#020817] via-black/40 to-transparent" />
      <div className="absolute top-0 inset-x-0 h-32 z-10 pointer-events-none bg-gradient-to-b from-black/80 to-transparent" />

      {/* Main Content Area */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col justify-center min-h-[580px]">
        <div className="max-w-2xl space-y-4 sm:space-y-5 animate-fadeIn">
          {/* Stylized Logo Title (Exact typography from photo) */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] font-sans">
                {currentSlide.title}
                {currentSlide.titleSuffix && (
                  <span className="ml-2 font-black italic bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(255,255,255,0.4)]">
                    {currentSlide.titleSuffix}
                  </span>
                )}
              </h1>
            </div>
            {currentSlide.badgeAccent && (
              <p className="text-xs sm:text-sm tracking-[0.3em] font-extrabold uppercase text-slate-300 drop-shadow-md">
                {currentSlide.badgeAccent}
              </p>
            )}
          </div>

          {/* Subtitle in vibrant amber */}
          <h2 className="text-base sm:text-lg font-bold text-amber-400 tracking-wide drop-shadow">
            {currentSlide.subtitle}
          </h2>

          {/* Metadata Row: TMDb badge, Year, Episode */}
          <div className="flex items-center flex-wrap gap-2.5 pt-0.5">
            <span
              className={`text-xs font-black px-2 py-0.5 rounded shadow-sm flex items-center gap-1 ${currentSlide.ratingBadge.color}`}
            >
              <span>{currentSlide.ratingBadge.label}</span>
              <span>{currentSlide.ratingBadge.score}</span>
            </span>

            <span className="text-xs font-medium text-white/90 border border-white/30 px-2.5 py-0.5 rounded backdrop-blur-sm">
              {currentSlide.year}
            </span>

            <span className="text-xs font-medium text-white/90 border border-white/30 px-2.5 py-0.5 rounded backdrop-blur-sm">
              {currentSlide.episodeTag}
            </span>
          </div>

          {/* Genre / Tag Pills */}
          <div className="flex items-center flex-wrap gap-2 pt-1">
            {currentSlide.genres.map((genre) => (
              <span
                key={genre}
                className="text-xs font-medium px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-colors shadow-sm cursor-default"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Synopsis Description */}
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed line-clamp-3 sm:line-clamp-4 max-w-xl drop-shadow">
            {currentSlide.description}
          </p>

          {/* Action Buttons Row matching ChợPhim */}
          <div className="flex items-center gap-4 pt-3">
            {/* Big Circular Yellow Play Button */}
            <button
              type="button"
              onClick={() => setShowPlayModal(true)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#F5C518] hover:bg-[#FCD34D] text-black flex items-center justify-center shadow-[0_0_25px_rgba(245,197,24,0.45)] hover:scale-108 active:scale-95 transition-all duration-200 cursor-pointer group"
              title="Khám phá ngay"
            >
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-black text-black ml-1 group-hover:scale-110 transition-transform" />
            </button>

            {/* Circular Favorite / Heart Button */}
            <button
              type="button"
              onClick={handleToggleLike}
              className={`w-12 h-12 rounded-full border flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
                isLiked
                  ? 'bg-rose-500/20 border-rose-500 text-rose-500'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
              title={isLiked ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500' : ''}`} />
            </button>

            {/* Circular Info Button */}
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
              title="Thông tin chi tiết"
            >
              <Info className="w-5 h-5" />
            </button>

            {/* Quick Link to Dashboard Workspace */}
            <Link
              to={ROUTES.DASHBOARD}
              className="hidden md:inline-flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white ml-2 bg-white/5 hover:bg-white/15 px-4 py-2.5 rounded-full border border-white/10 backdrop-blur-sm transition-all"
            >
              <span>Vào Workspace ALSM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom-Right Thumbnail Carousel Strip matching ChợPhim */}
      <div className="absolute bottom-6 right-4 sm:right-8 z-30 flex items-center gap-2 sm:gap-3 p-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
        {HERO_SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => handleSelectSlide(idx)}
            className={`group relative w-14 h-9 sm:w-20 sm:h-12 md:w-24 md:h-14 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer ${
              idx === currentIndex
                ? 'ring-2 ring-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.5)] opacity-100'
                : 'opacity-50 hover:opacity-90 hover:scale-102 border border-white/10'
            }`}
            title={`${slide.title} ${slide.titleSuffix || ''}`}
          >
            <img
              src={slide.backdrop}
              alt={slide.subtitle}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {idx === currentIndex && (
              <div className="absolute inset-0 bg-white/10 border-2 border-white rounded-lg pointer-events-none" />
            )}
            <span className="sr-only">{slide.subtitle}</span>
          </button>
        ))}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#091E42] text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl shadow-2xl border border-white/20 animate-bounce flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Play / Explore Modal */}
      {showPlayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-700 rounded-2xl p-6 sm:p-8 text-white shadow-2xl space-y-6">
            <button
              type="button"
              onClick={() => setShowPlayModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
                {currentSlide.badgeAccent}
              </span>
              <h3 className="text-2xl font-black text-white">
                {currentSlide.title} {currentSlide.titleSuffix}
              </h3>
              <p className="text-sm text-slate-400">{currentSlide.subtitle}</p>
            </div>

            <div className="aspect-video w-full rounded-xl overflow-hidden relative bg-black border border-slate-800 flex items-center justify-center group">
              <img
                src={currentSlide.backdrop}
                alt={currentSlide.subtitle}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 flex flex-col justify-end p-6">
                <p className="text-xs text-slate-300 font-mono">
                  Sẵn sàng trải nghiệm quy trình hiện đại hóa tự động ALSM
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPlayModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Đóng
              </button>
              <Link
                to={ROUTES.DASHBOARD}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#F5C518] hover:bg-[#FCD34D] text-black shadow-lg transition-transform hover:scale-102 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-black text-black" />
                <span>Truy cập Workspace ngay</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Info Details Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#0F172A] border border-slate-700 rounded-2xl p-6 sm:p-8 text-white shadow-2xl space-y-6">
            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-20 h-28 rounded-lg overflow-hidden shrink-0 border border-slate-700">
                <img
                  src={currentSlide.backdrop}
                  alt={currentSlide.subtitle}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded ${currentSlide.ratingBadge.color}`}
                  >
                    {currentSlide.ratingBadge.label} {currentSlide.ratingBadge.score}
                  </span>
                  <span className="text-xs text-slate-400">{currentSlide.year}</span>
                  <span className="text-xs text-slate-400">{currentSlide.episodeTag}</span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {currentSlide.title} {currentSlide.titleSuffix}
                </h3>
                <p className="text-xs text-amber-400 font-semibold">{currentSlide.subtitle}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentSlide.genres.map((g) => (
                    <span
                      key={g}
                      className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tóm tắt nội dung</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{currentSlide.description}</p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  showToast('Đã sao chép liên kết vào bộ nhớ tạm!');
                }}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Chia sẻ</span>
              </button>
              <Link
                to={ROUTES.DASHBOARD}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0652CC] hover:bg-[#0655FF] text-white transition-colors"
              >
                Khám phá hệ thống
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CinematicHero;
