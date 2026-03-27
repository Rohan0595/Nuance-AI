// src/App.jsx  –  Full-stack version
import { useState, useEffect, useRef, useCallback } from "react";
import {
  useNewsFeed,
  useSearch,
  useArticleContext,
  useArticleAnalysis,
  useArticlePOV,
  useReel,
  useSavedArticles,
} from "./hooks/useNews";
import { toggleSaveArticle, trackArticleRead, updateProfile } from "./services/api";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATEGORIES = ["All","AI","Geopolitics","Climate","Tech","Health","Economy","Science"];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Spinner({ color = "#94a3b8", size = 36 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid rgba(255,255,255,0.05)`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    }} />
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{ background: "transparent", border: "1px solid #f87171", borderRadius: "8px", padding: "16px", margin: "16px 0", color: "#f87171", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>Error: {message}</span>
      {onRetry && <button onClick={onRetry} style={{ background: "#f87171", border: "none", borderRadius: "4px", color: "#fff", padding: "6px 14px", cursor: "pointer", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Retry</button>}
    </div>
  );
}

function NewsCard({ article, onOpen, onSave }) {
  return (
    <div onClick={() => onOpen(article)} style={{
      background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.1)",
      padding: "24px 0", cursor: "pointer",
      transition: "opacity 0.2s ease",
      position: "relative",
    }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.7"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "10px", color: article.accentColor || "#e2e8f0", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
            {article.category}
          </span>
          <span style={{ width: "4px", height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "50%" }} />
          <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{article.time} · {article.readTime}</span>
        </div>
        <button onClick={e => { e.stopPropagation(); onSave(article.id); }} style={{
          background: "none", border: "none", cursor: "pointer", padding: "2px",
          color: article.saved ? "#fcd34d" : "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px"
        }}>
          <svg viewBox="0 0 24 24" fill={article.saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 14, height: 14}}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          {article.saved ? "SAVED" : "SAVE"}
        </button>
      </div>
      {article.imageUrl && (
        <img src={article.imageUrl} alt={article.headline} style={{
          width: "100%", height: "200px", objectFit: "cover", borderRadius: "12px", marginBottom: "16px", background: "rgba(255,255,255,0.05)"
        }} />
      )}
      <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#f8fafc", lineHeight: "1.3", marginBottom: "10px", fontFamily: "'Outfit', sans-serif" }}>
        {article.headline}
      </h3>
      <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: "1.6", marginBottom: "16px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: "300" }}>
        {article.summary}
      </p>
      <span style={{ fontSize: "11px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{article.source}</span>
    </div>
  );
}

function GaugeCard({ label, score, color, explanation, icon }) {
  const [expanded, setExpanded] = useState(false);
  const radius = 45;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Fallback to 0 if score is invalid
  const safeScore = isNaN(score) ? 0 : score;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div style={{ 
      background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)", 
      border: "1px solid rgba(255,255,255,0.08)", 
      borderRadius: "24px", 
      padding: "24px", 
      marginBottom: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "24px", zIndex: 1, position: "relative" }}>
        <div style={{ position: "relative", width: radius*2, height: radius*2, flexShrink: 0 }}>
          <svg height={radius * 2} width={radius * 2} style={{ transform: "rotate(-90deg)", filter: `drop-shadow(0 0 6px ${color}80)` }}>
            <circle stroke="rgba(255,255,255,0.05)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
            <circle stroke={color} fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset, transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ fontSize: "24px", fontWeight: "800", color: "#f8fafc", fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{safeScore}</span>
          </div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "11px", color: color, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "800", marginBottom: "4px" }}>{icon}</div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#f8fafc", fontFamily: "'Outfit', sans-serif", margin: 0 }}>{label}</h3>
          </div>
          
          <button 
            onClick={() => setExpanded(!expanded)} 
            style={{
              background: `linear-gradient(135deg, ${color}15, transparent)`,
              border: `1px solid ${color}40`,
              borderRadius: "50px",
              padding: "8px 16px",
              color: color,
              fontSize: "12px",
              fontWeight: "800",
              cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              textTransform: "uppercase",
              letterSpacing: "1px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: `0 4px 12px ${color}10`,
              marginTop: "4px"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${color}25`;
              e.currentTarget.style.boxShadow = `0 6px 16px ${color}30`;
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${color}15, transparent)`;
              e.currentTarget.style.boxShadow = `0 4px 12px ${color}10`;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {expanded ? "Close" : "Know Why"}
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{
                width: 14, height: 14, 
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)", 
                transition: "transform 0.3s ease"
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>
      
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px", animation: "fadeInUp 0.3s ease" }}>
          <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6", fontWeight: "300", zIndex: 1, margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{explanation}</p>
        </div>
      )}
    </div>
  );
}

function PovEngine({ pov }) {
  const [step, setStep] = useState(0);
  const [votedSide, setVotedSide] = useState(null);
  const [shiftSlider, setShiftSlider] = useState(50);
  const [viewChanged, setViewChanged] = useState(null);

  const tensionScore = Math.min(100, Math.max(20, 30 + (pov.rebuttals?.sideA?.length || 0) * 20 + (pov.grayAreas?.length || 0) * 10));

  let tensionLabel = "Consensus";
  if (tensionScore > 45) tensionLabel = "Active Debate";
  if (tensionScore > 75) tensionLabel = "High Conflict";

  const renderStepIndicators = () => (
    <div style={{ display: "flex", gap: "8px", marginBottom: "24px", justifyContent: "center" }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{ height: "4px", flex: 1, background: i <= step ? "#f8fafc" : "rgba(255,255,255,0.1)", borderRadius: "2px", transition: "background 0.3s" }} />
      ))}
    </div>
  );

  return (
    <div style={{ animation: "fadeInUp 0.4s ease forwards", fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: "100px" }}>
      {renderStepIndicators()}

      {step === 0 && (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
          {/* Tension Meter */}
          <div style={{ marginBottom: "32px", padding: "24px", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>
              <span style={{ color: "#94a3b8" }}>Tension Meter</span>
              <span style={{ color: tensionScore > 75 ? "#ef4444" : tensionScore > 45 ? "#f59e0b" : "#10b981" }}>{tensionLabel}</span>
            </div>
            <div style={{ height: "8px", width: "100%", background: "linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%)", borderRadius: "4px", position: "relative" }}>
              <div style={{ position: "absolute", top: "-6px", bottom: "-6px", width: "4px", background: "#fff", left: `${tensionScore}%`, borderRadius: "2px", boxShadow: "0 0 10px rgba(255,255,255,0.8)", transition: "left 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "11px", color: "#64748b", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
              <span>Low Friction</span>
              <span>High Conflict</span>
            </div>
          </div>

          <div style={{ 
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)", 
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "24px", 
            padding: "40px", 
            textAlign: "left",
            boxShadow: "0 10px 30px -10px rgba(99, 102, 241, 0.2)"
          }}>
            <div style={{ fontSize: "12px", color: "#818cf8", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "800", marginBottom: "16px" }}>Debate Motion</div>
            <h3 style={{ fontSize: "28px", fontWeight: "700", color: "#f8fafc", marginBottom: "16px", lineHeight: "1.3", fontFamily: "'Outfit', sans-serif" }}>{pov.debateFraming?.motion || "Debate"}</h3>
            <p style={{ fontSize: "16px", color: "#cbd5e1", lineHeight: "1.7", fontWeight: "300", marginBottom: "32px", margin: "0 0 32px 0", textAlign: "justify" }}>{pov.debateFraming?.relevance}</p>
            
            <button 
              onClick={() => setStep(1)}
              style={{
                width: "100%",
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: "50px",
                padding: "16px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
                transition: "background 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#4f46e5"}
              onMouseLeave={e => e.currentTarget.style.background = "#6366f1"}
            >
              Step Into The Perspectives ➔
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div style={{ animation: "fadeInRight 0.4s ease", background: "linear-gradient(to bottom, rgba(59, 130, 246, 0.05), transparent)", border: "1px solid rgba(59, 130, 246, 0.1)", borderTop: "4px solid #3b82f6", borderRadius: "24px", padding: "40px", minHeight: "50vh", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "800", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px" }}>Perspective A</div>
          <h4 style={{ color: "#f8fafc", fontSize: "32px", fontWeight: "800", marginBottom: "32px", fontFamily: "'Outfit', sans-serif", lineHeight: "1.2" }}>{pov.positioning?.sideA}</h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", flex: 1 }}>
            {(pov.coreArguments?.sideA || []).slice(0, 3).map((arg, i) => (
              <div key={i}>
                <strong style={{ fontSize: "18px", color: "#bfdbfe", display: "block", marginBottom: "8px", fontFamily: "'Outfit', sans-serif", fontWeight: "700" }}>{arg.title}</strong>
                <span style={{ fontSize: "15px", color: "#94a3b8", lineHeight: "1.6", fontWeight: "300", display: "block", textAlign: "justify" }}>{arg.detail}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
            <button 
              onClick={() => setStep(0)}
              style={{ flex: "0 0 80px", background: "rgba(255,255,255,0.05)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50px", padding: "16px 0", fontSize: "15px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            >
              ← Back
            </button>
            <button 
              onClick={() => setStep(2)}
              style={{ flex: 1, background: "#3b82f6", color: "#fff", border: "none", borderRadius: "50px", padding: "16px", fontSize: "15px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#2563eb"}
              onMouseLeave={e => e.currentTarget.style.background = "#3b82f6"}
            >
              Switch to Perspective B ➔
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ animation: "fadeInRight 0.4s ease", background: "linear-gradient(to bottom, rgba(239, 68, 68, 0.05), transparent)", border: "1px solid rgba(239, 68, 68, 0.1)", borderTop: "4px solid #ef4444", borderRadius: "24px", padding: "40px", minHeight: "50vh", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "800", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px" }}>Perspective B</div>
          <h4 style={{ color: "#f8fafc", fontSize: "32px", fontWeight: "800", marginBottom: "32px", fontFamily: "'Outfit', sans-serif", lineHeight: "1.2" }}>{pov.positioning?.sideB}</h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", flex: 1 }}>
            {(pov.coreArguments?.sideB || []).slice(0, 3).map((arg, i) => (
              <div key={i}>
                <strong style={{ fontSize: "18px", color: "#fecaca", display: "block", marginBottom: "8px", fontFamily: "'Outfit', sans-serif", fontWeight: "700" }}>{arg.title}</strong>
                <span style={{ fontSize: "15px", color: "#94a3b8", lineHeight: "1.6", fontWeight: "300", display: "block", textAlign: "justify" }}>{arg.detail}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
            <button 
              onClick={() => setStep(1)}
              style={{ flex: "0 0 80px", background: "rgba(255,255,255,0.05)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50px", padding: "16px 0", fontSize: "15px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            >
              ← Back
            </button>
            <button 
              onClick={() => setStep(3)}
              style={{ flex: 1, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50px", padding: "16px", fontSize: "15px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#dc2626"}
              onMouseLeave={e => e.currentTarget.style.background = "#ef4444"}
            >
              Review Neutral Synthesis & Vote ➔
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ animation: "fadeInUp 0.4s ease" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.02) 100%)", border: "1px solid rgba(234, 179, 8, 0.3)", borderRadius: "20px", padding: "32px", textAlign: "left", marginBottom: "40px" }}>
            <div style={{ fontSize: "12px", color: "#fcd34d", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px", fontWeight: "800" }}>Engine Synthesis</div>
            <p style={{ fontSize: "17px", color: "#f8fafc", lineHeight: "1.7", fontWeight: "400", fontFamily: "'Outfit', sans-serif", margin: 0, textAlign: "justify" }}>{pov.neutralSynthesis}</p>
          </div>

          <div style={{ marginBottom: "40px" }}>
             <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#fff", marginBottom: "24px", textAlign: "left", fontFamily: "'Outfit', sans-serif" }}>Which side makes more sense?</h3>
             <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
               <button onClick={() => setVotedSide('A')} style={{ background: votedSide === 'A' ? "#3b82f6" : "rgba(59, 130, 246, 0.1)", border: votedSide === 'A' ? "none" : "1px solid rgba(59, 130, 246, 0.3)", color: votedSide === 'A' ? "#fff" : "#bfdbfe", padding: "16px", borderRadius: "16px", fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <div>
                   <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px", color: votedSide === 'A' ? "#93c5fd" : "#60a5fa" }}>Side A</div>
                   {pov.positioning?.sideA}
                 </div>
                 {votedSide === 'A' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
               </button>
               
               <button onClick={() => setVotedSide('B')} style={{ background: votedSide === 'B' ? "#ef4444" : "rgba(239, 68, 68, 0.1)", border: votedSide === 'B' ? "none" : "1px solid rgba(239, 68, 68, 0.3)", color: votedSide === 'B' ? "#fff" : "#fecaca", padding: "16px", borderRadius: "16px", fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <div>
                   <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px", color: votedSide === 'B' ? "#fca5a5" : "#f87171" }}>Side B</div>
                   {pov.positioning?.sideB}
                 </div>
                 {votedSide === 'B' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
               </button>
               
               <button onClick={() => setVotedSide('Neutral')} style={{ background: votedSide === 'Neutral' ? "#475569" : "rgba(148, 163, 184, 0.1)", border: votedSide === 'Neutral' ? "none" : "1px solid rgba(148, 163, 184, 0.3)", color: votedSide === 'Neutral' ? "#fff" : "#cbd5e1", padding: "16px", borderRadius: "16px", fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 Neutral / Undecided
                 {votedSide === 'Neutral' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
               </button>
             </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "24px", padding: "32px", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "32px", textAlign: "left" }}>
             <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#f8fafc", marginBottom: "8px", textAlign: "left", fontFamily: "'Outfit', sans-serif" }}>Signature Feature: Shift View</h3>
             <p style={{ color: "#94a3b8", fontSize: "14px", textAlign: "left", marginBottom: "40px", fontWeight: "300", lineHeight: "1.6" }}>Where did your perspective land after exploring both sides? Drag the slider to set your stance.</p>
             
             <div style={{ marginBottom: "40px" }}>
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>
                 <span style={{ color: "#60a5fa" }}>Side A Focus</span>
                 <span style={{ color: "#cbd5e1" }}>Neutral</span>
                 <span style={{ color: "#f87171" }}>Side B Focus</span>
               </div>
               <input 
                 type="range" 
                 min="0" max="100" 
                 value={shiftSlider} 
                 onChange={(e) => setShiftSlider(e.target.value)}
                 style={{ 
                   width: "100%", 
                   height: "8px",
                   borderRadius: "4px",
                   WebkitAppearance: "none",
                   background: "linear-gradient(to right, #3b82f6 0%, #cbd5e1 50%, #ef4444 100%)",
                   cursor: "pointer",
                   outline: "none"
                 }}
               />
               <div style={{ textAlign: "center", marginTop: "16px", fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>
                 {shiftSlider <= 45 ? "Leaning towards Side A" : shiftSlider >= 55 ? "Leaning towards Side B" : "Balanced View"}
               </div>
             </div>

             <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "32px", textAlign: "left" }}>
               <h4 style={{ fontSize: "15px", color: "#f8fafc", marginBottom: "20px", fontWeight: "600", textAlign: "left" }}>Did this coverage change your view?</h4>
               <div style={{ display: "flex", gap: "16px", justifyContent: "flex-start" }}>
                 <button onClick={() => setViewChanged(true)} style={{ flex: 1, padding: "14px", borderRadius: "12px", background: viewChanged === true ? "#10b981" : "rgba(255,255,255,0.05)", color: viewChanged === true ? "#fff" : "#cbd5e1", border: "1px solid " + (viewChanged === true ? "#10b981" : "rgba(255,255,255,0.1)"), cursor: "pointer", fontWeight: "700", transition: "all 0.2s", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                   Yes, it did
                   {viewChanged === true && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                 </button>
                 <button onClick={() => setViewChanged(false)} style={{ flex: 1, padding: "14px", borderRadius: "12px", background: viewChanged === false ? "#475569" : "rgba(255,255,255,0.05)", color: viewChanged === false ? "#fff" : "#cbd5e1", border: "1px solid " + (viewChanged === false ? "#475569" : "rgba(255,255,255,0.1)"), cursor: "pointer", fontWeight: "700", transition: "all 0.2s", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                   No, it didn't
                   {viewChanged === false && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                 </button>
               </div>
             </div>
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              onClick={() => setStep(2)}
              style={{ flex: "0 0 80px", background: "rgba(255,255,255,0.05)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50px", padding: "16px 0", fontSize: "14px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            >
              ← Back
            </button>
            <button 
              onClick={() => { setStep(0); setVotedSide(null); setShiftSlider(50); setViewChanged(null); }}
              style={{ flex: 1, background: "transparent", color: "#64748b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50px", padding: "16px", fontSize: "14px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#f8fafc"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            >
              Restart Engine
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Article Detail with AI context from backend ──────────────────────────────
function ArticleDetail({ article, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState("article");
  
  useEffect(() => {
    if (article?.category) trackArticleRead(article.category);
  }, [article?.category]);
  
  const { context, loading: contextLoading, error: contextError } = useArticleContext(article, activeTab === "summary" || activeTab === "context");
  const { analysis, loading: analysisLoading, error: analysisError } = useArticleAnalysis(article, activeTab === "analysis");
  const { pov, loading: povLoading, error: povError } = useArticlePOV(article, activeTab === "pov");

  const tabs = [
    { id: "article", label: "Article" },
    { id: "summary", label: "Summary" },
    { id: "pov", label: "POV Engine" },
    { id: "context", label: "Context" },
    { id: "analysis", label: "Analysis" },
  ];

  const ContextSection = ({ title, content, color }) => (
    <div style={{ background: "transparent", borderBottom: `1px solid rgba(255,255,255,0.08)`, paddingBottom: "20px", marginBottom: "20px" }}>
      <div style={{ fontSize: "11px", fontWeight: "700", color: color || "#e2e8f0", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px" }}>{title}</div>
      <p style={{ fontSize: "15px", color: "#cbd5e1", lineHeight: "1.7", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: "300" }}>{content}</p>
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#050505" }}>
      <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onClose} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: "36px", height: "36px", color: "#f8fafc", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "10px", color: article.accentColor || "#e2e8f0", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1.5px" }}>{article.category} · {article.source}</div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{article.time} · {article.readTime} read</div>
        </div>
        <button onClick={() => onSave(article.id)} style={{ background: "none", border: "none", cursor: "pointer", color: article.saved ? "#fcd34d" : "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "6px" }}>
          <svg viewBox="0 0 24 24" fill={article.saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 16, height: 16}}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          {article.saved ? "Saved" : "Save"}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#f8fafc", lineHeight: "1.3", marginBottom: "20px", fontFamily: "'Outfit', sans-serif" }}>{article.headline}</h1>

        {article.imageUrl && (
          <div style={{ marginBottom: "32px", borderRadius: "16px", overflow: "hidden" }}>
            <img src={article.imageUrl} alt={article.headline} style={{ width: "100%", maxHeight: "400px", objectFit: "cover", display: "block", background: "rgba(255,255,255,0.05)" }} />
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
          {(article.tags || []).map(t => (
            <span key={t} style={{ fontSize: "11px", border: "1px solid rgba(255,255,255,0.15)", color: "#94a3b8", padding: "4px 12px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t}</span>
          ))}
        </div>

        <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px", marginBottom: "32px", overflowX: "auto" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "8px 16px", background: "transparent", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600",
              color: activeTab === tab.id ? "#f8fafc" : "#64748b",
              borderBottom: activeTab === tab.id ? `2px solid ${article.accentColor || "#f8fafc"}` : "2px solid transparent",
              transition: "all 0.2s ease", textTransform: "uppercase", letterSpacing: "1px", whiteSpace: "nowrap"
            }}>{tab.label}</button>
          ))}
        </div>

        {(contextLoading || analysisLoading || povLoading) && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spinner color={article.accentColor} />
            <p style={{ color: "#475569", fontSize: "14px", marginTop: "20px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Processing analysis...</p>
          </div>
        )}

        {(contextError || analysisError || povError) && <ErrorBanner message={contextError || analysisError || povError} />}

        {activeTab === "article" && (
          <div style={{ padding: "10px 0", animation: "fadeInUp 0.4s ease forwards" }}>
            <p style={{ fontSize: "17px", color: "#e2e8f0", lineHeight: "1.8", whiteSpace: "pre-wrap", fontFamily: "'Outfit', sans-serif" }}>
              {article.content || article.summary || "Full content unavailable."}
            </p>
            {article.url && (
              <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <a href={article.url} target="_blank" rel="noreferrer" style={{ color: article.accentColor || "#e2e8f0", fontSize: "12px", textDecoration: "none", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}>
                  Read Original Source →
                </a>
              </div>
            )}
          </div>
        )}

        {!contextLoading && context && activeTab === "summary" && (
          <div style={{ animation: "fadeInUp 0.4s ease forwards" }}>
            <ContextSection title="Summary"            content={context.aiSummary}          color={article.accentColor} />
            <ContextSection title="Why It Matters"     content={context.whyItMatters}        color="#e2e8f0" />
            <ContextSection title="Background"         content={context.whatHappenedBefore}  color="#94a3b8" />
            <ContextSection title="Implications"       content={context.implications}        color="#cbd5e1" />
          </div>
        )}

        {!contextLoading && context && activeTab === "context" && (
          <div style={{ animation: "fadeInUp 0.4s ease forwards" }}>
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "24px", marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "700" }}>Key Entities</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(context.keyEntities || []).map(e => (
                  <span key={e} style={{ fontSize: "13px", border: "1px solid rgba(255,255,255,0.15)", color: "#e2e8f0", padding: "6px 14px", borderRadius: "4px", fontFamily: "'Outfit', sans-serif" }}>{e}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "700" }}>Topic Tags</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(context.topicTags || []).map(t => (
                  <span key={t} style={{ fontSize: "12px", color: "#94a3b8", padding: "4px 0", marginRight: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>#{t}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {!analysisLoading && analysis && activeTab === "analysis" && (
          <div style={{ animation: "fadeInUp 0.4s ease forwards", padding: "10px 0" }}>
            <GaugeCard icon="Credibility Score" label="Trust & Credibility" score={analysis.trustScore || 85} color="#10b981" explanation={analysis.trustExplanation} />
            <GaugeCard icon="Risk Level" label="Bias Indication" score={analysis.biasScore || 20} color="#fcd34d" explanation={analysis.biasExplanation} />
            <GaugeCard icon="Alert Status" label="Misinformation Alert" score={analysis.misinfoScore || 5} color="#f43f5e" explanation={analysis.misinfoExplanation} />
          </div>
        )}

        {!povLoading && pov && activeTab === "pov" && (
          <PovEngine pov={pov} />
        )}
      </div>
    </div>
  );
}

// ─── Reels View (uses useReel hook per article) ───────────────────────────────
function ReelSlide({ article }) {
  const { reel, loading } = useReel(article);
  const lines = reel?.reelScript?.split("\n").filter(Boolean) || [article.summary];

  return (
    <div>
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "20px 0" }}>
          <Spinner color={article.accentColor} size={20} />
          <span style={{ color: "#64748b", fontSize: "13px" }}>Generating reel...</span>
        </div>
      ) : (
        <div>
          {lines.map((line, i) => (
            <p key={i} style={{
              fontSize: i === 0 ? "19px" : "15px",
              fontWeight: i === 0 ? "800" : "500",
              color: i === 0 ? "#f1f5f9" : "#94a3b8",
              lineHeight: "1.4", marginBottom: "8px",
              fontFamily: i === 0 ? "'Outfit', sans-serif" : "inherit",
              animation: "fadeInUp 0.4s ease forwards",
              animationDelay: `${i * 0.1}s`, opacity: 0,
            }}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function ReelsView({ articles }) {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef(null);

  const article = articles[current];

  const handleTouchStart = e => { touchStart.current = e.touches[0].clientY; };
  const handleTouchEnd = e => {
    if (!touchStart.current) return;
    const delta = touchStart.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 50) {
      if (delta > 0 && current < articles.length - 1) setCurrent(c => c + 1);
      if (delta < 0 && current > 0) setCurrent(c => c - 1);
    }
    touchStart.current = null;
  };

  if (!article) return <div style={{ textAlign: "center", padding: "60px", color: "#475569" }}>No articles available.</div>;

  return (
    <div style={{ height: "100%", position: "relative", overflow: "hidden", background: "#080c14" }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div style={{ position: "absolute", inset: 0, background: article.imageGradient, transition: "background 0.5s ease" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${article.accentColor}15 0%, transparent 70%)` }} />

      <div style={{ position: "absolute", top: "16px", left: "16px", right: "16px", display: "flex", gap: "4px", zIndex: 10 }}>
        {articles.map((_, i) => (
          <div key={i} onClick={() => setCurrent(i)} style={{
            flex: 1, height: "3px", borderRadius: "2px", cursor: "pointer",
            background: i === current ? article.accentColor : "rgba(255,255,255,0.2)",
            transition: "background 0.3s ease",
          }} />
        ))}
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 20px 32px", background: "linear-gradient(to top, rgba(8,12,20,0.97) 0%, transparent 100%)" }}>
        <div style={{ marginBottom: "12px" }}>
          <span style={{ fontSize: "10px", background: `${article.accentColor}25`, color: article.accentColor, padding: "4px 10px", borderRadius: "20px", fontWeight: "700" }}>
            {article.category?.toUpperCase()} · {article.source}
          </span>
        </div>
        <ReelSlide article={article} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <span style={{ color: "#475569", fontSize: "12px" }}>{current + 1} / {articles.length}</span>
        </div>
      </div>

      {current > 0 && (
        <button onClick={() => setCurrent(c => c - 1)} style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -70px)",
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "50%", width: "40px", height: "40px", color: "#94a3b8", cursor: "pointer", fontSize: "16px",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5,
        }}>↑</button>
      )}
      {current < articles.length - 1 && (
        <button onClick={() => setCurrent(c => c + 1)} style={{
          position: "absolute", bottom: "160px", left: "50%", transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "50%", width: "40px", height: "40px", color: "#94a3b8", cursor: "pointer", fontSize: "18px",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5,
        }}>↓</button>
      )}
    </div>
  );
}

