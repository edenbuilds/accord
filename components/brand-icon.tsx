import aws from "thesvg/aws";
import claude from "thesvg/claude";
import curl from "thesvg/curl";
import cursor from "thesvg/cursor";
import datadog from "thesvg/datadog";
import docker from "thesvg/docker";
import github from "thesvg/github";
import google from "thesvg/google";
import snowflake from "thesvg/snowflake";
import hubspot from "thesvg/hubspot";
import intercom from "thesvg/intercom";
import microsoftTeams from "thesvg/microsoft-teams";
import openai from "thesvg/openai";
import openapi from "thesvg/openapi";
import opentelemetry from "thesvg/opentelemetry";
import pagerduty from "thesvg/pagerduty";
import postman from "thesvg/postman";
import railway from "thesvg/railway";
import salesforce from "thesvg/salesforce";
import shopify from "thesvg/shopify";
import slack from "thesvg/slack";
import splunk from "thesvg/splunk";
import stripe from "thesvg/stripe";
import swagger from "thesvg/swagger";
import vercel from "thesvg/vercel";
import vscode from "thesvg/visual-studio-code";
import windsurf from "thesvg/windsurf";
import zendesk from "thesvg/zendesk";

// Official brand marks from theSVG (github.com/glincker/thesvg). Static SVG
// strings from a pinned npm package, so rendering them inline is safe.
const ICONS = {
  aws, claude, curl, cursor, datadog, docker, github, google, hubspot, intercom,
  "microsoft-teams": microsoftTeams, openai, openapi, opentelemetry, pagerduty,
  postman, railway, salesforce, shopify, slack, snowflake, splunk, stripe, swagger,
  vercel, vscode, windsurf, zendesk,
};
export type Brand = keyof typeof ICONS;

export function brandTitle(name: Brand) {
  return ICONS[name].title;
}

type Icon = (typeof ICONS)[Brand];

function luminance(hex: string) {
  const h = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// GitHub (#181717) and Zendesk (#03363D) rendered invisible on the forest
// ground and Stripe's default is a 512x214 wordmark that shrank to a speck
// (15-09-2026). Single-colour marks that are near black or white follow the
// text colour instead, so they read on both light and dark surfaces, and
// wordmarks fall back to their square mark in the brand colour.
function pick(icon: Icon, mono: boolean): { svg: string; flat: boolean; tint?: string } {
  const variants = (icon.variants ?? {}) as Record<string, string | undefined>;
  if (mono) return { svg: variants.mono ?? icon.svg, flat: true };
  const [, , w, h] = ((icon.svg.match(/viewBox="([^"]+)"/) ?? [])[1] ?? "0 0 1 1").split(/\s+/).map(Number);
  if (w / h > 1.6 && variants.mono) return { svg: variants.mono, flat: true, tint: `#${icon.hex}` };
  const fills = [...new Set([...icon.svg.matchAll(/fill="#([0-9a-fA-F]{3,6})"/g)].map((m) => m[1].toLowerCase()))];
  const lum = fills.length === 1 ? luminance(fills[0]) : 0.5;
  if (fills.length === 0 || lum < 0.2 || lum > 0.95) {
    return { svg: icon.svg.replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="currentColor"'), flat: true };
  }
  return { svg: icon.svg, flat: false };
}

export function BrandIcon({
  name,
  size = 20,
  mono = false,
  className = "",
}: {
  name: Brand;
  size?: number;
  mono?: boolean;
  className?: string;
}) {
  const icon = ICONS[name];
  const { svg, flat, tint } = pick(icon, mono);
  return (
    <span
      className={`brand-icon ${flat ? "mono" : ""} ${className}`}
      style={{ width: size, height: size, color: tint }}
      role="img"
      aria-label={icon.title}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
