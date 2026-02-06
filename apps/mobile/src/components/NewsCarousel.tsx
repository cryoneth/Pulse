"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface NewsItem {
  id: string;
  category: string;
  image: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  fullText: string;
}

const newsData: NewsItem[] = [
  {
    id: "1",
    category: "Crypto",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop",
    title: "Bitcoin ETFs See Record $2.4B Inflows",
    author: "Sarah Chen",
    date: "Feb 6, 2026",
    excerpt: "Institutional demand surges as spot Bitcoin ETFs continue to attract massive capital from traditional finance.",
    fullText: "Bitcoin ETFs have recorded their biggest week of inflows since launch, with over $2.4 billion entering the funds. BlackRock's IBIT led the charge, followed by Fidelity's FBTC. Analysts attribute the surge to growing institutional acceptance and expectations of Fed rate cuts. The milestone reinforces Bitcoin's evolution from a niche asset to a mainstream investment vehicle."
  },
  {
    id: "2",
    category: "Markets",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
    title: "Fed Signals Rate Cuts Coming in Q2",
    author: "Michael Zhang",
    date: "Feb 5, 2026",
    excerpt: "Federal Reserve officials indicate monetary policy easing ahead as inflation continues to cool.",
    fullText: "Federal Reserve Chair Jerome Powell hinted at potential rate cuts in the second quarter, citing progress on inflation targets. Markets rallied on the news, with the S&P 500 hitting new all-time highs. Bond yields fell sharply as traders priced in at least three cuts by year-end. The shift marks a significant pivot from the aggressive tightening cycle."
  },
  {
    id: "3",
    category: "Sports",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=200&fit=crop",
    title: "Super Bowl LIX Breaks Betting Records",
    author: "David Kim",
    date: "Feb 4, 2026",
    excerpt: "Sportsbooks report unprecedented wagering volume as the big game approaches.",
    fullText: "Super Bowl LIX is on track to become the most bet-on sporting event in history. Legal sportsbooks across the US report a 40% increase in handle compared to last year. Prop bets and live betting have driven much of the growth, with the Chiefs favored by 2.5 points. The expansion of legal sports betting to more states continues to fuel the industry's rapid growth."
  },
  {
    id: "4",
    category: "Crypto",
    image: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400&h=200&fit=crop",
    title: "Ethereum L2s Hit $50B TVL Milestone",
    author: "Alex Rivera",
    date: "Feb 3, 2026",
    excerpt: "Layer 2 scaling solutions reach new heights as DeFi activity accelerates.",
    fullText: "Ethereum Layer 2 networks have collectively surpassed $50 billion in total value locked, marking a significant milestone for blockchain scalability. Arbitrum and Base lead the pack, each hosting over $15 billion in deposits. The growth reflects increasing user preference for faster, cheaper transactions while maintaining Ethereum's security guarantees."
  },
  {
    id: "5",
    category: "Entertainment",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=200&fit=crop",
    title: "Taylor Swift Announces Surprise Album",
    author: "Emma Watson",
    date: "Feb 2, 2026",
    excerpt: "Pop superstar drops unexpected new record, crashing streaming platforms worldwide.",
    fullText: "Taylor Swift surprised fans with the midnight release of her 12th studio album, immediately breaking Spotify's first-day streaming records. The album features collaborations with several major artists and explores new sonic territory. Ticketing sites crashed within minutes of the accompanying tour announcement, with prediction markets surging on related outcomes."
  },
  {
    id: "6",
    category: "Politics",
    image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=200&fit=crop",
    title: "Election Polls Show Tight Race Ahead",
    author: "James Park",
    date: "Feb 1, 2026",
    excerpt: "Latest surveys indicate highly competitive contests in key battleground states.",
    fullText: "New polling data reveals razor-thin margins in crucial swing states ahead of the upcoming elections. Political analysts note unprecedented voter engagement and fundraising numbers. Prediction markets reflect the uncertainty, with odds fluctuating daily based on campaign developments and economic indicators."
  }
];

const categoryColors: Record<string, string> = {
  Crypto: "bg-violet-500",
  Markets: "bg-blue-500",
  Sports: "bg-emerald-500",
  Entertainment: "bg-pink-500",
  Politics: "bg-orange-500",
};

