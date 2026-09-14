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
  const svg = (mono && icon.variants?.mono) || icon.svg;
  return (
    <span
      className={`brand-icon ${mono ? "mono" : ""} ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={icon.title}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