// ─── Search View ──────────────────────────────────────────────────────────────
function SearchView({ onOpenArticle }) {
  const [query, setQuery]   = useState("");
  const [savedIds, setSaved]= useState(new Set());
  const { results, loading, error, searched, search } = useSearch();

  const handleSearch = () => search(query);

  const toggleSave = async (id) => {
    const article = results.find(a => a.id === id);
    if (!article) return;
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    try { await toggleSaveArticle({ ...article, saved: !savedIds.has(id) }); } catch (_) {}
  };

  return (
    <div style={{ padding: "20px", overflowY: "auto", height: "100%" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#f1f5f9", marginBottom: "4px" }}>Search</h2>
      <p style={{ fontSize: "13px", color: "#475569", marginBottom: "20px" }}>Real-time news discovery</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="Search any topic..." style={{
            flex: 1, padding: "12px 16px", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", color: "#f1f5f9",
            fontSize: "14px", outline: "none",
          }} />
        <button onClick={handleSearch} disabled={loading} style={{
          padding: "12px 18px", background: "#6366f1", border: "none", borderRadius: "14px",
          color: "#fff", cursor: loading ? "wait" : "pointer", fontWeight: "700", fontSize: "14px", opacity: loading ? 0.7 : 1,
        }}>
          {loading ? "..." : "→"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "20px" }}>
        {CATEGORIES.slice(1).map(cat => (
          <button key={cat} onClick={() => { setQuery(cat); search(cat); }} style={{
            padding: "7px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px", color: "#94a3b8", cursor: "pointer", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap",
          }}>{cat}</button>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}

      {loading && <div style={{ textAlign: "center", padding: "40px" }}>
        <Spinner /><p style={{ color: "#475569", fontSize: "14px", marginTop: "12px" }}>Searching live news...</p>
      </div>}

      {!loading && searched && results.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "40px", color: "#475569" }}>No results found.</div>
      )}

      {!loading && results.map(article => (
        <NewsCard key={article.id} article={{ ...article, saved: savedIds.has(article.id) }}
          onOpen={onOpenArticle} onSave={toggleSave} />
      ))}

      {!searched && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#f8fafc", marginBottom: "12px", fontFamily: "'Outfit', sans-serif" }}>Discover</div>
          <p style={{ color: "#64748b", fontSize: "14px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Search any topic for real-time analysis</p>
        </div>
      )}
    </div>
  );
}

// ─── Saved View ───────────────────────────────────────────────────────────────
function SavedView({ onOpenArticle, onSave }) {
  const { saved, loading } = useSavedArticles();
  return (
    <div style={{ padding: "20px", overflowY: "auto", height: "100%" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#f1f5f9", marginBottom: "4px" }}>Saved</h2>
      <p style={{ fontSize: "13px", color: "#475569", marginBottom: "20px" }}>{saved.length} article{saved.length !== 1 ? "s" : ""} saved</p>
      {loading && <div style={{ textAlign: "center", padding: "40px" }}><Spinner /></div>}
      {!loading && saved.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#f8fafc", marginBottom: "12px", fontFamily: "'Outfit', sans-serif" }}>Library Empty</div>
          <p style={{ color: "#64748b", fontSize: "14px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Articles you save will appear here</p>
        </div>
      )}
      {!loading && saved.map(a => <NewsCard key={a.id} article={a} onOpen={onOpenArticle} onSave={onSave} />)}
    </div>
  );
}

// ─── Authentication Flow ────────────────────────────────────────────────────────
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { loginUser, registerUser, phoneLoginUser, forgotPasswordUser } from "./services/api";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "./firebase";

function AuthScreen() {
  const { login } = useContext(AuthContext);
  const [mode, setMode] = useState("login"); // login, register, forgot, phone
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
  };

  const handleSendOtp = async () => {
    try {
      setLoading(true); setError(""); setMessage("");
      setupRecaptcha();
      const formatPhone = phone.startsWith("+") ? phone : `+${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, formatPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setShowOtp(true);
      setMessage("OTP sent via SMS!");
    } catch (err) {
      setError("OTP blocked: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true); setError(""); setMessage("");
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      const authData = await phoneLoginUser(idToken);
      login(authData.user, authData.token);
    } catch (err) {
      setError("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      if (mode === "register") {
        const data = await registerUser(formData.name, formData.email, formData.password);
        login(data.user, data.token);
      } else if (mode === "login") {
        const data = await loginUser(formData.email, formData.password);
        login(data.user, data.token);
      } else if (mode === "forgot") {
        const data = await forgotPasswordUser(formData.email);
        setMessage(data.message);
        setMode("login");
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "12px" };
  const btnStyle = { width: "100%", padding: "14px", background: "#6366f1", border: "none", borderRadius: "14px", color: "#fff", cursor: loading ? "wait" : "pointer", fontWeight: "700", fontSize: "15px", marginBottom: "16px", opacity: loading ? 0.7 : 1 };

  return (
    <div style={{ padding: "30px 24px", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#f1f5f9", marginBottom: "8px" }}>
          {mode === "login" ? "Welcome back" : mode === "register" ? "Create account" : mode === "phone" ? "Enter Phone" : "Reset password"}
        </h2>
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>
          {mode === "login" ? "Log in to save articles and unlock features." : mode === "register" ? "Join to personalize your news feed." : mode === "phone" ? "We'll text you a verification code." : "Enter your email to receive a reset link."}
        </p>
      </div>

      {error && <div style={{ background: "#2d1515", color: "#f87171", padding: "12px", borderRadius: "10px", fontSize: "13px", marginBottom: "20px", textAlign: "center", border: "1px solid #f87171" }}>{error}</div>}
      {message && <div style={{ background: "#062f22", color: "#34d399", padding: "12px", borderRadius: "10px", fontSize: "13px", marginBottom: "20px", textAlign: "center", border: "1px solid #34d399" }}>{message}</div>}

      <div id="recaptcha-container"></div>

      {mode === "phone" ? (
        <div style={{ marginBottom: "24px" }}>
          {!showOtp ? (
            <>
              <input required type="tel" placeholder="+1 234 567 8900" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
              <button type="button" onClick={handleSendOtp} disabled={loading || !phone} style={btnStyle}>
                {loading ? "Sending..." : "Send Code"}
              </button>
            </>
          ) : (
            <>
              <input required type="text" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} style={inputStyle} />
              <button type="button" onClick={handleVerifyOtp} disabled={loading || otp.length < 6} style={btnStyle}>
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
            </>
          )}
          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <span onClick={() => { setMode("login"); setShowOtp(false); setError(""); }} style={{ color: "#818cf8", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}>Cancel</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginBottom: "24px" }}>
          {mode === "register" && (
            <input required type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
          )}
          <input required type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
          {mode !== "forgot" && (
            <input required type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={inputStyle} />
          )}

          {mode === "login" && (
            <div style={{ textAlign: "right", marginBottom: "20px" }}>
              <span onClick={() => { setMode("forgot"); setError(""); setMessage(""); }} style={{ color: "#818cf8", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}>Forgot Password?</span>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ ...btnStyle, marginTop: mode === "login" ? 0 : "8px" }}>
            {loading ? "Please wait..." : mode === "login" ? "Log In" : mode === "register" ? "Sign Up" : "Send Reset Link"}
          </button>
        </form>
      )}

      {mode !== "forgot" && mode !== "phone" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Or</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
          </div>

          <button onClick={() => setMode("phone")} type="button" style={{ 
            width: "100%", padding: "14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", 
            borderRadius: "14px", color: "#f1f5f9", cursor: "pointer", fontWeight: "700", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontFamily: "'Plus Jakarta Sans', sans-serif" 
          }}>
             Continue with Phone (SMS)
          </button>
        </>
      )}

      {mode !== "phone" && (
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <span style={{ color: "#64748b", fontSize: "13px" }}>
            {mode === "login" ? "Don't have an account? " : mode === "register" ? "Already have an account? " : "Remembered your password? "}
          </span>
          <span onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setMessage(""); }} style={{ color: "#f1f5f9", fontSize: "13px", cursor: "pointer", fontWeight: "700" }}>
            {mode === "login" ? "Sign up" : "Log in"}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Profile View ─────────────────────────────────────────────────────────────
function ProfileView() {
  const { user, login, logout, AuthLoading } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", password: "", topicsFollowing: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || "", password: "", topicsFollowing: user.topicsFollowing || [] });
    }
  }, [user]);

  if (AuthLoading) return <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><Spinner /></div>;
  if (!user) return <AuthScreen />;

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await updateProfile(formData);
      if (res.success) {
        login(res.user, localStorage.getItem("news_auth_token"));
        setEditing(false);
      }
    } catch(err) {
      alert("Error saving profile");
    }
    setLoading(false);
  };

  const toggleTopic = (t) => {
    setFormData(prev => ({
      ...prev,
      topicsFollowing: prev.topicsFollowing.includes(t) ? prev.topicsFollowing.filter(x => x !== t) : [...prev.topicsFollowing, t]
    }));
  };

  const allTopics = ["AI", "Technology", "Business", "Climate", "Politics", "Design", "Science", "Geopolitics"];
  const totalRead = user.articlesRead || 0;
  
  // Extract and sort category stats
  const statsMap = user.categoryStats || {};
  const statsEntries = Object.entries(statsMap).sort((a,b) => b[1] - a[1]).slice(0, 4);
  const maxStat = statsEntries.length ? statsEntries[0][1] : 1;

  if (editing) {
    return (
      <div style={{ padding: "24px", overflowY: "auto", height: "100%", animation: "fadeInUp 0.3s ease", paddingBottom: "100px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#f8fafc", marginBottom: "24px", fontFamily: "'Outfit', sans-serif" }}>Settings</h2>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}>Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f8fafc", marginTop: "8px", outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}>New Password</label>
          <input type="password" placeholder="Leave blank to keep same" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f8fafc", marginTop: "8px", outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
        </div>

        <div style={{ marginBottom: "32px" }}>
          <label style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700", display: "block", marginBottom: "12px" }}>Topics You Like</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {allTopics.map(t => {
              const active = formData.topicsFollowing.includes(t);
              return (
                <button key={t} onClick={() => toggleTopic(t)} type="button" style={{
                  padding: "8px 16px", borderRadius: "20px", border: active ? "1px solid #fcd34d" : "1px solid rgba(255,255,255,0.1)",
                  background: active ? "rgba(252,211,77,0.1)" : "transparent",
                  color: active ? "#fcd34d" : "#94a3b8", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.2s ease"
                }}>{t}</button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => setEditing(false)} style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "14px", color: "#f1f5f9", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ flex: 1, padding: "14px", background: "#fcd34d", border: "none", borderRadius: "14px", color: "#000", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", overflowY: "auto", height: "100%", paddingBottom: "100px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "20px", cursor: "pointer", padding: "4px" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 20, height: 20}}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>

      <div style={{ textAlign: "center", padding: "0 0 24px" }}>
        <div style={{ width: "80px", height: "80px", background: "linear-gradient(135deg, #fcd34d, #f59e0b)", borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", color: "#000", fontWeight: "800", fontFamily: "'Outfit', sans-serif" }}>
          {user.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#f8fafc", marginBottom: "4px", fontFamily: "'Outfit', sans-serif" }}>{user.name}</h2>
        <p style={{ fontSize: "13px", color: "#94a3b8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user.email || user.phone || "Reader"}</p>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#fcd34d", marginBottom: "4px", fontFamily: "'Outfit', sans-serif" }}>{totalRead}</div>
          <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}>Articles Read</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#fcd34d", marginBottom: "4px", fontFamily: "'Outfit', sans-serif" }}>{user.topicsFollowing?.length || "All"}</div>
          <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}>Followed</div>
        </div>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", marginBottom: "16px", fontFamily: "'Outfit', sans-serif", letterSpacing: "0.5px" }}>Reading Habits</h3>
        {statsEntries.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>Read some articles to see your stats here.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {statsEntries.map(([cat, count]) => (
              <div key={cat}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#cbd5e1", marginBottom: "6px", fontWeight: "600", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <span>{cat}</span>
                  <span>{count}</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(count / maxStat) * 100}%`, background: "linear-gradient(90deg, #fcd34d, #fbbf24)", borderRadius: "3px", transition: "width 1s ease-out" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={logout} style={{ width: "100%", padding: "14px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "14px", color: "#f87171", cursor: "pointer", fontWeight: "700", fontSize: "14px", marginTop: "20px" }}>
        Log Out
      </button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const { user } = useContext(AuthContext); // consumes AuthProvider from main.jsx
  const [activeTab, setActiveTab]           = useState("home");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchOpenArticle, setSearchOpenArticle] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const topicsStr = user?.topicsFollowing?.join(",") || "";
  const { articles, loading, error, refresh, toggleSave } = useNewsFeed(activeCategory, topicsStr);


  const handleToggleSave = (id) => {
    if (!user) {
      alert("Please log in to save articles.");
      setActiveTab("profile");
      return;
    }
    toggleSave(id);
  };

  const filteredArticles = articles; // backend already filters by category

  const navItems = [
    { id: "home",    label: "Home",    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 22, height: 22}}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: "search",  label: "Search",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 22, height: 22}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
    { id: "saved",   label: "Saved",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 22, height: 22}}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
    { id: "profile", label: "Profile", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 22, height: 22}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  const showDetail       = selectedArticle     && activeTab === "home";
  const showSearchDetail = searchOpenArticle   && activeTab === "search";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030711; font-family: 'Outfit', sans-serif; }
        ::-webkit-scrollbar { width: 0; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030711", padding: "20px" }}>
        <div style={{
          width: "390px", height: "820px", background: "#080c14",
          borderRadius: "44px", overflow: "hidden", position: "relative",
          boxShadow: "0 0 0 8px #111827, 0 0 0 10px #1f2937, 0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(99,102,241,0.08)",
          display: "flex", flexDirection: "column", fontFamily: "'Outfit', sans-serif",
        }}>
          {/* Status bar */}
          <div style={{ padding: "14px 24px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#f1f5f9" }}>9:41</span>
            <div style={{ width: "120px", height: "28px", background: "#111827", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "80px", height: "8px", background: "#1e293b", borderRadius: "10px" }} />
            </div>
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "#64748b" }}>●●●</span>
            </div>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>

            {/* HOME */}
            {activeTab === "home" && !showDetail && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease" }}>
                <div style={{ padding: "8px 20px 0", flexShrink: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#f8fafc", fontFamily: "'Outfit', sans-serif", fontStyle: "italic", letterSpacing: "1px", marginBottom: "4px" }}>
                        Nuance<span style={{ color: "#fcd34d" }}>.</span>
                      </h1>
                      <p style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Not everything is obvious.</p>
                    </div>
                    <button onClick={refresh} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "6px 12px", color: "#94a3b8", cursor: "pointer", fontSize: "12px" }}>
                      ↻ Refresh
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px" }}>
                    {CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                        padding: "7px 14px", borderRadius: "20px", border: "none", cursor: "pointer",
                        fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap", transition: "all 0.2s ease",
                        background: activeCategory === cat ? "#6366f1" : "rgba(255,255,255,0.05)",
                        color: activeCategory === cat ? "#fff" : "#64748b",
                      }}>{cat}</button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 12px" }}>
                  {user?.topicsFollowing?.length > 0 && activeCategory === "All" && (
                    <div style={{ marginBottom: "24px", padding: "16px", background: "linear-gradient(145deg, rgba(252,211,77,0.06), rgba(252,211,77,0.01))", borderRadius: "16px", border: "1px solid rgba(252,211,77,0.15)" }}>
                      <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#fcd34d", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg viewBox="0 0 24 24" fill="currentColor" style={{width: 14, height: 14}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        Your Curated Interests
                      </h3>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {user.topicsFollowing.map(topic => (
                          <span key={topic} style={{ background: "rgba(252,211,77,0.1)", border: "1px solid rgba(252,211,77,0.25)", borderRadius: "8px", padding: "6px 12px", color: "#fcd34d", fontSize: "12px", fontWeight: "700", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {error && <ErrorBanner message={error} onRetry={refresh} />}
                  {loading && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                      <Spinner />
                    </div>
                  )}
                  {!loading && filteredArticles.map(a => (
                    <NewsCard key={a.id} article={a} onOpen={setSelectedArticle} onSave={handleToggleSave} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === "home" && showDetail && (
              <div style={{ height: "100%", animation: "slideUp 0.3s ease" }}>
                <ArticleDetail article={selectedArticle} onClose={() => setSelectedArticle(null)} onSave={handleToggleSave} />
              </div>
            )}

            {activeTab === "search" && !showSearchDetail && (
              <div style={{ height: "100%", animation: "slideUp 0.3s ease" }}>
                <SearchView onOpenArticle={setSearchOpenArticle} />
              </div>
            )}
            {activeTab === "search" && showSearchDetail && (
              <div style={{ height: "100%", animation: "slideUp 0.3s ease" }}>
                <ArticleDetail article={searchOpenArticle} onClose={() => setSearchOpenArticle(null)} onSave={() => {}} />
              </div>
            )}



            {activeTab === "saved" && (
              <div style={{ height: "100%", animation: "slideUp 0.3s ease" }}>
                <SavedView onOpenArticle={setSelectedArticle} onSave={handleToggleSave} />
              </div>
            )}

            {activeTab === "profile" && (
              <div style={{ height: "100%", animation: "slideUp 0.3s ease" }}>
                <ProfileView />
              </div>
            )}
          </div>

          {/* Bottom Nav */}
          <div style={{
            padding: "16px 12px 24px", display: "flex", borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(5,5,5,0.97)", backdropFilter: "blur(20px)", flexShrink: 0,
          }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedArticle(null); setSearchOpenArticle(null); }} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                background: "none", border: "none", cursor: "pointer", padding: "8px 4px", transition: "all 0.2s ease",
              }}>
                <span style={{ color: activeTab === item.id ? "#f8fafc" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: "10px", fontWeight: "700", color: activeTab === item.id ? "#f8fafc" : "#64748b", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
