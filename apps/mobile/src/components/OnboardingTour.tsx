"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Step {
  id: string;
  targetIds?: string[]; // Support multiple highlights
  title: string;
  content: string;
  position?: "top" | "bottom" | "center";
}

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to Pulse",
    content: "The intelligence-first prediction market. We've simplified the complexity of crypto trading into a refined, editorial experience.",
    position: "center",
  },
  {
    id: "wallet",
    targetIds: ["wallet-button"],
    title: "Secure Access",
    content: "Connect your wallet once. We handle the technical friction so you can focus on the markets.",
    position: "bottom",
  },
  {
    id: "intelligence",
    targetIds: ["market-intelligence-section"],
    title: "Market Intelligence",
    content: "Trade on information, not just charts. Read our editorial dispatches to understand the 'why' behind every market movement.",
    position: "bottom",
  },
  {
    id: "trading",
    targetIds: ["market-card-0"],
    title: "Precision Execution",
    content: "No complex order books. Just clean, intuitive trading. Pick your side, set your position, and pulse into the future.",
    position: "top",
  },
  {
    id: "portfolio",
    targetIds: ["portfolio-tab-button", "nav-portfolio"],
    title: "Your Performance",
    content: "Track your active positions and diversification score. Pulse gives you a birds-eye view of your predictive accuracy.",
    position: "top",
  },
  {
    id: "conclusion",
    targetIds: [], // Remove highlight for conclusion
    title: "The Pulse is Yours",
    content: "You're ready to join the world's most informed prediction ecosystem. Happy trading.",
    position: "center",
  },
];

export function OnboardingTour() {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightRects, setHighlightRects] = useState<DOMRect[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasSeenOnboarding = localStorage.getItem("pulse_onboarding_complete");
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    if (!hasSeenOnboarding) {
      // Small delay to let the page settle
      const timer = setTimeout(() => {
        setIsVisible(true);
        setCurrentStepIndex(0);
      }, 1000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", checkMobile);
      };
    }
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const updateHighlightRects = useCallback(() => {
    if (currentStepIndex < 0) return;
    const step = STEPS[currentStepIndex];
    let targetIds = step.targetIds;

    // Viewport-specific target filtering
    if (isMobile) {
      if (step.id === "intelligence") {
        targetIds = ["market-intelligence-deck"];
      } else if (step.id === "portfolio") {
        targetIds = ["portfolio-tab-button"]; // Only main button on mobile
      }
    }

    if (targetIds && targetIds.length > 0) {
      // Scroll first element into view
      const firstElement = document.getElementById(targetIds[0]);
      if (firstElement) {
        // For Step 2, don't scroll since it's in the sticky nav
        if (step.id !== "wallet") {
          firstElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      
      const checkRects = () => {
        const rects = targetIds!
          .map(id => {
            const el = document.getElementById(id);
            return el?.getBoundingClientRect();
          })
          .filter((rect): rect is DOMRect => !!rect);
        setHighlightRects(rects);
      };
      
      // Check immediately and then after a delay for scroll
      checkRects();
      const timer = setTimeout(checkRects, 500);
      return () => clearTimeout(timer);
    } else {
      setHighlightRects([]);
    }
  }, [currentStepIndex, isMobile]);

  useEffect(() => {
    const cleanup = updateHighlightRects();
    window.addEventListener("resize", updateHighlightRects);
    window.addEventListener("scroll", updateHighlightRects);
    return () => {
      window.removeEventListener("resize", updateHighlightRects);
      window.removeEventListener("scroll", updateHighlightRects);
      if (typeof cleanup === 'function') cleanup();
    };
  }, [updateHighlightRects]);

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem("pulse_onboarding_complete", "true");
  };

  if (!mounted || !isVisible || currentStepIndex === -1) return null;

  const currentStep = STEPS[currentStepIndex];

  // Dynamic positioning for the card
  let cardStyle: React.CSSProperties = { transform: "translateY(0)" };
  if (highlightRects.length > 0) {
    const mainRect = highlightRects[0];
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;
    const isTopHalf = mainRect.top < screenHeight / 2;
    
    let ty = isTopHalf ? 200 : -200;
    let tx = 0;

    // Step 2 (wallet): Fixed position on mobile
    if (currentStep.id === "wallet" && isMobile) {
      ty = 0; // Center of screen
    } else if (currentStep.id === "trading") {
      // Step 4 (trading): Move lower
      ty = 260; 
    } else if (currentStep.id === "portfolio") {
      // Step 5 (portfolio): Move to avoid overlap
      if (isMobile) {
        ty = -240; // Move significantly higher on mobile
        tx = 0;
      } else {
        ty = -180;
        tx = -140; // Shift significantly left on desktop
      }
    }

    cardStyle = { transform: `translate(${tx}px, ${ty}px)` };
  }

  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 2000;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 2000;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden font-sans pointer-events-none">
      {/* Dimmed Background with Holes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={handleComplete}>
        <defs>
          <mask id="onboarding-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightRects.map((rect, i) => (
              <rect
                key={i}
                x={rect.left - 8}
                y={rect.top - 8}
                width={rect.width + 16}
                height={rect.height + 16}
                fill="black"
                rx="4"
              />
            ))}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(28, 25, 23, 0.6)"
          mask="url(#onboarding-mask)"
        />
      </svg>

      {/* Spotlight Borders */}
      {highlightRects.map((rect, i) => (
        <div
          key={i}
          className="absolute border-2 border-white/80 pointer-events-none transition-all duration-300 ease-in-out z-[101] animate-pulse-white"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      ))}

      {/* Content Card */}
      <div 
        className="relative z-[102] w-[90%] max-w-md bg-white border border-stone-200 shadow-2xl p-8 transition-all duration-500 pointer-events-auto"
        style={cardStyle}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="border-2 border-[#0C4A6E] px-2 py-0.5">
            <span className="text-[10px] font-black text-[#0C4A6E] tracking-tighter uppercase">
              Dispatch {currentStepIndex + 1}/{STEPS.length}
            </span>
          </div>
          <button 
            onClick={handleComplete}
            className="text-[10px] font-medium text-stone-400 uppercase tracking-widest hover:text-stone-900 transition-colors"
          >
            Skip Tour
          </button>
        </div>

        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4 leading-tight">
          {currentStep.title}
        </h2>
        
        <p className="text-stone-600 leading-relaxed font-serif italic mb-8">
          "{currentStep.content}"
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-4 items-center">
            {currentStepIndex > 0 && (
              <button
                onClick={handleBack}
                className="text-xs font-bold text-stone-400 uppercase tracking-widest hover:text-stone-900 transition-colors"
              >
                Back
              </button>
            )}
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 transition-all duration-300 ${
                    i === currentStepIndex ? "w-6 bg-[#0C4A6E]" : "w-2 bg-stone-200"
                  }`}
                />
              ))}
            </div>
          </div>
          
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-[#0C4A6E] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#075985] transition-all active:scale-95 shadow-[4px_4px_0px_#075985]"
          >
            {currentStepIndex === STEPS.length - 1 ? "Get Started" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
