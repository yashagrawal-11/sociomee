/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from "react";
const BASE = window.location.hostname === "localhost" ? "http://localhost:8000" : "/api";

// Social icon auto-detection
function detectIcon(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes("instagram.com")) return { icon: "instagram", color: "#E1306C" };
  if (u.includes("youtube.com") || u.includes("youtu.be")) return { icon: "youtube", color: "#FF0000" };
  if (u.includes("twitter.com") || u.includes("x.com")) return { icon: "x", color: "#fff" };
  if (u.includes("linkedin.com")) return { icon: "linkedin", color: "#0A66C2" };
  if (u.includes("facebook.com")) return { icon: "facebook", color: "#1877F2" };
  if (u.includes("tiktok.com")) return { icon: "tiktok", color: "#fff" };
  if (u.includes("pinterest.com")) return { icon: "pinterest", color: "#E60023" };
  if (u.includes("discord.com") || u.includes("discord.gg")) return { icon: "discord", color: "#5865F2" };
  if (u.includes("telegram.me") || u.includes("t.me")) return { icon: "telegram", color: "#2AABEE" };
  if (u.includes("threads.net")) return { icon: "threads", color: "#fff" };
  if (u.includes("github.com")) return { icon: "github", color: "#fff" };
  if (u.includes("spotify.com")) return { icon: "spotify", color: "#1DB954" };
  if (u.includes("snapchat.com")) return { icon: "snapchat", color: "#FFFC00" };
  return null;
}

function SocialIconSvg({ icon, size = 18, color = "#fff" }) {
  const icons = {
    instagram: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
    youtube: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    linkedin: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    facebook: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    tiktok: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
    pinterest: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>,
    discord: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 00-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 00-5.487 0 12.36 12.36 0 00-.617-1.23A.077.077 0 008.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 00-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 00.031.055 20.03 20.03 0 005.993 2.98.078.078 0 00.084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 01-1.872-.878.075.075 0 01-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 01.078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 01.079.009c.12.098.245.195.372.288a.075.075 0 01-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 00-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 00.084.028 19.963 19.963 0 006.002-2.981.076.076 0 00.032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 00-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/></svg>,
    telegram: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
    threads: <svg width={size} height={size} viewBox="0 0 192 192" fill={color}><path d="M141.537 88.988a66.667 66.667 0 00-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 10.646 125.202 1.205 97.07 1L96.99 1h-.113C68.754 1.205 47.19 10.682 32.986 28.208 20.437 43.667 13.974 65.16 13.752 92.187L13.75 96l.002 3.813c.222 27.027 6.685 48.52 19.234 63.979 14.204 17.526 35.768 26.999 64.11 27.208h.08c24.822-.171 42.287-6.672 56.216-20.586 18.718-18.702 18.139-42.179 11.991-56.531-4.322-10.072-12.7-18.368-23.836-23.895zM98.44 129.507c-10.44.588-21.286-4.098-21.82-14.135-.396-7.44 5.276-15.733 22.461-16.735 1.966-.113 3.895-.169 5.79-.169 6.235 0 12.068.606 17.371 1.765-1.978 24.702-13.58 28.713-23.802 29.274z"/></svg>,
    github: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>,
    spotify: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>,
    snapchat: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 0C8.742 0 5.684 1.888 4.29 4.794c-.672 1.39-.534 2.924-.533 4.38-.47.155-.997.203-1.464.373-.4.15-.76.462-.76.894 0 .617.56.88 1.078 1.044.133.041.268.073.4.123.241.088.525.244.607.509.041.137.025.285-.018.42-.23.717-.644 1.33-1.008 2-.11.2-.213.41-.213.642 0 .455.379.793.792.924.49.156 1.004.21 1.514.276.113.015.244.049.31.154.062.097.07.223.109.334.125.346.38.627.75.627.157 0 .324-.046.488-.076.382-.07.766-.14 1.158-.087.326.047.61.226.887.388.515.304 1.031.64 1.673.64s1.158-.336 1.673-.64c.276-.162.56-.341.887-.388.392-.053.776.017 1.158.087.164.03.331.076.488.076.37 0 .625-.281.75-.627.039-.111.047-.237.109-.334.066-.105.197-.139.31-.154.51-.066 1.024-.12 1.514-.276.413-.131.792-.469.792-.924 0-.232-.102-.442-.213-.642-.364-.67-.778-1.283-1.008-2-.043-.135-.059-.283-.018-.42.082-.265.366-.421.607-.509.132-.05.267-.082.4-.123.518-.164 1.078-.427 1.078-1.044 0-.432-.36-.744-.76-.894-.467-.17-.994-.218-1.464-.373.001-1.456.139-2.99-.533-4.38C18.316 1.888 15.258 0 12 0z"/></svg>,
  reddit: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>,
  globe: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  };
  return icons[icon] || <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>;
}