export function NewsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);

  // Track screen size for responsive distance
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const nextCard = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % newsData.length);
  }, []);

  const prevCard = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + newsData.length) % newsData.length);
  }, []);

  const goToCard = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const toggleFlip = useCallback((index: number) => {
    if (index === currentIndex) {
      setFlippedCards((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevCard();
      if (e.key === "ArrowRight") nextCard();
      if (e.key === " ") {
        e.preventDefault();
        toggleFlip(currentIndex);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, nextCard, prevCard, toggleFlip]);

  // Touch/drag handling with passive: false to prevent horizontal scroll
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let isDraggingHorizontal = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isDraggingHorizontal = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const diffX = e.touches[0].clientX - touchStartX;
      const diffY = e.touches[0].clientY - touchStartY;

      // If horizontal movement is greater, prevent default to stop page scroll
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        e.preventDefault();
        isDraggingHorizontal = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isDraggingHorizontal) {
        const diffX = e.changedTouches[0].clientX - touchStartX;
        // Swipe left (negative diff) = show next card (cards move left)
        // Swipe right (positive diff) = show previous card (cards move right)
        if (diffX < -50) {
          nextCard();
        } else if (diffX > 50) {
          prevCard();
        }
      }
      isDraggingHorizontal = false;
    };

    // Add listeners with passive: false for touch events
    deck.addEventListener("touchstart", handleTouchStart, { passive: true });
    deck.addEventListener("touchmove", handleTouchMove, { passive: false });
    deck.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      deck.removeEventListener("touchstart", handleTouchStart);
      deck.removeEventListener("touchmove", handleTouchMove);
      deck.removeEventListener("touchend", handleTouchEnd);
    };
  }, [nextCard, prevCard]);

  // Mouse drag handling
  const mouseStartX = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const diff = e.clientX - mouseStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) prevCard();
      else nextCard();
    }
  };

  const getCardStyle = (index: number) => {
    const offset = index - currentIndex;
    const total = newsData.length;

    // Handle wrapping for smooth circular navigation
    let adjustedOffset = offset;
    if (offset > total / 2) adjustedOffset = offset - total;
    if (offset < -total / 2) adjustedOffset = offset + total;

    const angleStep = 360 / total;
    const angle = adjustedOffset * angleStep;
    // Responsive distance: smaller on mobile to keep cards visible
    const distance = isMobile ? 160 : 350;

    const x = Math.sin((angle * Math.PI) / 180) * distance;
    const z = Math.cos((angle * Math.PI) / 180) * distance - distance;
    const rotateY = -angle;

    let scale = 1;
    let opacity = 1;
    let zIndex = 0;

    const absOffset = Math.abs(adjustedOffset);
    if (absOffset === 0) {
      scale = 1;
      opacity = 1;
      zIndex = 10;
    } else if (absOffset === 1) {
      scale = isMobile ? 0.85 : 0.9;
      opacity = isMobile ? 0.7 : 0.85;
      zIndex = 5;
    } else if (absOffset === 2) {
      scale = isMobile ? 0.7 : 0.8;
      opacity = isMobile ? 0.5 : 0.65;
      zIndex = 3;
    } else {
      scale = isMobile ? 0.6 : 0.7;
      opacity = isMobile ? 0.3 : 0.5;
      zIndex = 1;
    }

    return {
      transform: `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex,
    };
  };

  return (
    <div className="relative overflow-visible">
      {/* Carousel Container */}
      <div
        className="relative h-[460px] sm:h-[520px] md:h-[580px] mx-auto max-w-full overflow-visible"
        style={{
          perspective: "1200px",
          touchAction: "pan-y", // Allow vertical scroll, prevent horizontal
        }}
      >
        <div
          ref={deckRef}
          className="relative w-full h-full cursor-grab active:cursor-grabbing"
          style={{ transformStyle: "preserve-3d" }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          {newsData.map((news, index) => {
            const style = getCardStyle(index);
            const isFlipped = flippedCards.has(index);
            const isCurrent = index === currentIndex;

            return (
              <div
                key={news.id}
                className="absolute left-1/2 top-1/2 w-[260px] h-[400px] sm:w-[320px] sm:h-[460px] md:w-[400px] md:h-[500px]"
                style={{
                  ...style,
                  transformStyle: "preserve-3d",
                  transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  pointerEvents: isCurrent ? "auto" : "none",
                }}
                onClick={() => toggleFlip(index)}
              >
                {/* Card Inner (handles flip) */}
                <div
                  className="relative w-full h-full"
                  style={{
                    transformStyle: "preserve-3d",
                    transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* Front Face */}
                  <div
                    className="absolute inset-0 rounded-2xl overflow-hidden bg-white border border-gray-200/50"
                    style={{
                      backfaceVisibility: "hidden",
                      boxShadow: "0 25px 50px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div className="p-5 sm:p-6 flex flex-col h-full">
                      <span className={`self-start px-3 py-1 rounded-full text-xs font-semibold text-white uppercase tracking-wide ${categoryColors[news.category] || "bg-gray-500"}`}>
                        {news.category}
                      </span>
                      <img
                        src={news.image}
                        alt={news.title}
                        className="w-full h-40 sm:h-44 md:h-48 object-cover rounded-xl mt-4 shadow-lg"
                      />
                      <h3
                        className="text-xl sm:text-2xl font-bold text-gray-900 mt-4 leading-tight line-clamp-2"
                        style={{ fontFamily: "var(--font-playfair), serif" }}
                      >
                        {news.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                        <span className="font-medium">{news.author}</span>
                        <span>•</span>
                        <span>{news.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2 flex-1 leading-relaxed">
                        {news.excerpt}
                      </p>
                      <span className="text-xs text-blue-500 font-semibold mt-3 animate-pulse">
                        Click to read more →
                      </span>
                    </div>
                  </div>

                  {/* Back Face */}
                  <div
                    className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      boxShadow: "0 25px 50px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div className="p-5 sm:p-6 flex flex-col h-full">
                      <h3
                        className="text-xl sm:text-2xl font-bold text-blue-400 leading-tight mb-4"
                        style={{ fontFamily: "var(--font-playfair), serif" }}
                      >
                        {news.title}
                      </h3>
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                          {news.fullText}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                        <span className="text-xs text-gray-500">
                          {news.author} • {news.date}
                        </span>
                        <span className="text-xs text-blue-400 font-semibold">
                          ← Tap to flip back
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hint text */}
      <p className="text-center text-xs text-gray-400 mt-3">
        Swipe, drag, or use arrow keys to navigate
      </p>
    </div>
  );
}
