import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CinematicHero, HERO_SLIDES } from './CinematicHero';

describe('CinematicHero Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial slide title, subtitle, and badges matching the reference photo', () => {
    render(
      <MemoryRouter>
        <CinematicHero />
      </MemoryRouter>
    );

    const firstSlide = HERO_SLIDES[0];

    // Check stylized title
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(firstSlide.title);

    // Check subtitle in h2
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(firstSlide.subtitle);

    // Check rating badge (TMDb 9.0)
    expect(screen.getByText(firstSlide.ratingBadge.label)).toBeInTheDocument();
    expect(screen.getByText(firstSlide.ratingBadge.score)).toBeInTheDocument();

    // Check year and episode tag
    expect(screen.getByText(firstSlide.year)).toBeInTheDocument();
    expect(screen.getByText(firstSlide.episodeTag)).toBeInTheDocument();

    // Check genres
    for (const genre of firstSlide.genres) {
      expect(screen.getByText(genre)).toBeInTheDocument();
    }

    // Check description
    expect(screen.getByText(firstSlide.description)).toBeInTheDocument();
  });

  it('renders bottom-right carousel thumbnail buttons for all slides', () => {
    render(
      <MemoryRouter>
        <CinematicHero />
      </MemoryRouter>
    );

    const thumbnailButtons = screen.getAllByRole('button').filter((btn) =>
      btn.getAttribute('title')?.includes(HERO_SLIDES[0].title) ||
      btn.getAttribute('title')?.includes(HERO_SLIDES[1].title)
    );
    expect(thumbnailButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('switches slide when a thumbnail button is clicked', () => {
    render(
      <MemoryRouter>
        <CinematicHero />
      </MemoryRouter>
    );

    const secondSlide = HERO_SLIDES[1];
    const secondThumb = screen.getByTitle(
      `${secondSlide.title} ${secondSlide.titleSuffix || ''}`.trim()
    );

    fireEvent.click(secondThumb);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(secondSlide.title);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(secondSlide.subtitle);
  });

  it('toggles favorite like state on heart button click', () => {
    render(
      <MemoryRouter>
        <CinematicHero />
      </MemoryRouter>
    );

    const heartButton = screen.getByTitle('Thêm vào yêu thích');
    expect(heartButton).toBeInTheDocument();

    fireEvent.click(heartButton);
    expect(screen.getByTitle('Đã yêu thích')).toBeInTheDocument();
  });

  it('opens and closes the explore/play modal on play button click', () => {
    render(
      <MemoryRouter>
        <CinematicHero />
      </MemoryRouter>
    );

    const playButton = screen.getByTitle('Khám phá ngay');
    fireEvent.click(playButton);

    expect(screen.getByText('Truy cập Workspace ngay')).toBeInTheDocument();

    const closeButton = screen.getByText('Đóng');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Truy cập Workspace ngay')).not.toBeInTheDocument();
  });

  it('opens and closes the info details modal', () => {
    render(
      <MemoryRouter>
        <CinematicHero />
      </MemoryRouter>
    );

    const infoButton = screen.getByTitle('Thông tin chi tiết');
    fireEvent.click(infoButton);

    expect(screen.getByText('Tóm tắt nội dung')).toBeInTheDocument();

    const closeButtons = screen.getAllByRole('button');
    const modalCloseBtn = closeButtons.find((btn) => btn.querySelector('svg.lucide-x'));
    if (modalCloseBtn) {
      fireEvent.click(modalCloseBtn);
      expect(screen.queryByText('Tóm tắt nội dung')).not.toBeInTheDocument();
    }
  });

  it('auto-rotates slides on timer tick', () => {
    render(
      <MemoryRouter>
        <CinematicHero />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(HERO_SLIDES[0].subtitle);

    act(() => {
      vi.advanceTimersByTime(7500);
    });

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(HERO_SLIDES[1].subtitle);
  });
});
