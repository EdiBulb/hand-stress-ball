# Hand Stress Ball — 재질별 디자인 프롬프트 (Claude 이미지 생성용)

스타일: **카툰풍 3D 토이 렌더**. Claude(claude.ai)의 이미지 생성 기능에 아래 프롬프트를 그대로 붙여넣으면 돼. 11개 전부 같은 스타일 가이드를 공유해서, 세트로 나열했을 때 톤이 통일되게 만들었어.

받은 이미지는 `src/materials/materials.ts`의 각 재질 `background`/`pattern`(CSS gradient) 대신 실제 PNG를 쓰도록 코드를 바꿀 거야. 그러니 아래 조건은 꼭 지켜서 받아줘:

- **정사각형 (1:1)**, 최소 1024×1024
- **배경 완전 투명** (PNG, transparent background) — 구체 하나만 프레임 중앙에
- 텍스트/워터마크/로고/브랜드명/사람 얼굴·손 없음
- 저작권 캐릭터(포켓몬 등) 연상되는 디테일 없음 — 이미 일반화된 컨셉으로 프롬프트 작성함

---

## 공통 스타일 가이드 (모든 프롬프트 앞에 붙여서 사용)

```
A single toy-like sphere ("stress ball") centered in frame, filling about 80% of the frame.
Cute rounded cartoon 3D toy render style, smooth clay-like shading, chunky toy proportions,
soft studio lighting from the upper-left, subtle glossy highlight, soft contact shadow directly
beneath the sphere. Vibrant saturated colors. NOT photorealistic. Square 1:1 composition,
completely transparent background (PNG cutout), no text, no watermark, no logo, no hands, no faces.
```

이 공통 문구 뒤에 아래 재질별 설명을 이어 붙이면 돼.

---

## 1. 왁뿌볼 (Wax Bubble Ball)
```
The sphere is a warm golden-yellow wax bubble ball, gradient from pale cream-yellow (#fef9c3)
at the top-left highlight to bright golden-yellow (#facc15) to a deeper amber (#ca8a04) at the
shadowed edge. The entire surface is covered in small raised circular bubble-wrap-like bumps,
evenly spaced, each bump catching a tiny glossy highlight. Rubbery, semi-translucent wax finish.
```

## 2. 지구본 (Globe)
```
The sphere is a toy globe: ocean gradient from pale sky-blue (#bae6fd) highlight to bright
blue (#38bdf8) to deep navy-blue (#0369a1) shadow. Scattered across the surface are simplified,
abstract blob-shaped continents in olive green, generic non-geographic shapes (not a real-world
map). Thin white longitude stripe lines wrap vertically around the sphere. Matte plastic toy-globe
finish, no stand or axis.
```

## 3. 오렌지 (Orange)
```
The sphere is a toy orange fruit: gradient from pale peach (#fed7aa) highlight to vivid orange
(#f97316) to a deep burnt-orange (#c2410c) shadow. The whole surface has a fine dimpled citrus-peel
texture — small evenly-spaced pores/dimples across the entire sphere. Glossy toy-fruit finish with
a slight waxy sheen.
```

## 4. 물 (Water)
```
The sphere looks like a water balloon: translucent gradient from very pale blue (#e0f2fe)
highlight to bright blue (#38bdf8) to deep blue (#1d4ed8) shadow, with a soft see-through, jelly-like
quality. Diagonal wavy light streaks and ripple highlights run across the surface, suggesting
sloshing liquid inside. Wet glossy highlight, slightly wobbly asymmetric silhouette instead of a
perfect sphere.
```

## 5. 모래 (Sand)
```
The sphere is a packed sand ball: gradient from pale cream (#fef3c7) highlight to warm yellow-gold
(#eab308) to a deep tan-brown (#a16207) shadow. Entire surface has a fine, evenly-scattered grainy
sand-speckle texture (tiny darker brown dots), completely matte with no gloss, like dry desert sand
packed into a ball.
```

## 6. 나무 (Wood)
```
The sphere is a carved wooden ball toy: gradient from light tan wood (#d6b98c) highlight to
medium brown (#92643a) to a dark walnut-brown (#5c3a21) shadow. The surface shows clear
concentric tree-ring grain patterns wrapping around the curvature of the sphere, like a
cross-section of a tree trunk carved into a ball. Matte varnished wood finish, no gloss.
```

## 7. 독가스 볼 (Toxic Gas Ball)
```
A generic, non-character toxic ooze ball (not based on any existing franchise): gradient from
sickly pale yellow-green (#d9f99d) highlight to murky green (#65a30d) to near-black dark green
(#1a2e05) shadow. Surface has irregular swirling darker-green smoky blob patterns and small
bubbling pore-like dots, glossy wet ooze finish, with a very faint glowing green mist hugging the
edge of the sphere. No face, no eyes, no character features — purely an abstract toxic-slime orb.
```

## 8. 찌릿볼 (Static Ball)
```
A generic, non-character electric-charge ball (not based on any existing franchise): gradient
from pale yellow (#fef08a) highlight to golden yellow (#eab308) to dark amber-brown (#713f12)
shadow. The surface is covered in a radiating pattern of thin jagged lightning-bolt spikes,
evenly distributed like a sea-urchin, each spike tip glowing with a small yellow electric spark.
Glossy, charged-up look. No face, no eyes, no character features — purely an abstract electric orb.
```

## 9. 슬라임/젤리 (Slime/Jelly)
```
The sphere is a translucent slime/jelly ball: gradient from pale mint-green (#bbf7d0) highlight
to bright green (#22c55e) to deep forest-green (#15803d) shadow. Semi-transparent, gooey jelly
material with a few faint trapped air bubbles visible inside, glossy wet blob-shaped highlights
on the surface, slightly drippy irregular silhouette (not a perfectly smooth sphere).
```

## 10. 눈덩이 (Snowball)
```
The sphere is a tightly packed snowball: gradient from pure white (#ffffff) highlight to very
pale ice-blue (#e0f2fe) to soft blue (#bae6fd) shadow. Surface has a fine icy speckled texture
(tiny sparkling crystal-like bumps), matte-frosted finish (not glossy), dense and compact —
packed snow rather than light fluffy snow.
```

## 11. 벽돌 (Brick)
```
The sphere is shaped like a brick ball: gradient from warm terracotta-orange (#c2703d) highlight
to deep brick-red (#7c2d12) shadow. A brick-and-mortar grid pattern wraps around the curved
surface — rows of small rectangular brick shapes separated by dark recessed mortar lines that
follow the sphere's curvature. Rough matte masonry texture, heavy solid toy-brick look, no gloss.
```

---

## 받은 후 진행 방식

11장 다 나오면 나한테 보내줘 (파일명은 `wax-bubble.png`, `globe.png`, `orange.png`, `water.png`, `sand.png`, `wood.png`, `toxic-gas.png`, `static.png`, `slime.png`, `snowball.png`, `brick.png` 이렇게 `materials.ts`의 `id`값으로 주면 나는 그대로 매핑만 하면 돼). 받으면 각 재질의 `background`를 이미지로 교체하고, 쥐는 정도에 따른 찌그러짐(squish)·하이라이트 오버레이는 지금처럼 CSS로 그대로 얹을게.