const BUTTON_STYLES = [
  { id:"filled", label:"Filled" },
  { id:"outline", label:"Outline" },
  { id:"soft", label:"Soft" },
];

const BUTTON_SHAPES = [
  { id:"pill", label:"Pill", radius:"999px" },
  { id:"rounded", label:"Rounded", radius:"12px" },
  { id:"sharp", label:"Sharp", radius:"4px" },
];

const BG_PRESETS = [
  { type:"solid", value:"#0a0a0a", label:"Black" },
  { type:"solid", value:"#0f172a", label:"Navy" },
  { type:"solid", value:"#1e1b4b", label:"Indigo" },
  { type:"solid", value:"#0f2027", label:"Dark Teal" },
  { type:"gradient", value:"linear-gradient(135deg,#667eea,#764ba2)", label:"Purple" },
  { type:"gradient", value:"linear-gradient(135deg,#f093fb,#f5576c)", label:"Pink" },
  { type:"gradient", value:"linear-gradient(135deg,#4facfe,#00f2fe)", label:"Ocean" },
  { type:"gradient", value:"linear-gradient(135deg,#43e97b,#38f9d7)", label:"Mint" },
  { type:"gradient", value:"linear-gradient(135deg,#fa709a,#fee140)", label:"Sunset" },
  { type:"gradient", value:"linear-gradient(135deg,#a18cd1,#fbc2eb)", label:"Lavender" },
];

