import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio.ts';
import { WishItem } from '../types.ts';
import {
  subscribeToSharedWishes,
  deleteSharedWish,
  addSharedWish,
} from '../firebase.ts';
import {
  X,
  Trash2,
  Camera,
  Plus,
  Sparkles,
  Feather,
  TreePine,
  Heart,
} from 'lucide-react';
import { PolaroidCarousel } from './PolaroidCarousel.tsx';

interface MemoryTreeProps {
  onGoToWishSlide?: () => void;
}

// 46 exact branch anchor slots mathematically anchored to continuous SVG bough paths,
// INTERLEAVED & DISPERSED across the entire tree canopy so leaves are never clustered or serial
const EXACT_BRANCH_SLOTS = [
  // 1. Crown Spire Zenith
  { bx: 500, by: 72, stemLen: 16, angle: 0, isCrown: true },   // Top Center Zenith Spire
  // 2. Far High-Left Canopy Tip
  { bx: 250, by: 65, stemLen: 16, angle: -20 },
  // 3. Far High-Right Canopy Tip
  { bx: 750, by: 65, stemLen: 16, angle: 20 },
  // 4. Mid-Lower Far-Left Master Bough
  { bx: 75, by: 328, stemLen: 17, angle: -22 },
  // 5. Mid-Lower Far-Right Master Bough
  { bx: 925, by: 328, stemLen: 17, angle: 22 },
  // 6. Crown Left Fork Tip
  { bx: 420, by: 72, stemLen: 16, angle: -18 },
  // 7. Crown Right Fork Tip
  { bx: 580, by: 72, stemLen: 16, angle: 18 },
  // 8. High-Left Droop Tip
  { bx: 130, by: 185, stemLen: 16, angle: 20 },
  // 9. High-Right Droop Tip
  { bx: 845, by: 185, stemLen: 16, angle: -20 },
  // 10. Lower-Left Descending Tip
  { bx: 65, by: 495, stemLen: 17, angle: 22 },
  // 11. Lower-Right Descending Tip
  { bx: 935, by: 495, stemLen: 17, angle: -22 },
  // 12. High-Left Main Bough Fork
  { bx: 365, by: 172, stemLen: 15, angle: -15 },
  // 13. High-Right Main Bough Fork
  { bx: 635, by: 172, stemLen: 15, angle: 15 },
  // 14. Mid-Left Ascending Top Tip
  { bx: 50, by: 160, stemLen: 17, angle: -24 },
  // 15. Mid-Right Ascending Top Tip
  { bx: 950, by: 160, stemLen: 17, angle: 24 },
  // 16. Crown Left Sub-Twig
  { bx: 438, by: 68, stemLen: 15, angle: -8 },
  // 17. Crown Right Sub-Twig
  { bx: 562, by: 68, stemLen: 15, angle: 8 },
  // 18. Far High-Left Outer Tip
  { bx: 120, by: 105, stemLen: 16, angle: -24 },
  // 19. Far High-Right Outer Tip
  { bx: 845, by: 105, stemLen: 16, angle: 22 },
  // 20. Mid-Left Bough Center
  { bx: 170, by: 330, stemLen: 16, angle: -18 },
  // 21. Mid-Right Bough Center
  { bx: 830, by: 330, stemLen: 16, angle: 18 },
  // 22. High-Left Twig Tip
  { bx: 232, by: 75, stemLen: 16, angle: -16 },
  // 23. High-Right Twig Tip
  { bx: 768, by: 75, stemLen: 16, angle: 16 },
  // 24. Deep Lower-Left Tip
  { bx: 25, by: 515, stemLen: 17, angle: 24 },
  // 25. Deep Lower-Right Tip
  { bx: 975, by: 515, stemLen: 17, angle: -24 },
  // 26. Crown Left Fork Mid
  { bx: 450, by: 90, stemLen: 14, angle: -10 },
  // 27. Crown Right Fork Mid
  { bx: 550, by: 90, stemLen: 14, angle: 10 },
  // 28. Mid-Left Ascending Mid
  { bx: 135, by: 205, stemLen: 16, angle: -20 },
  // 29. Mid-Right Ascending Mid
  { bx: 865, by: 205, stemLen: 16, angle: 20 },
  // 30. High-Left Droop Mid
  { bx: 165, by: 170, stemLen: 16, angle: 18 },
  // 31. High-Right Droop Mid
  { bx: 805, by: 170, stemLen: 16, angle: -18 },
  // 32. Mid-Left Outer Bough
  { bx: 35, by: 340, stemLen: 17, angle: -24 },
  // 33. Mid-Right Outer Bough
  { bx: 965, by: 340, stemLen: 17, angle: 24 },
  // 34. High-Left Inner Fork
  { bx: 309, by: 117, stemLen: 15, angle: -14 },
  // 35. High-Right Inner Fork
  { bx: 691, by: 117, stemLen: 15, angle: 14 },
  // 36. Lower-Left Fork Mid
  { bx: 145, by: 420, stemLen: 16, angle: 15 },
  // 37. Lower-Right Fork Mid
  { bx: 855, by: 420, stemLen: 16, angle: -15 },
  // 38. Mid-Left Ascending Side
  { bx: 60, by: 215, stemLen: 16, angle: -20 },
  // 39. Mid-Right Ascending Side
  { bx: 940, by: 215, stemLen: 16, angle: 20 },
  // 40. High-Left Low Droop
  { bx: 120, by: 220, stemLen: 16, angle: 16 },
  // 41. High-Right Low Droop
  { bx: 850, by: 220, stemLen: 16, angle: -16 },
  // 42. Crown Left Fork Base
  { bx: 462, by: 110, stemLen: 15, angle: -15 },
  // 43. Crown Right Fork Base
  { bx: 537, by: 110, stemLen: 15, angle: 15 },
  // 44. Center Spire Mid Joint
  { bx: 499, by: 125, stemLen: 14, angle: 2 },
  // 45. Lower-Left Mid Descending
  { bx: 95, by: 470, stemLen: 16, angle: 20 },
  // 46. Lower-Right Mid Descending
  { bx: 905, by: 470, stemLen: 16, angle: -20 },
];

