import { useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lightweight offline mini-game (runner-style)
const MiniRunnerGame: React.FC = () => {
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const obstacleRef = useRef<HTMLDivElement | null>(null);
  const isJumpingRef = useRef(false);
  const velocityRef = useRef(0);
  const playerYRef = useRef(0);
  const speedRef = useRef(3);
  const animationRef = useRef<number | null>(null);

  const jump = () => {
    if (isJumpingRef.current) return;
    isJumpingRef.current = true;
    velocityRef.current = 10; // initial jump impulse
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let obstacleX = 300; // starting position from the right
    let lastTime = performance.now();

    const tick = (time: number) => {
      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      // Gravity and jump physics
      if (isJumpingRef.current || playerYRef.current > 0) {
        velocityRef.current -= 0.6; // gravity
        playerYRef.current = Math.max(0, playerYRef.current + velocityRef.current);
        if (playerRef.current) {
          playerRef.current.style.transform = `translateY(${-playerYRef.current}px)`;
        }
        if (playerYRef.current === 0) {
          isJumpingRef.current = false;
          velocityRef.current = 0;
        }
      }

      // Move obstacle
      obstacleX -= speedRef.current * (dt / 16);
      if (obstacleX < -20) {
        // Reset obstacle and increment score
        obstacleX = 320 + Math.random() * 100;
        setScore((s) => s + 1);
        // Slightly increase speed for challenge, cap it
        speedRef.current = Math.min(7, speedRef.current + 0.1);
      }
      if (obstacleRef.current) {
        obstacleRef.current.style.transform = `translateX(${obstacleX}px)`;
      }

      // Collision detection (simple bounding box)
      if (playerRef.current && obstacleRef.current) {
        const p = playerRef.current.getBoundingClientRect();
        const o = obstacleRef.current.getBoundingClientRect();
        const overlap = !(p.right < o.left || p.left > o.right || p.bottom < o.top || p.top > o.bottom);
        if (overlap) {
          // Reset game state on collision
          speedRef.current = 3;
          obstacleX = 320;
          setScore(0);
        }
      }

      if (running) {
        animationRef.current = requestAnimationFrame(tick);
      }
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [running]);

  return (
    <div className="mt-6 w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2 text-xs text-gray-600 dark:text-gray-300">
        <span>Offline Mini-Game • press Space/Up or tap to jump</span>
        <span>Score: {score}</span>
      </div>
      <div
        className="relative h-32 border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden bg-white dark:bg-gray-900"
        onClick={jump}
        role="button"
        aria-label="Offline jump game"
      >
        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-700" />
        {/* Player */}
        <div
          ref={playerRef}
          className="absolute bottom-1 left-6 w-6 h-6 bg-blue-500 dark:bg-blue-400 rounded-sm shadow"
        />
        {/* Obstacle */}
        <div
          ref={obstacleRef}
          className="absolute bottom-1 left-0 w-6 h-10 bg-rose-500 dark:bg-rose-400 rounded-sm shadow"
          style={{ transform: "translateX(320px)" }}
        />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button
          className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={() => setRunning((r) => !r)}
        >
          {running ? "Pause" : "Resume"}
        </button>
        <button
          className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={() => {
            speedRef.current = 3;
            setScore(0);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [supabaseStatus, setSupabaseStatus] = useState<"loading" | "ok" | "error" | "unknown">("unknown");

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Supabase connectivity check (lightweight, safe, lazy import)
  useEffect(() => {
    let mounted = true;
    const checkSupabase = async () => {
      try {
        setSupabaseStatus("loading");
        const mod = await import("@/lib/supabaseClient");
        const { supabase } = mod;
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) {
          console.warn("Supabase auth check error:", error.message);
          setSupabaseStatus("error");
        } else {
          setSupabaseStatus("ok");
        }
      } catch (e) {
        console.warn("Supabase client not available or failed:", e);
        if (mounted) setSupabaseStatus("error");
      }
    };
    // Only check if online; if offline, it's implicitly not reachable
    if (isOnline) checkSupabase();
    else setSupabaseStatus("error");
    return () => { mounted = false; };
  }, [isOnline]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="text-center max-w-xl w-full">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">404</h1>
          <Compass className="h-10 w-10 text-blue-600 dark:text-blue-500" aria-hidden="true" />
        </div>
        <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">Lost in the Cloud?</p>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          The page you're looking for might have been moved, deleted, or never existed.
        </p>
        <div className="my-5">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate(-1)}>
            Return to Back
          </Button>
        </div>
        <div className="mx-auto max-w-md">
          <hr className="border-gray-300 dark:border-gray-700" />
        </div>

        {/* Connection status hint */}
        <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
          {!isOnline && (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded bg-amber-100 text-amber-800">
              <span>You're offline. Enjoy a quick mini-game below!</span>
            </div>
          )}
          {isOnline && (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-100 dark:bg-slate-800">
              <span>
                {supabaseStatus === "loading" && "Checking Backend connection..."}
                {supabaseStatus === "ok" && "Backend is online."}
                {supabaseStatus === "error" && "Backend connection issue detected."}
                {supabaseStatus === "unknown" && "Backend status unknown."}
              </span>
            </div>
          )}
        </div>

        {/* Show mini-game only when offline */}
        {!isOnline && <MiniRunnerGame />}
      </div>
    </div>
  );
};

export default NotFound;