function LivePreview({ name, bio, links, bg, btnStyle, btnShape, accentColor, avatar }) {
  const radius = BUTTON_SHAPES.find(s=>s.id===btnShape)?.radius || "12px";
  function getBtnStyle(detected, overrideColor) {
    const c = overrideColor || accentColor || (detected?.color) || "#fff";
    if (btnStyle === "filled") return { background:c, color:"#000", border:"none" };
    if (btnStyle === "outline") return { background:"transparent", color:c, border:`1.5px solid ${c}` };
    return { background:`${c}22`, color:c, border:`1px solid ${c}44` };
  }
  return (
    <div style={{ width:"100%", minHeight:"500px", borderRadius:"20px", background:bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 24px 32px", boxSizing:"border-box", position:"relative", overflow:"hidden" }}>
      {avatar ? (
        <img src={avatar} alt={name} style={{ width:"80px", height:"80px", borderRadius:"50%", objectFit:"cover", border:"2px solid rgba(255,255,255,0.2)", marginBottom:"14px" }}/>
      ) : (
        <div style={{ width:"80px", height:"80px", borderRadius:"50%", background:"rgba(255,255,255,0.1)", border:"2px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"14px", fontSize:"28px" }}>👤</div>
      )}
      <div style={{ fontSize:"18px", fontWeight:"800", color:"#fff", marginBottom:"6px", textAlign:"center" }}>{name || "Your Name"}</div>
      {bio && <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.6)", textAlign:"center", lineHeight:1.5, maxWidth:"260px", marginBottom:"24px" }}>{bio}</div>}
      {!bio && <div style={{ marginBottom:"24px" }}/>}
      <div style={{ display:"flex", flexDirection:"column", gap:"10px", width:"100%", maxWidth:"320px" }}>
        {links.filter(l=>l.title||l.url).map((link,i) => {
            const detected = detectIcon(link.url);
            const dm = link.displayMode || "icon+text";
            const ic = link.iconColor || detected?.color || accentColor;
            const bs = getBtnStyle(detected, ic);
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:dm==="icon"?"center":"space-between", padding:"14px 18px", borderRadius:radius, fontFamily:"Poppins,sans-serif", fontSize:"14px", fontWeight:"600", cursor:"pointer", transition:"all 0.2s", ...bs }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                {dm!=="text" && (link.platformIcon || detected) && <SocialIconSvg icon={link.platformIcon||detected?.icon} size={16} color={ic}/>}
                {dm!=="text" && !detected && link.emoji && <span style={{ fontSize:"16px" }}>{link.emoji}</span>}
                {dm!=="icon" && <span>{link.title || "Link"}</span>}
              </div>
              {dm!=="icon" && <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={ic} strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
            </div>
          );
        })}
        {links.filter(l=>l.title||l.url).length === 0 && (
          <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:"13px", padding:"20px" }}>Add links to preview</div>
        )}
      </div>
      <div style={{ marginTop:"auto", paddingTop:"24px", fontSize:"11px", color:"rgba(255,255,255,0.3)", display:"flex", alignItems:"center", gap:"4px" }}>
        <svg width={10} height={10} viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        Powered by SocioMee AI
      </div>
    </div>
  );
}


function LinkRow({ link, i, inp, accentColor, detected, updateLink, moveLink, removeLink }) {
  const [showIconOpts, setShowIconOpts] = React.useState(false);
  const displayMode = link.displayMode || "icon+text";
  const iconColor = link.iconColor || (detected?.color) || accentColor;
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"14px", padding:"12px" }}>
      <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"8px" }}>
        <button onClick={()=>setShowIconOpts(p=>!p)} style={{ width:"36px", height:"36px", borderRadius:"10px", background:"rgba(255,255,255,0.06)", border:`1px solid ${showIconOpts?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.1)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, cursor:"pointer" }} title="Pick platform icon">
          {link.platformIcon ? <SocialIconSvg icon={link.platformIcon} size={17} color={iconColor}/> : detected ? <SocialIconSvg icon={detected.icon} size={17} color={iconColor}/> : <span style={{fontSize:"17px"}}>{link.emoji||"🔗"}</span>}
        </button>
        <input style={{...inp, marginBottom:0, flex:1, padding:"8px 10px", fontSize:"13px"}} value={link.title} onChange={e=>updateLink(i,"title",e.target.value)} placeholder="Title"/>
        <div style={{ display:"flex", gap:"2px" }}>
          <button onClick={()=>moveLink(i,-1)} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)", cursor:"pointer", padding:"5px 7px", borderRadius:"6px", fontSize:"11px" }}>↑</button>
          <button onClick={()=>moveLink(i,1)} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)", cursor:"pointer", padding:"5px 7px", borderRadius:"6px", fontSize:"11px" }}>↓</button>
          <button onClick={()=>removeLink(i)} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.35)", cursor:"pointer", padding:"5px 8px", borderRadius:"6px", fontSize:"13px" }}>×</button>
        </div>
      </div>
      <input style={{...inp, marginBottom:"8px", padding:"8px 10px", fontSize:"12px"}} value={link.url} onChange={e=>updateLink(i,"url",e.target.value)} placeholder="https://..."/>
      {showIconOpts && (
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"10px", padding:"10px", marginBottom:"8px" }}>
          {/* Platform icon picker */}
          <div style={{ fontSize:"10px", fontWeight:"700", color:"rgba(255,255,255,0.35)", letterSpacing:"0.6px", textTransform:"uppercase", marginBottom:"8px" }}>Platform Icon</div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"12px" }}>
            {[
              {id:"instagram",label:"Instagram",color:"#fff"},
              {id:"youtube",label:"YouTube",color:"#fff"},
              {id:"x",label:"X / Twitter",color:"#fff"},
              {id:"tiktok",label:"TikTok",color:"#fff"},
              {id:"facebook",label:"Facebook",color:"#fff"},
              {id:"linkedin",label:"LinkedIn",color:"#fff"},
              {id:"telegram",label:"Telegram",color:"#fff"},
              {id:"discord",label:"Discord",color:"#fff"},
              {id:"threads",label:"Threads",color:"#fff"},
              {id:"pinterest",label:"Pinterest",color:"#fff"},
              {id:"spotify",label:"Spotify",color:"#fff"},
              {id:"github",label:"GitHub",color:"#fff"},
              {id:"snapchat",label:"Snapchat",color:"#fff"},
              {id:"reddit",label:"Reddit",color:"#fff"},
              {id:"globe",label:"Website",color:"#fff"},
            ].map(p=>(
              <button key={p.id} onClick={()=>{updateLink(i,"platformIcon",link.platformIcon===p.id?"":p.id); updateLink(i,"iconColor",p.color);}}
                title={p.label}
                style={{ width:"36px", height:"36px", borderRadius:"8px", background:link.platformIcon===p.id?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.05)", border:`1px solid ${link.platformIcon===p.id?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.08)"}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <SocialIconSvg icon={p.id} size={18} color={p.color}/>
              </button>
            ))}
            <button onClick={()=>{updateLink(i,"platformIcon",""); updateLink(i,"iconColor","");}}
              title="None / Emoji"
              style={{ width:"36px", height:"36px", borderRadius:"8px", background:!link.platformIcon?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.05)", border:`1px solid ${!link.platformIcon?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.08)"}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"18px" }}>
              🔗
            </button>
          </div>
          {/* Emoji if no platform */}
          {!link.platformIcon && (
            <>
              <div style={{ fontSize:"10px", fontWeight:"700", color:"rgba(255,255,255,0.35)", letterSpacing:"0.6px", textTransform:"uppercase", marginBottom:"6px" }}>Custom Emoji</div>
              <input style={{...inp, marginBottom:"10px", padding:"7px 10px", fontSize:"18px", width:"60px", textAlign:"center"}} value={link.emoji} onChange={e=>updateLink(i,"emoji",e.target.value)} placeholder="🔗" maxLength={2}/>
            </>
          )}
          {/* Display mode */}
          <div style={{ fontSize:"10px", fontWeight:"700", color:"rgba(255,255,255,0.35)", letterSpacing:"0.6px", textTransform:"uppercase", marginBottom:"6px" }}>Display Mode</div>
          <div style={{ display:"flex", gap:"6px", marginBottom:"10px" }}>
            {[["icon+text","Icon + Text"],["icon","Icon Only"],["text","Text Only"]].map(([m,label])=>(
              <button key={m} onClick={()=>updateLink(i,"displayMode",m)} style={{ padding:"5px 10px", borderRadius:"6px", fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:"Poppins,sans-serif", border:`1px solid ${displayMode===m?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.08)"}`, background:displayMode===m?"rgba(255,255,255,0.1)":"transparent", color:displayMode===m?"#fff":"rgba(255,255,255,0.4)" }}>{label}</button>
            ))}
          </div>
          {/* Icon color */}
          <div style={{ fontSize:"10px", fontWeight:"700", color:"rgba(255,255,255,0.35)", letterSpacing:"0.6px", textTransform:"uppercase", marginBottom:"6px" }}>Icon Color</div>
          <div style={{ display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
            {["","#fff","#000","#E1306C","#FF0000","#1877F2","#0A66C2","#2AABEE","#1DB954","#FF6B35","#5865F2","#E60023"].map(c=>(
              <div key={c||"auto"} onClick={()=>updateLink(i,"iconColor",c)}
                style={{ width:"20px", height:"20px", borderRadius:"50%", background:c||"linear-gradient(135deg,#a78bfa,#60a5fa)", cursor:"pointer", border:(link.iconColor||"")===(c)?"2px solid #fff":"2px solid rgba(255,255,255,0.12)", flexShrink:0 }}/>
            ))}
            <input type="color" value={link.iconColor||accentColor} onChange={e=>updateLink(i,"iconColor",e.target.value)} style={{ width:"20px", height:"20px", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.15)", cursor:"pointer", padding:"1px", background:"none" }}/>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LinkInBio({ user }) {
  const [handle, setHandle] = useState("");
  const [handleStatus, setHandleStatus] = useState(null);
  const [name, setName] = useState(user?.name || user?.display_name || "");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState([{ title:"", url:"", emoji:"" }]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bioUrl, setBioUrl] = useState("");
  const [bg, setBg] = useState("#0a0a0a");
  const [bgType, setBgType] = useState("solid");
  const [btnStyle, setBtnStyle] = useState("soft");
  const [btnShape, setBtnShape] = useState("pill");
  const [accentColor, setAccentColor] = useState("#a78bfa");
  const [avatar, setAvatar] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const handleTimer = useRef(null);

  useEffect(() => {
    if (!user?.user_id) return;
    fetch(`${BASE}/bio/me/${user.user_id}`, { credentials:"include" })
      .then(r => r.json())
      .then(d => {
        if (d.exists) {
          setHandle(d.handle || "");
          setName(d.name || "");
          setBio(d.bio || "");
          setLinks(d.links?.length ? d.links.map(l=>({displayMode:'icon+text',iconColor:'',...l})) : [{ title:"", url:"", emoji:"", displayMode:"icon+text", iconColor:"" }]);
          setBioUrl(`https://sociomeeai.com/bio/${d.handle}`);
          setSaved(true);
          if (d.bg_color) setBg(d.bg_color);
          if (d.avatar) setAvatar(d.avatar);
          if (d.btn_style) setBtnStyle(d.btn_style);
          if (d.btn_shape) setBtnShape(d.btn_shape);
          if (d.accent_color) setAccentColor(d.accent_color);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [user]);

  const checkHandle = useCallback((h) => {
    clearTimeout(handleTimer.current);
    if (!h || h.length < 3) { setHandleStatus("invalid"); return; }
    setHandleStatus("checking");
    handleTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`${BASE}/bio/check-handle/${h}`, { credentials:"include" });
        const d = await r.json();
        setHandleStatus(d.available ? "available" : "taken");
      } catch { setHandleStatus(null); }
    }, 500);
  }, []);

  const updateLink = (i, field, val) => {
    setLinks(prev => prev.map((l,idx) => idx===i ? {...l,[field]:val} : l));
  };
  const addLink = () => setLinks(prev => [...prev, { title:"", url:"", emoji:"", displayMode:"icon+text", iconColor:"", platformIcon:"" }]);
  const removeLink = (i) => setLinks(prev => prev.filter((_,idx) => idx!==i));
  const moveLink = (i, dir) => {
    const arr = [...links];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setLinks(arr);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target.result);
      setAvatarUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setError("");
    const validLinks = links.filter(l => l.title && l.url);
    if (!handle) { setError("Handle is required"); return; }
    if (!name) { setError("Display name is required"); return; }
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/bio/save`, {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          user_id: user?.user_id || "",
          user_email: user?.email || "",
          handle, name, bio, links: validLinks,
          avatar,
          bg_color: bg, btn_style: btnStyle, btn_shape: btnShape, accent_color: accentColor
        })
      });
      const d = await r.json();
      if (d.success) { setBioUrl(d.url); setSaved(true); }
      else setError(d.detail || "Failed to save.");
    } catch { setError("Network error."); }
    setSaving(false);
  };

  const inp = { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"12px 14px", color:"#fff", fontSize:"13px", fontFamily:"Poppins,sans-serif", outline:"none", boxSizing:"border-box" };
  const lbl = { fontSize:"11px", fontWeight:"600", color:"rgba(255,255,255,0.45)", marginBottom:"6px", display:"block", letterSpacing:"0.6px", textTransform:"uppercase" };

  if (!loaded) return <div style={{textAlign:"center",padding:"40px",color:"rgba(255,255,255,0.4)",fontFamily:"Poppins,sans-serif"}}>Loading...</div>;

  return (
    <div style={{ fontFamily:"Poppins,sans-serif", color:"#fff", display:"flex", flexDirection:"column", maxWidth:"600px", margin:"0 auto", padding:"0 8px" }}>
      {/* Editor */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:"18px", fontWeight:"800", marginBottom:"4px" }}>Link in Bio</div>
        <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", marginBottom:"24px" }}>One link for all your links.</div>

        {/* Avatar */}
        <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"20px" }}>
          <div style={{ position:"relative", width:"72px", height:"72px", flexShrink:0 }}>
            <div style={{ width:"72px", height:"72px", borderRadius:"50%", background:"rgba(255,255,255,0.06)", border:"1.5px solid rgba(255,255,255,0.1)", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {avatar ? <img src={avatar} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:"28px" }}>👤</span>}
            </div>
            <label style={{ position:"absolute", bottom:0, right:0, width:"22px", height:"22px", borderRadius:"50%", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"11px" }}>
              <span style={{fontSize:"14px",fontWeight:"700",lineHeight:1}}>+</span>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display:"none" }}/>
            </label>
          </div>
          <div>
            <div style={{ fontSize:"13px", fontWeight:"600", color:"#fff", marginBottom:"4px" }}>Profile Photo</div>
            <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.4)" }}>{avatarUploading ? "Uploading..." : "Click camera to upload"}</div>
          </div>
        </div>
        {/* Handle */}
        <label style={lbl}>Your Handle · sociomeeai.com/bio/</label>
        <div style={{ position:"relative", marginBottom:"16px" }}>
          <input style={inp} value={handle} onChange={e=>{setHandle(e.target.value.replace(/[^a-z0-9_-]/gi,"").toLowerCase()); checkHandle(e.target.value);}} placeholder="yourname" maxLength={30}/>
          {handleStatus && (
            <div style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"11px", fontWeight:"700",
              color: handleStatus==="available"?"#10b981": handleStatus==="taken"?"#ef4444": handleStatus==="checking"?"rgba(255,255,255,0.4)":"#ef4444" }}>
              {handleStatus==="available"?"✓ Available": handleStatus==="taken"?"✗ Taken": handleStatus==="checking"?"...":"Min 3 chars"}
            </div>
          )}
        </div>

        {/* Name */}
        <label style={lbl}>Display Name</label>
        <input style={{...inp, marginBottom:"16px"}} value={name} onChange={e=>setName(e.target.value)} placeholder="Your Name"/>

        {/* Bio */}
        <label style={lbl}>Bio · Optional</label>
        <textarea style={{...inp, marginBottom:"16px", resize:"vertical", minHeight:"60px"}} value={bio} onChange={e=>setBio(e.target.value)} placeholder="Short bio..." maxLength={150}/>

        {/* Links */}
        <label style={lbl}>Your Links · Up to 20</label>
        <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"12px" }}>
          {links.map((link, i) => (
            <LinkRow key={i} link={link} i={i} inp={inp} accentColor={accentColor} detected={detectIcon(link.url)} updateLink={updateLink} moveLink={moveLink} removeLink={removeLink}/>
          ))}
        </div>
        {links.length < 20 && (
          <button onClick={addLink} style={{ width:"100%", padding:"10px", borderRadius:"10px", border:"1px dashed rgba(255,255,255,0.15)", background:"transparent", color:"rgba(255,255,255,0.4)", fontSize:"13px", cursor:"pointer", fontFamily:"Poppins,sans-serif", marginBottom:"20px" }}>+ Add Link</button>
        )}

        {/* Appearance */}
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"14px", padding:"16px", marginBottom:"16px" }}>
          <div style={{ fontSize:"13px", fontWeight:"700", marginBottom:"14px" }}>Appearance</div>

          {/* Background */}
          <label style={lbl}>Background</label>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"14px" }}>
            {BG_PRESETS.map((p,i) => (
              <div key={i} onClick={()=>{setBg(p.value); setBgType(p.type);}}
                style={{ width:"32px", height:"32px", borderRadius:"8px", background:p.value, cursor:"pointer", border:bg===p.value?"2px solid rgba(255,255,255,0.8)":"2px solid transparent", flexShrink:0 }}
                title={p.label}
              />
            ))}
            <input type="color" value={bgType==="solid"?bg:"#0a0a0a"} onChange={e=>{setBg(e.target.value); setBgType("solid");}}
              style={{ width:"32px", height:"32px", borderRadius:"8px", border:"2px solid rgba(255,255,255,0.15)", cursor:"pointer", padding:"2px", background:"none" }} title="Custom color"/>
          </div>

          {/* Accent Color */}
          <label style={lbl}>Button Accent Color</label>
          <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"14px", flexWrap:"wrap" }}>
            {["#a78bfa","#60a5fa","#34d399","#f472b6","#fb923c","#facc15","#fff","#f87171"].map(c => (
              <div key={c} onClick={()=>setAccentColor(c)}
                style={{ width:"24px", height:"24px", borderRadius:"50%", background:c, cursor:"pointer", border:accentColor===c?"2px solid rgba(255,255,255,0.9)":"2px solid rgba(255,255,255,0.15)" }}/>
            ))}
            <input type="color" value={accentColor} onChange={e=>setAccentColor(e.target.value)}
              style={{ width:"24px", height:"24px", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.15)", cursor:"pointer", padding:"1px", background:"none" }}/>
          </div>

          {/* Button Style */}
          <label style={lbl}>Button Style</label>
          <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
            {BUTTON_STYLES.map(s => (
              <button key={s.id} onClick={()=>setBtnStyle(s.id)}
                style={{ padding:"7px 14px", borderRadius:"8px", border:`1px solid ${btnStyle===s.id?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.1)"}`, background:btnStyle===s.id?"rgba(255,255,255,0.1)":"transparent", color:btnStyle===s.id?"#fff":"rgba(255,255,255,0.4)", fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:"Poppins,sans-serif" }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Button Shape */}
          <label style={lbl}>Button Shape</label>
          <div style={{ display:"flex", gap:"8px" }}>
            {BUTTON_SHAPES.map(s => (
              <button key={s.id} onClick={()=>setBtnShape(s.id)}
                style={{ padding:"7px 14px", borderRadius:s.radius, border:`1px solid ${btnShape===s.id?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.1)"}`, background:btnShape===s.id?"rgba(255,255,255,0.1)":"transparent", color:btnShape===s.id?"#fff":"rgba(255,255,255,0.4)", fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:"Poppins,sans-serif" }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div style={{ color:"#f87171", fontSize:"12px", marginBottom:"12px" }}>{error}</div>}

        <button onClick={handleSave} disabled={saving}
          style={{ width:"100%", padding:"14px", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.12)", background: saving?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.08)", backdropFilter:"blur(16px)", color:"#fff", fontSize:"14px", fontWeight:"800", cursor:saving?"not-allowed":"pointer", fontFamily:"Poppins,sans-serif", transition:"all 0.2s" }}>
          {saving ? "Saving..." : saved ? "Update Link in Bio" : "Create Link in Bio"}
        </button>

        {saved && bioUrl && (
          <div style={{ marginTop:"16px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"12px", padding:"14px" }}>
            <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.5)", marginBottom:"8px" }}>Your Link in Bio</div>
            <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"10px" }}>
              <span style={{ fontSize:"13px", color:"#fff", wordBreak:"break-all", flex:1 }}>{bioUrl}</span>
              <button onClick={()=>navigator.clipboard.writeText(bioUrl)} style={{ padding:"6px 12px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:"Poppins,sans-serif", flexShrink:0 }}>Copy</button>
            </div>
            <a href={bioUrl} target="_blank" rel="noopener noreferrer" style={{ display:"inline-block", padding:"8px 18px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:"12px", fontWeight:"600", textDecoration:"none" }}>Open Preview →</a>
          </div>
        )}
      </div>

      {/* Live Preview */}
      <div style={{ width:"100%" }}>
        <div style={{ fontSize:"11px", fontWeight:"700", color:"rgba(255,255,255,0.4)", letterSpacing:"0.6px", textTransform:"uppercase", marginBottom:"10px", textAlign:"center", marginTop:"24px" }}>Live Preview</div>
        <div style={{ borderRadius:"20px", overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
          <LivePreview name={name} bio={bio} links={links} bg={bg} btnStyle={btnStyle} btnShape={btnShape} accentColor={accentColor} avatar={avatar}/>
        </div>
      </div>
    </div>
  );
}