// Reusable botanical walking cat with realistic feline anatomy and smooth continuous 3D turnaround
const WalkingCat: React.FC<{
  type: 'ginger' | 'tuxedo' | 'calico';
  className: string;
}> = ({ type, className }) => {
  const isGinger = type === 'ginger';
  const isTuxedo = type === 'tuxedo';
  const isCalico = type === 'calico';

  const bodyFill = isGinger
    ? 'url(#catGingerBodyGrad)'
    : isTuxedo
    ? 'url(#catTuxedoBodyGrad)'
    : 'url(#catCalicoBodyGrad)';

  const bellyFill = isGinger
    ? 'url(#catGingerBellyGrad)'
    : '#ffffff';

  const eyeFill = isTuxedo
    ? 'url(#catEyeEmeraldGrad)'
    : 'url(#catEyeAmberGrad)';

  const sockFill = '#ffffff';

  const turnClass =
    type === 'ginger'
      ? 'animate-cat-turn-ginger'
      : type === 'tuxedo'
      ? 'animate-cat-turn-tuxedo'
      : 'animate-cat-turn-calico';

  return (
    <g
      className={`${className} cursor-pointer pointer-events-auto`}
      onClick={() => sound.playCatPurrMeow()}
    >
      {/* Ground contact shadow under paws with ambient occlusion */}
      <ellipse cx="0" cy="18" rx="22" ry="4" fill="#020402" opacity="0.65" />

      {/* Unified Feline Body rotating smoothly in 3D perspective without abrupt image swaps */}
      <g className={turnClass}>
        {/* Cat body group with rhythmic walk bob */}
        <g className="animate-cat-body-bob">
          {/* ----- FAR HIND LEG (Background Layer - Shaded) ----- */}
          <g transform="translate(-11, 4)">
            <g className="animate-cat-leg-b">
              {/* Articulated thigh, backward hock ankle, and paw */}
              <path
                d="M -1 0 C -4 4, -4 8, -2 11 L -2 14 C -2 15, -1 15.5, 0.5 15.5 L 3.5 15.5 C 3.5 14, 2 11.5, 2.2 8.5 C 2.5 5.5, 1.5 2, 0 0 Z"
                fill={bodyFill}
                opacity="0.82"
              />
              <path
                d="M -1.8 13.5 L 3.5 13.5 C 3.5 14.5, 2.5 15.5, 0.5 15.5 C -1 15.5, -1.8 14.5, -1.8 13.5 Z"
                fill={sockFill}
                opacity="0.82"
              />
            </g>
          </g>

          {/* ----- FAR FORELEG (Background Layer - Shaded) ----- */}
          <g transform="translate(9, 4)">
            <g className="animate-cat-leg-a">
              {/* Slender articulated foreleg with carpus wrist flex */}
              <path
                d="M -1 0 L -1 9 C -1 11.5, -1.8 13.5, -1.2 15.5 L 3 15.5 C 3 13.5, 2 11.5, 1.8 9 L 1.8 0 Z"
                fill={bodyFill}
                opacity="0.82"
              />
              <path
                d="M -1.2 13.5 L 3 13.5 C 3 14.5, 2.2 15.5, 0.8 15.5 C -0.5 15.5, -1.2 14.5, -1.2 13.5 Z"
                fill={sockFill}
                opacity="0.82"
              />
            </g>
          </g>

          {/* ----- TAIL (S-Curve Feline Tail Swaying Smoothly) ----- */}
          <g transform="translate(-16, -1)">
            <g className="animate-cat-tail-sway">
              <path
                d="M 0 0 C -8 -4, -14 -12, -10 -20 C -7 -26, 0 -27, 2 -21 C 0 -24, -5 -22, -7 -17 C -9 -11, -3 -4, 2 2 Z"
                fill={bodyFill}
              />
              {/* White Tail Tip */}
              <path
                d="M -9 -19 C -7 -25, 0 -26, 2 -21 C 0 -24, -4 -22, -7 -17 Z"
                fill={sockFill}
              />
            </g>
          </g>

          {/* ----- MAIN TORSO (Anatomical Feline Spine, Flank & Chest) ----- */}
          {/* Organic Spine & Body contour */}
          <path
            d="M -18 2 C -19 -6, -13 -11.5, -3 -11 C 5 -10.5, 10 -12.5, 15 -7.5 C 19 -3.5, 20 2, 17 7 C 14 11.5, 8 9, 2 8 C -5 8, -9 11, -15 9 C -18 7, -18 4.5, -18 2 Z"
            fill={bodyFill}
          />

          {/* Spine Moonlit Rim Highlight */}
          <path
            d="M -14 -10 C -4 -9.5, 6 -11, 13 -7"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Flank Underbelly / Chest bib */}
          {isGinger && (
            <path
              d="M 4 8 C 8 8, 14 9, 17 6.5 C 15 2, 12 0, 8 3 C 4 6, 2 8, 4 8 Z"
              fill={bellyFill}
            />
          )}

          {isTuxedo && (
            <path
              d="M 6 -2 C 12 0, 18 2, 17 7 C 14 11, 8 8, 6 4 Z"
              fill="#ffffff"
            />
          )}

          {/* ----- REALISTIC BREED MARKINGS ----- */}
          {/* Ginger Mackerel Tabby Stripes wrapping naturally across ribs */}
          {isGinger && (
            <g opacity="0.8">
              <path d="M -8 -9.5 C -6 -4, -7 1, -9 6" stroke="#92400e" strokeWidth="1.7" fill="none" strokeLinecap="round" />
              <path d="M -3 -10 C -1 -4, -2 1, -4 6.5" stroke="#92400e" strokeWidth="1.7" fill="none" strokeLinecap="round" />
              <path d="M 2 -10 C 4 -4, 3 1, 1 6.5" stroke="#92400e" strokeWidth="1.7" fill="none" strokeLinecap="round" />
              <path d="M 7 -9 C 9 -4, 8 0, 6 5" stroke="#92400e" strokeWidth="1.7" fill="none" strokeLinecap="round" />
              <path d="M 12 -7 C 14 -3, 13 0, 11 4" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </g>
          )}

          {/* Calico Organic Patches */}
          {isCalico && (
            <g>
              <path d="M -15 2 C -16 -4, -11 -8, -5 -8 C -7 -3, -9 1, -12 4 Z" fill="#ea580c" opacity="0.95" />
              <path d="M 0 -8 C 6 -9, 9 -6, 7 -2 C 4 -1, 1 -3, 0 -8 Z" fill="#334155" opacity="0.9" />
              <path d="M -2 1 C 3 0, 5 4, 3 7 C -1 7, -2 4, -2 1 Z" fill="#ea580c" opacity="0.92" />
            </g>
          )}

          {/* ----- NEAR HIND LEG (Articulated Haunch, Hock & Paws) ----- */}
          <g transform="translate(-7, 5)">
            <g className="animate-cat-leg-a">
              <path
                d="M -1 0 C -4.5 4, -4.5 8.5, -2 11.5 L -2 14 C -2 15, -1 15.5, 0.5 15.5 L 3.8 15.5 C 3.8 14, 2.2 11.5, 2.5 8.5 C 2.8 5.5, 1.8 2, 0 0 Z"
                fill={bodyFill}
              />
              {/* White Sock & Paw with 3 toe definitions */}
              <path
                d="M -1.8 13.5 L 3.8 13.5 C 3.8 14.5, 2.8 15.5, 0.8 15.5 C -0.8 15.5, -1.8 14.5, -1.8 13.5 Z"
                fill={sockFill}
              />
              <line x1="0" y1="14" x2="0" y2="15.5" stroke="#cbd5e1" strokeWidth="0.6" />
              <line x1="1.8" y1="14" x2="1.8" y2="15.5" stroke="#cbd5e1" strokeWidth="0.6" />
            </g>
          </g>

          {/* ----- NEAR FORELEG (Articulated Shoulder, Wrist & Paws) ----- */}
          <g transform="translate(13, 5)">
            <g className="animate-cat-leg-b">
              <path
                d="M -1.2 0 L -1.2 9 C -1.2 11.5, -2 13.5, -1.5 15.5 L 3.2 15.5 C 3.2 13.5, 2.2 11.5, 1.8 9 L 1.8 0 Z"
                fill={bodyFill}
              />
              {/* White Sock & Paw with 3 toe definitions */}
              <path
                d="M -1.5 13.5 L 3.2 13.5 C 3.2 14.5, 2.4 15.5, 0.8 15.5 C -0.6 15.5, -1.5 14.5, -1.5 13.5 Z"
                fill={sockFill}
              />
              <line x1="-0.2" y1="14" x2="-0.2" y2="15.5" stroke="#cbd5e1" strokeWidth="0.6" />
              <line x1="1.5" y1="14" x2="1.5" y2="15.5" stroke="#cbd5e1" strokeWidth="0.6" />
            </g>
          </g>

          {/* ----- REALISTIC HEAD & MUZZLE ----- */}
          <g transform="translate(16, -5)">
            {/* Muscular Neck connector */}
            <path d="M -4 2 C -3 -3, 0 -6, 3 -7 C 2 -2, 0 3, -1 6 Z" fill={bodyFill} />

            {/* Feline Skull */}
            <path
              d="M -1 -3 C -1 -8, 3 -12, 8 -11 C 13 -10, 16 -5, 14 0 C 12 4, 7 5, 2 3 C 0 2, -1 0, -1 -3 Z"
              fill={bodyFill}
            />

            {/* Back Ear with inner pink */}
            <polygon points="1,-9 3,-18 8,-12" fill={bodyFill} opacity="0.85" />
            <polygon points="2,-10 4,-16 7,-12" fill="#fda4af" opacity="0.8" />

            {/* Front Ear with Fur Tuft */}
            <polygon points="5,-9 8,-19 13,-12" fill={bodyFill} />
            <polygon points="6,-10 9,-17 12,-12" fill="#fda4af" />
            <path d="M 7 -11 L 9 -14 M 8 -10 L 10 -13" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />

            {/* Calico Ear Patch */}
            {isCalico && (
              <polygon points="5,-9 8,-19 13,-12" fill="#ea580c" />
            )}

            {/* Tabby forehead 'M' mark */}
            {isGinger && (
              <path
                d="M 5 -9 L 7 -7 L 9 -9 L 11 -7"
                stroke="#92400e"
                strokeWidth="1.1"
                fill="none"
                strokeLinecap="round"
                opacity="0.85"
              />
            )}

            {/* Almond Feline Eye with Slit Pupil */}
            <g transform="translate(8, -4)">
              {/* Dark eyeliner contour */}
              <ellipse cx="0" cy="0" rx="2.5" ry="1.9" fill="#1e293b" />
              {/* Luminous Iris */}
              <ellipse cx="0" cy="0" rx="2.1" ry="1.5" fill={eyeFill} />
              {/* Nocturnal Vertical Slit Pupil */}
              <ellipse cx="0" cy="0" rx="0.5" ry="1.3" fill="#090d16" />
              {/* Specular Gleam */}
              <circle cx="0.6" cy="-0.5" r="0.5" fill="#ffffff" />
            </g>

            {/* Muzzle Whisker Pads */}
            <ellipse cx="12" cy="0" rx="2.8" ry="2.2" fill={isTuxedo || isCalico ? '#ffffff' : '#fef3c7'} />
            <ellipse cx="10" cy="1" rx="2.2" ry="1.8" fill={isTuxedo || isCalico ? '#ffffff' : '#fef3c7'} />

            {/* Leather Pink Nose */}
            <polygon points="13.2,-1 14.8,-1 14,0.4" fill="#f43f5e" />

            {/* Fine Translucent Curved Whiskers */}
            <g opacity="0.88">
              <path d="M 13 -0.5 Q 19 -3 23 -2" stroke="#ffffff" strokeWidth="0.6" fill="none" />
              <path d="M 13 0.2 Q 20 0 24 2" stroke="#ffffff" strokeWidth="0.6" fill="none" />
              <path d="M 13 1 Q 19 3 22 5.5" stroke="#ffffff" strokeWidth="0.6" fill="none" />
              <path d="M 10 0.5 Q 6 -1 2 -2" stroke="#ffffff" strokeWidth="0.55" fill="none" />
              <path d="M 10 1.2 Q 5 2 1 4" stroke="#ffffff" strokeWidth="0.55" fill="none" />
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};

