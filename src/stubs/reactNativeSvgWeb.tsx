import React from 'react';

const cleanProps = (props: any) => {
  if (!props) return {};
  const {
    strokeWidth,
    strokeDasharray,
    stopColor,
    stopOpacity,
    fontSize,
    fontWeight,
    textAnchor,
    fillOpacity,
    strokeOpacity,
    strokeLinecap,
    strokeLinejoin,
    ...rest
  } = props;
  const cleaned: any = { ...rest };
  if (strokeWidth !== undefined) cleaned.strokeWidth = strokeWidth;
  if (strokeDasharray !== undefined) cleaned.strokeDasharray = strokeDasharray;
  if (stopColor !== undefined) cleaned.stopColor = stopColor;
  if (stopOpacity !== undefined) cleaned.stopOpacity = stopOpacity;
  if (fontSize !== undefined) cleaned.fontSize = fontSize;
  if (fontWeight !== undefined) cleaned.fontWeight = fontWeight;
  if (textAnchor !== undefined) cleaned.textAnchor = textAnchor;
  if (fillOpacity !== undefined) cleaned.fillOpacity = fillOpacity;
  if (strokeOpacity !== undefined) cleaned.strokeOpacity = strokeOpacity;
  if (strokeLinecap !== undefined) cleaned.strokeLinecap = strokeLinecap;
  if (strokeLinejoin !== undefined) cleaned.strokeLinejoin = strokeLinejoin;
  return cleaned;
};

export const Svg = React.forwardRef<SVGSVGElement, any>(({ children, style, ...props }, ref) => (
  <svg ref={ref} style={style} {...cleanProps(props)}>{children}</svg>
));
export default Svg;

export const Rect = React.forwardRef<SVGRectElement, any>(({ children, ...props }, ref) => (
  <rect ref={ref} {...cleanProps(props)}>{children}</rect>
));

export const Circle = React.forwardRef<SVGCircleElement, any>(({ children, ...props }, ref) => (
  <circle ref={ref} {...cleanProps(props)}>{children}</circle>
));

export const Ellipse = React.forwardRef<SVGEllipseElement, any>(({ children, ...props }, ref) => (
  <ellipse ref={ref} {...cleanProps(props)}>{children}</ellipse>
));

export const Line = React.forwardRef<SVGLineElement, any>(({ children, ...props }, ref) => (
  <line ref={ref} {...cleanProps(props)}>{children}</line>
));

export const Path = React.forwardRef<SVGPathElement, any>(({ children, ...props }, ref) => (
  <path ref={ref} {...cleanProps(props)}>{children}</path>
));

export const Polygon = React.forwardRef<SVGPolygonElement, any>(({ children, ...props }, ref) => (
  <polygon ref={ref} {...cleanProps(props)}>{children}</polygon>
));

export const G = React.forwardRef<SVGGElement, any>(({ children, ...props }, ref) => (
  <g ref={ref} {...cleanProps(props)}>{children}</g>
));

export const Text = React.forwardRef<SVGTextElement, any>(({ children, ...props }, ref) => (
  <text ref={ref} {...cleanProps(props)}>{children}</text>
));

export const Defs = React.forwardRef<SVGDefsElement, any>(({ children, ...props }, ref) => (
  <defs ref={ref} {...cleanProps(props)}>{children}</defs>
));

export const LinearGradient = React.forwardRef<SVGLinearGradientElement, any>(({ children, ...props }, ref) => (
  <linearGradient ref={ref} {...cleanProps(props)}>{children}</linearGradient>
));

export const RadialGradient = React.forwardRef<SVGRadialGradientElement, any>(({ children, ...props }, ref) => (
  <radialGradient ref={ref} {...cleanProps(props)}>{children}</radialGradient>
));

export const Stop = React.forwardRef<SVGStopElement, any>(({ children, ...props }, ref) => (
  <stop ref={ref} {...cleanProps(props)} />
));

export const ClipPath = React.forwardRef<SVGClipPathElement, any>(({ children, ...props }, ref) => (
  <clipPath ref={ref} {...cleanProps(props)}>{children}</clipPath>
));

export const Mask = React.forwardRef<SVGMaskElement, any>(({ children, ...props }, ref) => (
  <mask ref={ref} {...cleanProps(props)}>{children}</mask>
));

export const Pattern = React.forwardRef<SVGPatternElement, any>(({ children, ...props }, ref) => (
  <pattern ref={ref} {...cleanProps(props)}>{children}</pattern>
));