// Lush botanical foliage cluster for branch nodes and tips to eliminate bare/blunt branch cuts
const BranchLeafCluster: React.FC<{
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
}> = ({ x, y, scale = 1, rotation = 0 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`} opacity="0.95">
    {/* Soft subtle glow behind foliage */}
    <circle cx="0" cy="0" r="16" fill="#2d6a4f" opacity="0.25" filter="blur(4px)" />
    {/* Cluster of 4-5 overlapping organic leaves */}
    <path d="M 0 0 C -10 -6, -16 -18, -6 -24 C 2 -18, 4 -6, 0 0 Z" fill="#24593f" />
    <path d="M 0 0 C 6 -10, 18 -16, 22 -6 C 16 2, 6 4, 0 0 Z" fill="#2d6a4f" />
    <path d="M 0 0 C -8 6, -18 14, -14 22 C -4 18, 0 8, 0 0 Z" fill="#367a5b" />
    <path d="M 0 0 C 4 8, 14 16, 8 22 C 2 16, -2 8, 0 0 Z" fill="#1e4d35" />
    <path d="M 0 0 C -4 -12, 0 -22, 8 -26 C 12 -18, 6 -8, 0 0 Z" fill="#40916c" />
    {/* Delicate fine leaf midrib veins */}
    <path d="M 0 0 C -4 -10, -2 -18, -4 -22" stroke="#52b788" strokeWidth="0.8" fill="none" opacity="0.8" />
    <path d="M 0 0 C 8 -6, 14 -10, 18 -6" stroke="#52b788" strokeWidth="0.8" fill="none" opacity="0.8" />
    {/* Tiny golden forest bud accent */}
    <circle cx="0" cy="0" r="2.2" fill="#d4a373" />
    <circle cx="0" cy="0" r="1.2" fill="#fde047" />
  </g>
);

// 1. Cat sitting comfortably on the left branch, swinging its tail gently over the bough
const BranchSittingCat: React.FC<{
  transform?: string;
}> = ({ transform = 'translate(268, 345)' }) => {
  return (
    <g
      id="branch-sitting-cat"
      transform={transform}
      className="cursor-pointer pointer-events-auto"
      onClick={() => sound.playCatPurrMeow()}
    >
      {/* Branch contact shadow */}
      <ellipse cx="6" cy="12" rx="20" ry="4.5" fill="#24160c" opacity="0.65" />

      {/* Cat Sitting on Branch */}
      <g>
        {/* Tail Hanging Down below the branch edge, swaying gently */}
        <g transform="translate(-12, 10)">
          <g className="animate-branch-tail-sway">
            {/* Elegant feline tail hanging down and curling at the tip */}
            <path
              d="M 0 0 C -4 10, -7 22, -4 32 C -2 39, 4 42, 7 36 C 5 32, 1 33, -1 28 C -3 20, 0 10, 4 0 Z"
              fill="url(#catGingerBodyGrad)"
            />
            {/* White Tail Tip */}
            <path
              d="M -4 32 C -2 39, 4 42, 7 36 C 5 32, 2 33, 0 31 Z"
              fill="#ffffff"
            />
          </g>
        </g>

        {/* Hind Haunch / Sitting Thigh resting on wood */}
        <ellipse cx="-8" cy="4" rx="13" ry="10" fill="url(#catGingerBodyGrad)" />
        <ellipse cx="-12" cy="7" rx="8" ry="6" fill="#d97706" opacity="0.6" />

        {/* Main Torso sitting upright */}
        <path
          d="M -16 6 C -18 -4, -10 -14, 2 -14 C 10 -14, 16 -6, 15 6 C 14 12, 8 13, 0 13 C -8 13, -14 12, -16 6 Z"
          fill="url(#catGingerBodyGrad)"
        />

        {/* Tabby Rib Stripes */}
        <g opacity="0.75">
          <path d="M -7 -12 C -6 -5, -8 2, -11 8" stroke="#92400e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M -2 -13 C -1 -5, -3 2, -5 8" stroke="#92400e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M 3 -12 C 4 -5, 2 2, 0 8" stroke="#92400e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M 8 -9 C 9 -4, 7 2, 5 7" stroke="#92400e" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>

        {/* Fluffy White Chest & Bib */}
        <path
          d="M 5 -6 C 11 -3, 13 3, 11 10 C 8 12, 4 10, 2 6 C 1 2, 2 -3, 5 -6 Z"
          fill="url(#catGingerBellyGrad)"
        />

        {/* Front Paws planted gently on top of the branch */}
        <g transform="translate(6, 4)">
          {/* Back foreleg */}
          <rect x="-1" y="0" width="4.5" height="8" rx="2" fill="url(#catGingerBodyGrad)" opacity="0.85" />
          <ellipse cx="1.2" cy="8" rx="3.2" ry="2.2" fill="#ffffff" />
          {/* Front foreleg */}
          <rect x="4" y="0" width="4.8" height="8.5" rx="2" fill="url(#catGingerBodyGrad)" />
          <ellipse cx="6.4" cy="8.5" rx="3.5" ry="2.4" fill="#ffffff" />
          {/* Toe divisions */}
          <line x1="5.2" y1="7.5" x2="5.2" y2="9.8" stroke="#cbd5e1" strokeWidth="0.5" />
          <line x1="7.2" y1="7.5" x2="7.2" y2="9.8" stroke="#cbd5e1" strokeWidth="0.5" />
        </g>

        {/* Head turned gently toward viewer */}
        <g transform="translate(8, -13)">
          {/* Head sphere */}
          <ellipse cx="0" cy="0" rx="9.5" ry="8.5" fill="url(#catGingerBodyGrad)" />

          {/* Left Ear */}
          <polygon points="-6,-6 -8,-15 -1,-8" fill="url(#catGingerBodyGrad)" />
          <polygon points="-5,-7 -7,-13 -2,-8" fill="#fda4af" />
          <line x1="-4" y1="-8" x2="-6" y2="-12" stroke="#ffffff" strokeWidth="0.6" opacity="0.9" />

          {/* Right Ear */}
          <polygon points="1,-7 6,-16 7,-6" fill="url(#catGingerBodyGrad)" />
          <polygon points="2,-7 5,-14 6,-7" fill="#fda4af" />
          <line x1="3" y1="-8" x2="5" y2="-12" stroke="#ffffff" strokeWidth="0.6" opacity="0.9" />

          {/* Tabby forehead 'M' */}
          <path d="M -3 -5 L -1 -3 L 1 -5 L 3 -3" stroke="#92400e" strokeWidth="0.9" fill="none" strokeLinecap="round" />

          {/* Eyes - Luminous Emerald Almond Feline Eyes */}
          <g transform="translate(-3, -1)">
            <ellipse cx="0" cy="0" rx="2" ry="1.6" fill="#1e293b" />
            <ellipse cx="0" cy="0" rx="1.7" ry="1.3" fill="url(#catEyeEmeraldGrad)" />
            <ellipse cx="0" cy="0" rx="0.5" ry="1.1" fill="#090d16" />
            <circle cx="0.5" cy="-0.4" r="0.4" fill="#ffffff" />
          </g>
          <g transform="translate(4, -1)">
            <ellipse cx="0" cy="0" rx="2" ry="1.6" fill="#1e293b" />
            <ellipse cx="0" cy="0" rx="1.7" ry="1.3" fill="url(#catEyeEmeraldGrad)" />
            <ellipse cx="0" cy="0" rx="0.5" ry="1.1" fill="#090d16" />
            <circle cx="0.5" cy="-0.4" r="0.4" fill="#ffffff" />
          </g>

          {/* Whisker pads & Nose */}
          <ellipse cx="-1.2" cy="3" rx="2.2" ry="1.8" fill="#ffffff" />
          <ellipse cx="1.8" cy="3" rx="2.2" ry="1.8" fill="#ffffff" />
          <polygon points="-0.6,2.2 1.2,2.2 0.3,3.3" fill="#f43f5e" />

          {/* Curved Whiskers */}
          <g opacity="0.85">
            <path d="M 2 3 Q 7 2 11 1" stroke="#ffffff" strokeWidth="0.5" fill="none" />
            <path d="M 2 3.5 Q 7 4.5 10 6" stroke="#ffffff" strokeWidth="0.5" fill="none" />
            <path d="M -2 3 Q -7 2 -11 1" stroke="#ffffff" strokeWidth="0.5" fill="none" />
            <path d="M -2 3.5 Q -7 4.5 -10 6" stroke="#ffffff" strokeWidth="0.5" fill="none" />
          </g>
        </g>
      </g>
    </g>
  );
};

// 2. Playful cat in front of the tree chasing, running, jumping, and swiping at a dancing firefly
const PlayfulRootCat: React.FC<{
  transform?: string;
}> = ({ transform }) => {
  return (
    <g
      id="playful-root-cat-scene"
      transform={transform}
      className="cursor-pointer pointer-events-auto"
      onClick={() => sound.playCatPurrMeow()}
    >
      {/* Dancing Firefly flying, darting, and looping ahead */}
      <g className="animate-cat-chase-firefly">
        <circle cx="0" cy="0" r="10" fill="#fde047" opacity="0.35" className="animate-pulse" />
        <circle cx="0" cy="0" r="4.2" fill="#fef08a" />
        <circle cx="0" cy="0" r="2.2" fill="#ffffff" />
        {/* Fluttering translucent wings */}
        <ellipse cx="-3.5" cy="-3.5" rx="3.8" ry="1.8" fill="#ffffff" opacity="0.8" transform="rotate(-25 -3.5 -3.5)" />
        <ellipse cx="3.5" cy="-3.5" rx="3.8" ry="1.8" fill="#ffffff" opacity="0.8" transform="rotate(25 3.5 -3.5)" />
        {/* Sparkling trail */}
        <line x1="-2" y1="3" x2="-6" y2="8" stroke="#fde047" strokeWidth="1" strokeDasharray="1.5 2" opacity="0.85" />
      </g>

      {/* Playful Cat with running, leaping, and paw swiping animation */}
      <g className="animate-cat-chase-run">
        {/* Dynamic ground contact shadow (softens as cat leaps high into air) */}
        <ellipse cx="0" cy="14" rx="24" ry="5" fill="#121e14" opacity="0.7" />

        {/* Dynamic body articulation: tilts upward during leap, squashes on landing, turns around in 3D */}
        <g className="animate-cat-chase-body">
          {/* Playful Arching Tail sticking up with curled tip */}
          <g transform="translate(18, 0)">
            <path
              d="M 0 4 C 6 2, 12 -5, 12 -14 C 12 -20, 7 -22, 5 -18 C 3 -15, 7 -14, 8 -11 C 9 -5, 4 0, -2 3 Z"
              fill="url(#catCalicoBodyGrad)"
            />
            <path
              d="M 12 -14 C 12 -20, 7 -22, 5 -18 C 4 -15, 7 -14, 8 -11 Z"
              fill="#ea580c"
            />
          </g>

          {/* Hind Haunch / Raised Haunches in Playful Spring/Pounce */}
          <ellipse cx="10" cy="2" rx="11" ry="8.5" fill="url(#catCalicoBodyGrad)" />
          {/* Calico orange patch on flank */}
          <path d="M 6 -3 C 12 -6, 17 0, 14 5 C 9 6, 5 2, 6 -3 Z" fill="#ea580c" opacity="0.9" />

          {/* Back Hind Leg (Extended during leap) */}
          <path d="M 8 5 Q 12 10 13 13 L 9 13.5 Q 7 10 6 5 Z" fill="url(#catCalicoBodyGrad)" />
          <ellipse cx="11" cy="13.5" rx="3.2" ry="1.8" fill="#ffffff" />

          {/* Main Torso crouching and bounding forward towards firefly */}
          <path
            d="M 16 0 C 14 -7, 6 -9, -4 -6 C -12 -3, -16 2, -14 7 C -10 12, 2 11, 12 9 C 16 8, 17 4, 16 0 Z"
            fill="url(#catCalicoBodyGrad)"
          />
          {/* Calico dark slate patch on back */}
          <path d="M -4 -7 C 2 -9, 4 -4, 0 -2 C -4 -1, -5 -4, -4 -7 Z" fill="#334155" opacity="0.88" />

          {/* Planted Left Forepaw */}
          <path d="M -10 4 L -11 12 C -11 13, -9 14, -7 14 L -5 14 C -5 12, -7 9, -7 4 Z" fill="url(#catCalicoBodyGrad)" />
          <ellipse cx="-8" cy="13.5" rx="3" ry="1.8" fill="#ffffff" />

          {/* PLAYFUL BATTING & SWIPING FOREPAW (Active Leap & Paw Swiping Gesture) */}
          <g transform="translate(-14, 5)">
            <g className="animate-cat-chase-paw">
              {/* Raised foreleg reaching out toward firefly */}
              <path
                d="M 0 0 C -4 -2, -8 -5, -12 -7 C -14 -8, -15 -6, -13 -4 C -9 -1, -5 2, 0 3 Z"
                fill="url(#catCalicoBodyGrad)"
              />
              {/* White paw batting forward with extended toes */}
              <ellipse cx="-13" cy="-6" rx="3.8" ry="2.8" fill="#ffffff" transform="rotate(-25 -13 -6)" />
              <line x1="-15" y1="-7" x2="-16.5" y2="-8.5" stroke="#cbd5e1" strokeWidth="0.65" />
              <line x1="-14" y1="-8.5" x2="-15.5" y2="-10" stroke="#cbd5e1" strokeWidth="0.65" />
            </g>
          </g>

          {/* Head tilted forward attentively towards the dancing firefly */}
          <g transform="translate(-18, -1)">
            {/* Head base */}
            <ellipse cx="0" cy="0" rx="9" ry="8" fill="url(#catCalicoBodyGrad)" />

            {/* Calico patch over eye/ear */}
            <path d="M -3 -6 C 2 -8, 7 -4, 5 1 C 1 3, -2 0, -3 -6 Z" fill="#ea580c" opacity="0.95" />

            {/* Alert Forward Ears */}
            <polygon points="-7,-4 -12,-12 -4,-8" fill="url(#catCalicoBodyGrad)" />
            <polygon points="-6,-5 -10,-10 -5,-7" fill="#fda4af" />

            <polygon points="-1,-6 2,-14 6,-7" fill="#ea580c" />
            <polygon points="0,-6 2,-12 5,-7" fill="#fda4af" />

            {/* Big Curious Playful Amber Eyes locked on the firefly */}
            <g transform="translate(-5, -1)">
              <ellipse cx="0" cy="0" rx="2.2" ry="1.8" fill="#1e293b" />
              <ellipse cx="0" cy="0" rx="1.8" ry="1.4" fill="url(#catEyeAmberGrad)" />
              <ellipse cx="-0.3" cy="0" rx="0.7" ry="1.3" fill="#090d16" />
              <circle cx="0.4" cy="-0.4" r="0.45" fill="#ffffff" />
            </g>
            <g transform="translate(1, -1)">
              <ellipse cx="0" cy="0" rx="2.2" ry="1.8" fill="#1e293b" />
              <ellipse cx="0" cy="0" rx="1.8" ry="1.4" fill="url(#catEyeAmberGrad)" />
              <ellipse cx="-0.3" cy="0" rx="0.7" ry="1.3" fill="#090d16" />
              <circle cx="0.4" cy="-0.4" r="0.45" fill="#ffffff" />
            </g>

            {/* Whisker pads & Pink Nose */}
            <ellipse cx="-3.5" cy="2.5" rx="2.2" ry="1.8" fill="#ffffff" />
            <ellipse cx="-0.5" cy="2.5" rx="2.2" ry="1.8" fill="#ffffff" />
            <polygon points="-2.6,1.8 -1.2,1.8 -1.9,2.8" fill="#f43f5e" />

            {/* Fine Whiskers twitching forward */}
            <g opacity="0.85">
              <path d="M -4 2.5 Q -9 1 -13 -1" stroke="#ffffff" strokeWidth="0.55" fill="none" />
              <path d="M -4 3 Q -9 4 -12 6" stroke="#ffffff" strokeWidth="0.55" fill="none" />
              <path d="M 1 2.5 Q 6 1 9 0" stroke="#ffffff" strokeWidth="0.55" fill="none" />
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};

export const MemoryTree: React.FC<MemoryTreeProps> = () => {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [selectedWish, setSelectedWish] = useState<WishItem | null>(null);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // New interactive states: Dynamic wishes & Polaroid carousel
  const [viewMode, setViewMode] = useState<'canopy' | 'polaroid'>('canopy');
  const [showAddWishModal, setShowAddWishModal] = useState(false);
  const [newWishInput, setNewWishInput] = useState('');
  const [isSavingWish, setIsSavingWish] = useState(false);

  // Real-time live Firestore synchronization across all connected devices
  useEffect(() => {
    const unsubscribe = subscribeToSharedWishes(liveWishes => {
      setWishes(liveWishes);
    });

    return () => unsubscribe();
  }, []);

  const handleAddNewWish = async () => {
    const trimmed = newWishInput.trim();
    if (!trimmed || isSavingWish) return;

    setIsSavingWish(true);
    sound.playButtonTap();
    sound.playMagicalChime();

    try {
      const saved = await addSharedWish(trimmed);
      setWishes(prev => [saved, ...prev.filter(w => w.id !== saved.id)]);
      setNewWishInput('');
      setShowAddWishModal(false);
    } catch (e) {
      console.warn('Error saving wish:', e);
    } finally {
      setIsSavingWish(false);
    }
  };

  // Smooth modal opening
  const handleOpenWish = (wish: WishItem) => {
    sound.playButtonTap();
    sound.playMagicalChime();
    setIsClosingModal(false);
    setSelectedWish(wish);
  };

  // Smooth 3D fade-out and fold-out closing
  const handleCloseWish = () => {
    sound.playButtonTap();
    setIsClosingModal(true);
    setTimeout(() => {
      setSelectedWish(null);
      setIsClosingModal(false);
      setIsDeletingId(null);
    }, 280);
  };

  // Permanent deletion from Firestore and all devices
  const handleDeleteWish = async (id: string) => {
    sound.playButtonTap();
    setIsClosingModal(true);
    setTimeout(async () => {
      setSelectedWish(null);
      setIsClosingModal(false);
      setIsDeletingId(null);
      await deleteSharedWish(id);
    }, 250);
  };

  return (
    <div
      id="slide-memory-tree"
      className="relative z-10 w-full max-w-5xl mx-auto px-2 md:px-4 py-1 flex flex-col items-center justify-between h-[calc(100svh-65px)] max-h-[calc(100svh-65px)] select-none overflow-hidden"
    >
      {/* Top Controls: Sleek Single-Line Luxury Toolbar (Zero Word-Wrapping) */}
      <div className="w-full max-w-4xl flex items-center justify-between px-2 mb-2 z-20">
        <div className="flex items-center p-1 bg-black/40 border border-white/10 rounded-full backdrop-blur-md shadow-sm">
          <button
            id="view-canopy-btn"
            onClick={() => {
              sound.playButtonTap();
              setViewMode('canopy');
            }}
            className={`h-8 sm:h-9 px-3 sm:px-4 rounded-full text-xs font-serif flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
              viewMode === 'canopy'
                ? 'bg-amber-400/25 text-[#ffd700] border border-amber-400/40 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TreePine className="w-3.5 h-3.5 text-amber-300" />
            <span>Canopy</span>
          </button>

          <button
            id="view-polaroid-btn"
            onClick={() => {
              sound.playButtonTap();
              setViewMode('polaroid');
            }}
            className={`h-8 sm:h-9 px-3 sm:px-4 rounded-full text-xs font-serif flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
              viewMode === 'polaroid'
                ? 'bg-amber-400/25 text-[#ffd700] border border-amber-400/40 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-amber-300" />
            <span>Album</span>
          </button>
        </div>

        {/* Hang a Wish Button: Sleek Golden Pill */}
        <button
          id="open-add-wish-btn"
          onClick={() => {
            sound.playButtonTap();
            setShowAddWishModal(true);
          }}
          className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-serif text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-[0_2px_12px_rgba(245,158,11,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300/60 whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-stone-950" />
          <span>Add Wish</span>
        </button>
      </div>

      {viewMode === 'polaroid' ? (
        <div className="relative w-full max-w-4xl p-3 md:p-6 rounded-3xl bg-gradient-to-b from-[#0b0e17] via-[#080a10] to-[#040508] border border-stone-800 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex items-center justify-center max-h-[calc(100svh-135px)] overflow-y-auto">
          <PolaroidCarousel onClose={() => setViewMode('canopy')} />
        </div>
      ) : (
        /* Main Organic Tree Container - Expansive Responsive Viewport */
        <div className="relative w-full max-w-4xl aspect-[1000/650] max-h-[calc(100svh-135px)] rounded-2xl md:rounded-3xl p-1 md:p-3 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0e1422] via-[#090f19] to-[#060a10] border border-stone-800 shadow-[0_25px_70px_rgba(0,0,0,0.9)]">
          
          {/* Natural Twilight Atmosphere */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[520px] h-[300px] bg-gradient-to-b from-amber-400/8 via-emerald-950/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute top-1/4 left-1/4 w-[320px] h-[240px] bg-sky-950/25 rounded-full blur-3xl" />
            <div className="absolute top-1/4 right-1/4 w-[320px] h-[240px] bg-amber-950/25 rounded-full blur-3xl" />
            <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#080e0a]/80 via-[#080e0a]/35 to-transparent" />
          </div>

          {/* ================= HYPER-DETAILED ORGANIC BOTANICAL TREE SVG ================= */}
          <svg
            viewBox="0 0 1000 650"
            width="100%"
            height="auto"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-2xl"
          >
          <defs>
            {/* Rich Organic Wood Bark Gradient (Softened warm amber & chestnut wood) */}
            <linearGradient id="deepBarkGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#3d2719" />
              <stop offset="25%" stopColor="#543823" />
              <stop offset="55%" stopColor="#6f4b30" />
              <stop offset="85%" stopColor="#8d603e" />
              <stop offset="100%" stopColor="#614128" />
            </linearGradient>

            {/* Bark Shadow & Deep Grain Contours (Softened warm tone shadows) */}
            <linearGradient id="barkGrainShade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2c1a10" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#543722" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8a5c39" stopOpacity="0.9" />
            </linearGradient>

            {/* Glowing Amber Hollow Hearth */}
            <radialGradient id="hollowHeartGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#fde047" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#d97706" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#92400e" stopOpacity="0" />
            </radialGradient>

            {/* Glowing Orb Aura for Interactive Touch Targets */}
            <radialGradient id="wishOrbAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>

            {/* Wide Expansive Foliage Canopy Masses (Rich luminous woodland greens) */}
            <radialGradient id="wideCanopy1" cx="48%" cy="42%" r="54%">
              <stop offset="0%" stopColor="#2d583f" stopOpacity="0.92" />
              <stop offset="60%" stopColor="#1e3e2c" stopOpacity="0.75" />
              <stop offset="90%" stopColor="#132a1d" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0b1a11" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="wideCanopy2" cx="52%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#376747" stopOpacity="0.88" />
              <stop offset="65%" stopColor="#23462f" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#112417" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="wideCanopyWarm" cx="50%" cy="40%" r="52%">
              <stop offset="0%" stopColor="#4a764c" stopOpacity="0.82" />
              <stop offset="70%" stopColor="#294e33" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#122618" stopOpacity="0" />
            </radialGradient>

            {/* Hollow Glow Blur Filter */}
            <filter id="hollowFilter" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Glowing Golden Crown Leaf Gradient */}
            <linearGradient id="crownLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#fef08a" />
              <stop offset="65%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Golden Active Wish Leaf Gradient */}
            <linearGradient id="goldWishLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="40%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Crown Wish Radiant Aura */}
            <radialGradient id="crownGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>

            {/* Celestial Cloud Ambient Aura */}
            <radialGradient id="cloudGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.5" />
              <stop offset="45%" stopColor="#e0e7ff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </radialGradient>

            {/* Leaf Drop Shadows */}
            <filter id="leafDropShadowCrown" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#f59e0b" floodOpacity="0.85" />
            </filter>
            <filter id="leafDropShadowNormal" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.75" />
            </filter>

            {/* ================= REALISTIC FELINE COAT & EYE GRADIENTS ================= */}
            <linearGradient id="catGingerBodyGrad" x1="20%" y1="0%" x2="60%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>

            <linearGradient id="catGingerBellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>

            <linearGradient id="catTuxedoBodyGrad" x1="20%" y1="0%" x2="60%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="30%" stopColor="#1e293b" />
              <stop offset="75%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            <linearGradient id="catCalicoBodyGrad" x1="20%" y1="0%" x2="60%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#fef3c7" />
              <stop offset="85%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            <radialGradient id="catEyeAmberGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="85%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#78350f" />
            </radialGradient>

            <radialGradient id="catEyeEmeraldGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="85%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </radialGradient>
          </defs>

          {/* ================= 1. EXPANSIVE FOLIAGE CLUSTERS (SPANNING 80%+ WIDTH) ================= */}
          <g id="expansive-canopy-backdrop">
            {/* Crown Zenith foliage */}
            <ellipse cx="500" cy="160" rx="270" ry="140" fill="url(#wideCanopy1)" />
            {/* Far Left Canopy (reaching to x=80) */}
            <ellipse cx="280" cy="240" rx="220" ry="130" fill="url(#wideCanopy2)" />
            <ellipse cx="150" cy="330" rx="160" ry="100" fill="url(#wideCanopy1)" />
            {/* Far Right Canopy (reaching to x=920) */}
            <ellipse cx="720" cy="240" rx="220" ry="130" fill="url(#wideCanopyWarm)" />
            <ellipse cx="850" cy="330" rx="160" ry="100" fill="url(#wideCanopy2)" />

            {/* Layered Organic Leaf Silhouette Contours */}
            <path
              d="M 120 340 Q 90 260 160 210 Q 230 140 330 130 Q 410 80 500 85 Q 590 80 670 130 Q 770 140 840 210 Q 910 260 880 340 Q 840 420 740 400 Q 640 430 500 420 Q 360 430 260 400 Q 160 420 120 340 Z"
              fill="#183122"
              opacity="0.55"
            />
          </g>

          {/* ================= 2. NATURAL ROOTS & MOSSY FOREST EARTH ================= */}
          <g id="organic-roots-and-earth">
            {/* Ground Soil Horizon */}
            <ellipse cx="500" cy="630" rx="420" ry="38" fill="#142217" />
            <path
              d="M 100 650 Q 300 590 500 595 Q 700 590 900 650 Z"
              fill="#1a2d1f"
            />
            {/* Soft Moss Mound on base with lush organic highlights */}
            <path
              d="M 320 625 Q 410 592 500 595 Q 590 592 680 625 Z"
              fill="#264830"
              opacity="0.95"
            />
            <path
              d="M 370 618 Q 440 593 500 595 Q 560 593 630 618 Z"
              fill="#3a6946"
              opacity="0.55"
            />

            {/* Deep Sweeping Taproots Anchoring to Earth */}
            {/* Far Left Taproot */}
            <path
              d="M 450 600 Q 340 620 200 642 Q 130 648 80 650"
              stroke="url(#deepBarkGrad)"
              strokeWidth="24"
              fill="none"
              strokeLinecap="round"
            />
            {/* Mid Left Root */}
            <path
              d="M 470 605 Q 400 625 320 648"
              stroke="url(#deepBarkGrad)"
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
            />
            {/* Center Anchor Root */}
            <path
              d="M 500 605 Q 500 625 500 650"
              stroke="url(#deepBarkGrad)"
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
            />
            {/* Mid Right Root */}
            <path
              d="M 530 605 Q 600 625 680 648"
              stroke="url(#deepBarkGrad)"
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
            />
            {/* Far Right Taproot */}
            <path
              d="M 550 600 Q 660 620 800 642 Q 870 648 920 650"
              stroke="url(#deepBarkGrad)"
              strokeWidth="24"
              fill="none"
              strokeLinecap="round"
            />

            {/* Realistic Bark Root Highlights */}
            <path
              d="M 450 596 Q 340 616 200 638"
              stroke="#a3724a"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 550 596 Q 660 616 800 638"
              stroke="#a3724a"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* ================= 3. SWEEPING ORGANIC OAK TRUNK WITH REALISTIC GRAIN ================= */}
          <g id="organic-trunk">
            {/* Sculpted Trunk Silhouette fluting organically into limbs & root base */}
            <path
              d="M 430 608 Q 405 490 440 395 C 455 330, 465 285, 475 250 C 490 238, 510 238, 525 250 C 535 285, 545 330, 560 395 Q 595 490 570 608 Z"
              fill="url(#deepBarkGrad)"
            />

            {/* Deep Woody Bark Grooves & Shadow Furrows following organic curvature */}
            <path
              d="M 452 596 C 424 485, 452 395, 472 315 C 480 280, 486 255, 488 245"
              stroke="#2c1b12"
              strokeWidth="8.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 548 596 C 576 485, 548 395, 528 315 C 520 280, 514 255, 512 245"
              stroke="#2c1b12"
              strokeWidth="8.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Realistic Organic Wood Grain Lines & Growth Rings */}
            <path
              d="M 466 580 C 440 475, 462 385, 478 315 C 485 280, 490 255, 492 245"
              stroke="#94633d"
              strokeWidth="3.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 534 580 C 560 475, 538 385, 522 315 C 515 280, 510 255, 508 245"
              stroke="#94633d"
              strokeWidth="3.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 500 590 Q 504 490 498 440"
              stroke="#442a1b"
              strokeWidth="4.5"
              fill="none"
            />

            {/* ================= MYSTICAL CENTER HOLLOW WITH WARM AMBIENT GLOW ================= */}
            <g transform="translate(500, 440)" className="drop-shadow-lg">
              {/* Outer Bark Knothole Rim */}
              <ellipse cx="0" cy="0" rx="16" ry="26" fill="#2d1a10" />
              <ellipse cx="1" cy="2" rx="11" ry="19" fill="#1a0f0a" />

              {/* Concentric Wood Grain Swirls wrapping the Hollow */}
              <path
                d="M -14 -18 Q 0 -28 14 -18"
                stroke="#946543"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M -14 18 Q 0 28 14 18"
                stroke="#946543"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
              />

              {/* Mystical Glowing Hearth / Firefly Heart inside hollow */}
              <circle
                cx="1"
                cy="5"
                r="9"
                fill="url(#hollowHeartGlow)"
                filter="url(#hollowFilter)"
                className="animate-pulse"
                style={{ animationDuration: '3s' }}
              />
              <circle cx="1" cy="5" r="3.2" fill="#ffffff" />
            </g>
          </g>

          {/* ================= 4. ORGANIC CONTINUOUS BRANCH ARCHITECTURE (SEAMLESSLY INTERCONNECTED) ================= */}
          <g id="expansive-master-boughs">
            {/* Trunk-to-Bough Organic Fillet Swells (Zero Seams/Gaps) */}
            <path
              d="M 460 415 C 440 405, 415 400, 390 398 C 420 380, 445 370, 468 360 Z"
              fill="url(#deepBarkGrad)"
            />
            <path
              d="M 540 415 C 560 405, 585 400, 610 398 C 580 380, 555 370, 532 360 Z"
              fill="url(#deepBarkGrad)"
            />

            {/* ---------- 1. ZENITH HIGH CROWN SPIRE & SYMMETRICAL FORKS ---------- */}
            {/* Center Crown Spire rising gracefully from trunk */}
            <path
              d="M 500 245 Q 498 160 500 70"
              stroke="url(#deepBarkGrad)"
              strokeWidth="13"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 498 245 Q 496 160 499 70"
              stroke="#a3724a"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            {/* Left Crown Primary Fork (Seamlessly branching at x:499, y:140) */}
            <path
              d="M 499 140 Q 465 110 420 72"
              stroke="url(#deepBarkGrad)"
              strokeWidth="7.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Left Crown Sub-twig (Branching seamlessly at x:462, y:110) */}
            <path
              d="M 462 110 Q 450 85 438 68"
              stroke="url(#deepBarkGrad)"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Right Crown Primary Fork (Seamlessly branching at x:499, y:140) */}
            <path
              d="M 499 140 Q 535 110 580 72"
              stroke="url(#deepBarkGrad)"
              strokeWidth="7.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Right Crown Sub-twig (Branching seamlessly at x:537, y:110) */}
            <path
              d="M 537 110 Q 550 85 562 68"
              stroke="url(#deepBarkGrad)"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* ---------- 2. HIGH LEFT CANOPY LIMB & SUB-BRANCHES ---------- */}
            {/* Primary High Left Limb curving up-left from trunk collar */}
            <path
              d="M 478 245 Q 390 180 280 130 Q 200 95 120 105"
              stroke="url(#deepBarkGrad)"
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 476 242 Q 390 176 280 126 Q 200 92 120 102"
              stroke="#a3724a"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* High Left Upper Fork (Branching seamlessly at x:365, y:172) */}
            <path
              d="M 365 172 Q 310 115 250 65"
              stroke="url(#deepBarkGrad)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            {/* High Left Twig (Branching seamlessly at x:309, y:117) */}
            <path
              d="M 309 117 Q 275 88 232 75"
              stroke="url(#deepBarkGrad)"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* High Left Droop Limb (Branching seamlessly at x:280, y:130) */}
            <path
              d="M 280 130 Q 205 155 130 185"
              stroke="url(#deepBarkGrad)"
              strokeWidth="6.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* High Left Droop Twig (Branching seamlessly at x:205, y:156) */}
            <path
              d="M 205 156 Q 165 195 120 220"
              stroke="url(#deepBarkGrad)"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* ---------- 3. HIGH RIGHT CANOPY LIMB & SUB-BRANCHES ---------- */}
            {/* Primary High Right Limb curving up-right from trunk collar */}
            <path
              d="M 522 245 Q 610 180 720 130 Q 790 98 845 105"
              stroke="url(#deepBarkGrad)"
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 524 242 Q 610 176 720 126 Q 790 95 845 102"
              stroke="#a3724a"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* High Right Upper Fork (Branching seamlessly at x:635, y:172) */}
            <path
              d="M 635 172 Q 690 115 750 65"
              stroke="url(#deepBarkGrad)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            {/* High Right Twig (Branching seamlessly at x:691, y:117) */}
            <path
              d="M 691 117 Q 725 88 768 75"
              stroke="url(#deepBarkGrad)"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* High Right Droop Limb (Branching seamlessly at x:720, y:130) */}
            <path
              d="M 720 130 Q 785 155 845 185"
              stroke="url(#deepBarkGrad)"
              strokeWidth="6.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* High Right Droop Twig (Branching seamlessly at x:768, y:156) */}
            <path
              d="M 768 156 Q 810 195 850 220"
              stroke="url(#deepBarkGrad)"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* ---------- 4. MASSIVE MID-LOWER LEFT MASTER BOUGH ---------- */}
            {/* Main Arching Master Bough extending to far left */}
            <path
              d="M 450 375 Q 330 380 220 345 Q 120 310 35 340"
              stroke="url(#deepBarkGrad)"
              strokeWidth="20"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 450 370 Q 330 375 220 340 Q 120 305 35 335"
              stroke="#a3724a"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Left Ascending Fork (Branching seamlessly at x:310, y:368) */}
            <path
              d="M 310 368 Q 230 300 160 225 Q 110 170 50 160"
              stroke="url(#deepBarkGrad)"
              strokeWidth="11"
              fill="none"
              strokeLinecap="round"
            />
            {/* Left Ascending Twig 1 (Branching seamlessly at x:225, y:280) */}
            <path
              d="M 225 280 Q 155 220 85 175"
              stroke="url(#deepBarkGrad)"
              strokeWidth="5.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Left Ascending Twig 2 (Branching seamlessly at x:160, y:225) */}
            <path
              d="M 160 225 Q 110 205 60 215"
              stroke="url(#deepBarkGrad)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Left Descending Lower Bough (Branching seamlessly at x:220, y:345) */}
            <path
              d="M 220 345 Q 155 410 95 470 Q 60 500 25 515"
              stroke="url(#deepBarkGrad)"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
            />
            {/* Left Descending Twig (Branching seamlessly at x:145, y:420) */}
            <path
              d="M 145 420 Q 95 475 45 495"
              stroke="url(#deepBarkGrad)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />

            {/* ---------- 5. MASSIVE MID-LOWER RIGHT MASTER BOUGH ---------- */}
            {/* Main Arching Master Bough extending to far right */}
            <path
              d="M 550 375 Q 670 380 780 345 Q 870 310 955 340"
              stroke="url(#deepBarkGrad)"
              strokeWidth="20"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 550 370 Q 670 375 780 340 Q 870 305 955 335"
              stroke="#a3724a"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Right Ascending Fork (Branching seamlessly at x:690, y:368) */}
            <path
              d="M 690 368 Q 770 300 840 225 Q 890 170 950 160"
              stroke="url(#deepBarkGrad)"
              strokeWidth="11"
              fill="none"
              strokeLinecap="round"
            />
            {/* Right Ascending Twig 1 (Branching seamlessly at x:775, y:280) */}
            <path
              d="M 775 280 Q 845 220 915 175"
              stroke="url(#deepBarkGrad)"
              strokeWidth="5.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Right Ascending Twig 2 (Branching seamlessly at x:840, y:225) */}
            <path
              d="M 840 225 Q 890 205 940 215"
              stroke="url(#deepBarkGrad)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Right Descending Lower Bough (Branching seamlessly at x:780, y:345) */}
            <path
              d="M 780 345 Q 845 410 905 470 Q 940 500 975 515"
              stroke="url(#deepBarkGrad)"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
            />
            {/* Right Descending Twig (Branching seamlessly at x:855, y:420) */}
            <path
              d="M 855 420 Q 905 475 955 495"
              stroke="url(#deepBarkGrad)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* ================= 5. LUSH BOTANICAL FOLIAGE CLUSTERS (ELIMINATING BLUNT/DRY BRANCHES & FILLING GAPS) ================= */}
          <g id="lush-branch-foliage-clusters">
            {/* Crown Zenith Tips & Forks */}
            <BranchLeafCluster x={500} y={68} scale={1.15} rotation={0} />
            <BranchLeafCluster x={420} y={70} scale={1.05} rotation={-18} />
            <BranchLeafCluster x={438} y={66} scale={0.95} rotation={-8} />
            <BranchLeafCluster x={580} y={70} scale={1.05} rotation={18} />
            <BranchLeafCluster x={562} y={66} scale={0.95} rotation={8} />

            {/* High Left Canopy Tips & Sub-twigs */}
            <BranchLeafCluster x={120} y={105} scale={1.2} rotation={-25} />
            <BranchLeafCluster x={250} y={65} scale={1.1} rotation={-20} />
            <BranchLeafCluster x={232} y={75} scale={1.0} rotation={-15} />
            <BranchLeafCluster x={130} y={185} scale={1.15} rotation={22} />
            <BranchLeafCluster x={120} y={220} scale={1.05} rotation={16} />

            {/* High Right Canopy Tips & Sub-twigs */}
            <BranchLeafCluster x={845} y={105} scale={1.2} rotation={25} />
            <BranchLeafCluster x={750} y={65} scale={1.1} rotation={20} />
            <BranchLeafCluster x={768} y={75} scale={1.0} rotation={15} />
            <BranchLeafCluster x={845} y={185} scale={1.15} rotation={-22} />
            <BranchLeafCluster x={850} y={220} scale={1.05} rotation={-16} />

            {/* Mid-Lower Left Master Boughs & Outer Sprigs */}
            <BranchLeafCluster x={35} y={340} scale={1.25} rotation={-22} />
            <BranchLeafCluster x={75} y={328} scale={1.15} rotation={-18} />
            <BranchLeafCluster x={50} y={160} scale={1.2} rotation={-25} />
            <BranchLeafCluster x={85} y={175} scale={1.1} rotation={-20} />
            <BranchLeafCluster x={60} y={215} scale={1.05} rotation={-15} />
            <BranchLeafCluster x={95} y={470} scale={1.1} rotation={20} />
            <BranchLeafCluster x={45} y={495} scale={1.15} rotation={22} />
            <BranchLeafCluster x={25} y={515} scale={1.2} rotation={24} />

            {/* Mid-Lower Right Master Boughs & Outer Sprigs */}
            <BranchLeafCluster x={955} y={340} scale={1.25} rotation={22} />
            <BranchLeafCluster x={925} y={328} scale={1.15} rotation={18} />
            <BranchLeafCluster x={950} y={160} scale={1.2} rotation={25} />
            <BranchLeafCluster x={915} y={175} scale={1.1} rotation={20} />
            <BranchLeafCluster x={940} y={215} scale={1.05} rotation={15} />
            <BranchLeafCluster x={905} y={470} scale={1.1} rotation={-20} />
            <BranchLeafCluster x={955} y={495} scale={1.15} rotation={-22} />
            <BranchLeafCluster x={975} y={515} scale={1.2} rotation={-24} />

            {/* Canopy Gap Fillers & Inner Nodes (Connecting sparse voids) */}
            <BranchLeafCluster x={185} y={270} scale={1.15} rotation={-10} />
            <BranchLeafCluster x={815} y={270} scale={1.15} rotation={10} />
            <BranchLeafCluster x={320} y={235} scale={1.05} rotation={-15} />
            <BranchLeafCluster x={680} y={235} scale={1.05} rotation={15} />
            <BranchLeafCluster x={145} y={395} scale={1.1} rotation={18} />
            <BranchLeafCluster x={855} y={395} scale={1.1} rotation={-18} />
            <BranchLeafCluster x={200} y={145} scale={1.05} rotation={-8} />
            <BranchLeafCluster x={800} y={145} scale={1.05} rotation={8} />
          </g>

          {/* ================= 6. CELESTIAL CLOUD SLEEPING CAT (GENTLE FLOATING WITH ZZZ BUBBLES) ================= */}
          <g
            id="celestial-cloud-sleeping-cat"
            transform="translate(805, 85) scale(0.95)"
            className="cursor-pointer transition-transform hover:scale-105 pointer-events-auto"
            onClick={() => sound.playCatPurrMeow()}
          >
            <g className="animate-cloud-float">
              {/* Soft Luminous Cloud Aura */}
              <ellipse cx="0" cy="14" rx="76" ry="34" fill="url(#cloudGlowGrad)" />

              {/* Pillowy Cloud Bed (Cloud pillow underneath the cat) */}
              <g opacity="0.96">
                <ellipse cx="-40" cy="14" rx="30" ry="20" fill="#cbd5e1" />
                <ellipse cx="-20" cy="2" rx="34" ry="22" fill="#f1f5f9" />
                <ellipse cx="20" cy="0" rx="36" ry="24" fill="#ffffff" />
                <ellipse cx="46" cy="12" rx="28" ry="18" fill="#e2e8f0" />
                <ellipse cx="0" cy="18" rx="48" ry="20" fill="#f8fafc" />
              </g>

              {/* Twinkling Stardust / Sparkles drifting around cloud */}
              <g className="animate-pulse" style={{ animationDuration: '3s' }}>
                <circle cx="-54" cy="-14" r="1.8" fill="#fef08a" />
                <circle cx="58" cy="-15" r="1.6" fill="#ffffff" />
                <circle cx="-12" cy="-28" r="2.0" fill="#ffffff" />
                <circle cx="36" cy="-24" r="1.6" fill="#fef08a" />
              </g>

              {/* Cat Sleeping Still on Top of Cloud (realistic curled feline anatomy) */}
              <g transform="translate(-10, -14) scale(0.66)">
                {/* Soft contact shadow on cloud surface */}
                <ellipse cx="20" cy="26" rx="26" ry="7" fill="#94a3b8" opacity="0.32" />

                {/* Realistic Curled Sleeping Cat Body Contour */}
                <path
                  d="M -4 14 C -6 2, 4 -7, 20 -7 C 36 -7, 46 2, 44 14 C 42 24, 30 28, 14 28 C -2 28, -2 24, -4 14 Z"
                  fill="url(#catGingerBodyGrad)"
                />

                {/* Gentle Moonlight Rim Highlight on Sleeping Spine */}
                <path
                  d="M 2 -4 C 18 -6, 32 -4, 40 4"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.2"
                  fill="none"
                  strokeLinecap="round"
                />

                {/* Realistic Curved Mackerel Tabby Stripes */}
                <g opacity="0.75">
                  <path d="M 8 -5 C 12 5, 8 16, 4 24" stroke="#92400e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
                  <path d="M 18 -6 C 22 4, 18 16, 14 25" stroke="#92400e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
                  <path d="M 28 -4 C 32 4, 28 15, 24 23" stroke="#92400e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
                  <path d="M 37 0 C 40 7, 36 15, 32 20" stroke="#92400e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                </g>

                {/* Tucked White Front Paws under chin */}
                <ellipse cx="8" cy="22" rx="4.5" ry="3" fill="#ffffff" />
                <line x1="8" y1="20" x2="8" y2="24" stroke="#e2e8f0" strokeWidth="0.7" />

                {/* Realistic Sleeping Head Resting against paws */}
                <g transform="translate(-4, 9)">
                  <ellipse cx="0" cy="0" rx="14" ry="12" fill="url(#catGingerBodyGrad)" />

                  {/* Ears with inner pink & fluff */}
                  <polygon points="-12,-3 -17,-13 -7,-7" fill="#d97706" />
                  <polygon points="-11,-4 -15,-11 -8,-6" fill="#fda4af" />
                  <line x1="-10" y1="-5" x2="-13" y2="-9" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />

                  <polygon points="-2,-5 4,-14 6,-5" fill="#f59e0b" />
                  <polygon points="-1,-5 3,-12 5,-5" fill="#fda4af" />
                  <line x1="0" y1="-6" x2="2" y2="-10" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />

                  {/* Peaceful sleeping curved eyes with fine lashes */}
                  <path d="M -8 1 Q -5 4 -2 1" stroke="#5c2406" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                  <path d="M 1 1 Q 4 4 7 1" stroke="#5c2406" strokeWidth="1.6" fill="none" strokeLinecap="round" />

                  {/* Soft White Muzzle */}
                  <ellipse cx="-1" cy="4" rx="4.5" ry="3.5" fill="#ffffff" />
                  <ellipse cx="2" cy="4" rx="4.5" ry="3.5" fill="#ffffff" />

                  {/* Pink Leather Nose */}
                  <polygon points="-0.8,3.2 1.8,3.2 0.5,4.4" fill="#f43f5e" />

                  {/* Delicate Curved Whiskers */}
                  <path d="M -2 4 Q -8 2 -14 1" stroke="#ffffff" strokeWidth="0.7" fill="none" opacity="0.9" />
                  <path d="M -2 5 Q -8 6 -13 9" stroke="#ffffff" strokeWidth="0.7" fill="none" opacity="0.9" />
                  <path d="M 3 4 Q 9 2 15 1" stroke="#ffffff" strokeWidth="0.7" fill="none" opacity="0.9" />
                  <path d="M 3 5 Q 9 6 14 9" stroke="#ffffff" strokeWidth="0.7" fill="none" opacity="0.9" />
                </g>

                {/* Curled Tail wrapping around flank and paws */}
                <path
                  d="M 44 14 C 58 17, 56 29, 48 35 C 40 40, 24 37, 18 35"
                  stroke="url(#catGingerBodyGrad)"
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 28 37 C 24 37, 18 35, 16 34"
                  stroke="#ffffff"
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>

              {/* ================= SLEEPING BAUBLES ("💤💤💤") FLOATING GENTLY FROM CAT ================= */}
              <g id="sleeping-baubles-cluster" transform="translate(-18, -18)">
                {/* Bauble 1: Small cute "z" floating bubble */}
                <g className="animate-sleep-bubble-1">
                  <circle cx="0" cy="0" r="7.5" fill="#e0e7ff" fillOpacity="0.28" stroke="#c7d2fe" strokeWidth="0.8" />
                  <ellipse cx="-2.2" cy="-2.2" rx="2.5" ry="1.5" fill="#ffffff" fillOpacity="0.8" />
                  <text x="0" y="3" textAnchor="middle" fill="#fde047" fontSize="8.5" fontWeight="bold" fontFamily="system-ui, sans-serif">z</text>
                </g>

                {/* Bauble 2: Medium "Z" floating bubble */}
                <g className="animate-sleep-bubble-2">
                  <circle cx="0" cy="0" r="9.5" fill="#e0e7ff" fillOpacity="0.28" stroke="#a5b4fc" strokeWidth="0.85" />
                  <ellipse cx="-2.8" cy="-2.8" rx="3.2" ry="1.8" fill="#ffffff" fillOpacity="0.8" />
                  <text x="0" y="3.8" textAnchor="middle" fill="#facc15" fontSize="10.5" fontWeight="bold" fontFamily="system-ui, sans-serif">Z</text>
                </g>

                {/* Bauble 3: Dreaming "💤" sleep bubble */}
                <g className="animate-sleep-bubble-3">
                  <circle cx="0" cy="0" r="11.5" fill="#e0e7ff" fillOpacity="0.28" stroke="#818cf8" strokeWidth="0.9" />
                  <ellipse cx="-3.4" cy="-3.4" rx="3.8" ry="2.2" fill="#ffffff" fillOpacity="0.85" />
                  <text x="0" y="4.5" textAnchor="middle" fill="#eab308" fontSize="12.5" fontWeight="bold" fontFamily="system-ui, sans-serif">💤</text>
                </g>
              </g>
            </g>
          </g>

          {/* ================= 7. THE FELINE COMPANIONS ================= */}
          <g id="natural-cats-trio">
            {/* Cat 1: Sitting comfortably on the left branch, dangling and swinging its tail */}
            <BranchSittingCat transform="translate(268, 345)" />

            {/* Cat 2: Playfully chasing, dashing, jumping into the air, and swiping at the dancing firefly */}
            <PlayfulRootCat />

            {/* Cat 3: Strolling smoothly across the ground and root path */}
            <WalkingCat type="tuxedo" className="animate-cat-patrol-tuxedo" />
          </g>

          {/* ================= 6. NATURAL SUMMER FIREFLIES ================= */}
          <g id="natural-fireflies">
            {[
              { cx: 330, cy: 220, r: 1.8 },
              { cx: 640, cy: 190, r: 2.2 },
              { cx: 180, cy: 290, r: 1.6 },
              { cx: 820, cy: 280, r: 2.0 },
              { cx: 500, cy: 110, r: 2.4 },
              { cx: 240, cy: 450, r: 1.7 },
              { cx: 760, cy: 450, r: 1.9 },
            ].map((f, i) => (
              <g key={i} className="animate-pulse" style={{ animationDuration: `${2.6 + i * 0.4}s` }}>
                <circle cx={f.cx} cy={f.cy} r={f.r * 3} fill="#fde047" opacity="0.25" />
                <circle cx={f.cx} cy={f.cy} r={f.r} fill="#ffffff" />
              </g>
            ))}
          </g>

          {/* ================= 7. REAL INTERACTIVE WISH LEAVES ANCHORED EXACTLY ON BRANCHES ================= */}
          <g id="branch-wish-leaves">
            {wishes.map((item, index) => {
              const slot = EXACT_BRANCH_SLOTS[index % EXACT_BRANCH_SLOTS.length];
              const isCrownWish = index === 0;
              const swayDuration = 3.6 + (index % 4) * 0.4;
              const swayDelay = (index % 5) * 0.3;

              return (
                <g
                  key={item.id}
                  transform={`translate(${slot.bx}, ${slot.by})`}
                  className="pointer-events-auto cursor-pointer group"
                  onClick={() => handleOpenWish(item)}
                >
                  {/* Branch Bark Anchor Knot */}
                  <circle cx="0" cy="0" r="2.8" fill="#3a2215" stroke="#5a3922" strokeWidth="0.8" />

                  {/* Dynamic Hanging Stem & Leaf Blade Swaying together */}
                  <g
                    style={{
                      transformOrigin: '0px 0px',
                      animation: `leafHangSway ${swayDuration}s ease-in-out ${swayDelay}s infinite alternate`,
                    }}
                  >
                    {/* Natural curved wooden stem attached firmly into the bark */}
                    <path
                      d={`M 0 0 Q ${slot.angle > 0 ? 3 : -3} ${slot.stemLen * 0.5} 0 ${slot.stemLen}`}
                      stroke={isCrownWish ? '#f59e0b' : '#6b3f20'}
                      strokeWidth={isCrownWish ? '2.4' : '1.8'}
                      fill="none"
                      strokeLinecap="round"
                    />

                    {/* Leaf Blade hanging from the end of the stem */}
                    <g
                      transform={`translate(0, ${slot.stemLen}) rotate(${slot.angle})`}
                      className="transition-transform duration-300 group-hover:scale-125"
                    >
                      {/* Expanded transparent touch hitbox (60px diameter) for easy mobile tapping */}
                      <circle cx="0" cy="20" r="30" fill="transparent" className="cursor-pointer" />

                      {/* Subtle pulsing/glowing hover & tap indicator aura */}
                      <circle
                        cx="0"
                        cy="20"
                        r="24"
                        fill="url(#wishOrbAura)"
                        className="animate-pulse opacity-45 group-hover:opacity-95 group-active:scale-125 transition-all pointer-events-none"
                      />

                      {/* Crown Wish Golden Aura */}
                      {isCrownWish && (
                        <circle cx="0" cy="18" r="28" fill="url(#crownGlowGrad)" opacity="0.75" />
                      )}

                      {/* Leaf Blade Shape */}
                      <path
                        d="M 0 0 C 14 8 15 28 0 40 C -15 28 -14 8 0 0 Z"
                        fill={isCrownWish ? 'url(#crownLeafGrad)' : 'url(#goldWishLeafGrad)'}
                        stroke={isCrownWish ? '#ffffff' : '#fef08a'}
                        strokeWidth={isCrownWish ? '1.5' : '1.1'}
                        strokeOpacity="0.9"
                        filter={isCrownWish ? 'url(#leafDropShadowCrown)' : 'url(#leafDropShadowNormal)'}
                      />

                      {/* Leaf Midrib */}
                      <path
                        d="M 0 2 L 0 38"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        strokeOpacity="0.9"
                        strokeLinecap="round"
                      />

                      {/* Botanical Secondary Veins */}
                      <path
                        d="M 0 10 L 8 6 M 0 18 L 10 14 M 0 26 L 8 23"
                        stroke="#ffffff"
                        strokeWidth="0.85"
                        strokeOpacity="0.75"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 0 10 L -8 6 M 0 18 L -10 14 M 0 26 L -8 23"
                        stroke="#ffffff"
                        strokeWidth="0.85"
                        strokeOpacity="0.75"
                        strokeLinecap="round"
                      />

                      {/* Sparkling dewdrop on leaf tip */}
                      <circle cx="0" cy="6" r={isCrownWish ? '2.2' : '1.6'} fill="#ffffff" />
                    </g>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      )}

      {/* ================= MAGICAL GLASSMORPISM SCROLL MODAL (WITH 3D UNFOLDING ANIMATION) ================= */}
      {selectedWish && (
        <div
          id="wish-scroll-modal-backdrop"
          onClick={handleCloseWish}
          className={`fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
            isClosingModal ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div
            id="wish-glass-scroll"
            onClick={e => e.stopPropagation()}
            className={`relative w-full max-w-lg rounded-3xl p-6 md:p-8 backdrop-blur-2xl bg-[#0c0f1a]/95 border-2 border-amber-400/35 shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(212,175,55,0.18)] text-stone-100 select-none overflow-hidden ${
              isClosingModal ? 'animate-scroll-foldout' : 'animate-scroll-unfold'
            }`}
          >
            {/* Soft Ambient Inner Glow */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button (X) */}
            <button
              onClick={handleCloseWish}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-stone-400 hover:text-white transition-all cursor-pointer border border-white/10 shadow-sm"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Date Tag */}
            {selectedWish.dateStr && (
              <div className="mb-2">
                <span className="text-[11px] text-amber-200/60 font-serif tracking-wider">
                  {selectedWish.dateStr}
                </span>
              </div>
            )}

            {/* Glassmorphism Parchment Scroll Content */}
            <div className="relative p-5 md:p-6 rounded-2xl bg-gradient-to-br from-white/[0.05] to-amber-950/20 border border-amber-400/25 my-4 text-sm md:text-base font-serif italic text-amber-100 leading-relaxed shadow-inner">
              <span className="text-3xl font-serif text-amber-400/40 absolute top-2 left-2 pointer-events-none">“</span>
              <p className="px-3 py-1 relative z-10">{selectedWish.wish}</p>
              <span className="text-3xl font-serif text-amber-400/40 absolute bottom-1 right-3 pointer-events-none">”</span>
            </div>

            {/* Modal Actions: Delete & Close */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              {isDeletingId === selectedWish.id ? (
                /* Delete Confirmation */
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-300 font-sans">Delete?</span>
                  <button
                    onClick={() => handleDeleteWish(selectedWish.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-sans font-medium transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setIsDeletingId(null)}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-sans transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* Delete Trigger Button */
                <button
                  onClick={() => setIsDeletingId(selectedWish.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-sans transition-colors cursor-pointer"
                  title="Remove wish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}

              <button
                onClick={handleCloseWish}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:brightness-125 border border-amber-400/40 text-xs font-serif text-[#f5e6b3] transition-all cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DYNAMICALLY HANG A NEW WISH ON THE TREE ================= */}
      {showAddWishModal && (
        <div
          id="add-wish-modal-backdrop"
          onClick={() => setShowAddWishModal(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-[#0e111c] border-2 border-amber-400/30 p-6 md:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-stone-100 animate-zoomIn"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Feather className="w-4 h-4 text-[#d4af37]" />
                <h3 className="font-serif font-semibold text-sm text-[#f5e6b3] uppercase tracking-wider">
                  Add a Wish
                </h3>
              </div>
              <button
                onClick={() => {
                  sound.playButtonTap();
                  setShowAddWishModal(false);
                }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-serif leading-relaxed mb-3">
              Write a wish to hang on the tree.
            </p>

            <textarea
              id="new-tree-wish-input"
              value={newWishInput}
              onChange={e => setNewWishInput(e.target.value)}
              rows={4}
              maxLength={300}
              placeholder="Write your wish here..."
              className="w-full p-3.5 rounded-xl border border-stone-600/80 bg-black/50 text-stone-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 font-serif text-sm resize-none leading-relaxed shadow-inner"
            />

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-xs font-mono text-slate-400">
                {newWishInput.length} / 300
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sound.playButtonTap();
                    setShowAddWishModal(false);
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-lg text-slate-400 hover:text-white text-xs font-serif cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <button
                  id="confirm-hang-wish-btn"
                  onClick={handleAddNewWish}
                  disabled={!newWishInput.trim() || isSavingWish}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-serif font-semibold text-xs tracking-wider uppercase transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSavingWish ? 'Saving...' : 'Add Wish'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
